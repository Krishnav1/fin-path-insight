/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Ratelimit } from 'https://esm.sh/@upstash/ratelimit@0.4.4'
import { Redis } from 'https://esm.sh/@upstash/redis@1.22.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Initialize Upstash Redis for rate limiting
const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_REST_URL') || '',
  token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '',
})

// Rate limiters
const rateLimitFree = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'), // 20 requests per hour for free users
  analytics: true,
})

const rateLimitPro = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour for pro users
  analytics: true,
})

interface CacheConfig {
  table: string
  ttl: number // milliseconds
  keyField: string
}

const CACHE_CONFIG: Record<string, CacheConfig> = {
  'stock_price': { table: 'stock_prices_cache', ttl: 60000, keyField: 'symbol' }, // 1 min
  'fundamentals': { table: 'company_fundamentals', ttl: 86400000, keyField: 'symbol' }, // 24 hours
  'history': { table: 'stock_history', ttl: 3600000, keyField: 'symbol' }, // 1 hour
  'news': { table: 'news_cache_indian', ttl: 300000, keyField: 'id' }, // 5 min
  'indices': { table: 'market_indices_cache', ttl: 60000, keyField: 'index_name' }, // 1 min
}

function errorResponse(message: string, status = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function checkCache(supabase: any, cacheType: string, key: string) {
  const config = CACHE_CONFIG[cacheType]
  if (!config) return null

  const cutoff = new Date(Date.now() - config.ttl).toISOString()
  
  let query = supabase
    .from(config.table)
    .select('*')
    .eq(config.keyField, key)

  // Add timestamp filter based on table
  if (config.table === 'stock_prices_cache') {
    query = query.gte('timestamp', cutoff)
  } else if (config.table === 'news_cache_indian') {
    query = query.gte('cached_at', cutoff)
  } else if (config.table === 'company_fundamentals') {
    query = query.gte('last_updated', cutoff)
  } else if (config.table === 'market_indices_cache') {
    query = query.gte('timestamp', cutoff)
  }

  const { data, error } = await query.single()
  
  if (error || !data) return null
  return data
}

async function fetchFromIndianAPI(endpoint: string) {
  const INDIAN_API_KEY = Deno.env.get('INDIAN_API_KEY')
  const INDIAN_API_BASE_URL = Deno.env.get('INDIAN_API_BASE_URL')

  if (!INDIAN_API_KEY || !INDIAN_API_BASE_URL) {
    throw new Error('Indian API credentials not configured')
  }

  const response = await fetch(`${INDIAN_API_BASE_URL}${endpoint}`, {
    headers: { 'X-Api-Key': INDIAN_API_KEY }
  })

  if (!response.ok) {
    throw new Error(`Indian API error: ${response.status}`)
  }

  return await response.json()
}

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.replace('/indian-market-data', '')
    
    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse('Missing authorization', 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return errorResponse('Invalid token', 401)
    }

    // Rate limiting
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const isPro = profile?.subscription_tier === 'pro'
    const rateLimit = isPro ? rateLimitPro : rateLimitFree
    const { success, remaining } = await rateLimit.limit(user.id)

    if (!success) {
      return errorResponse(`Rate limit exceeded. ${remaining} requests remaining.`, 429)
    }

    // Route handling
    if (path.startsWith('/stock/realtime/')) {
      const symbol = path.split('/')[3]
      
      // Check cache
      const cached = await checkCache(supabase, 'stock_price', symbol)
      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
        })
      }

      // Fetch from Indian API
      const data = await fetchFromIndianAPI(`/stock/realtime/${symbol}`)
      
      // Update cache
      await supabase.from('stock_prices_cache').upsert({
        symbol,
        price: data.price || data.close,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        change_percent: data.change_percent || data.pChange,
        volume: data.volume,
        timestamp: new Date().toISOString()
      })

      // Log API usage
      await supabase.from('api_usage_log').insert({
        api_name: 'indian_api',
        endpoint: `/stock/realtime/${symbol}`,
        user_id: user.id,
        status_code: 200
      })

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
      })
    }

    if (path.startsWith('/stock/fundamentals/')) {
      const symbol = path.split('/')[3]
      
      const cached = await checkCache(supabase, 'fundamentals', symbol)
      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
        })
      }

      const data = await fetchFromIndianAPI(`/company/fundamentals/${symbol}`)
      
      await supabase.from('company_fundamentals').upsert({
        symbol,
        company_name: data.company_name || data.name,
        sector: data.sector,
        industry: data.industry,
        market_cap: data.market_cap || data.marketCap,
        pe_ratio: data.pe_ratio || data.peRatio,
        pb_ratio: data.pb_ratio || data.pbRatio,
        roe: data.roe || data.returnOnEquity,
        debt_to_equity: data.debt_to_equity || data.debtToEquity,
        dividend_yield: data.dividend_yield || data.dividendYield,
        revenue: data.revenue,
        profit: data.profit || data.netIncome,
        eps: data.eps,
        book_value: data.book_value || data.bookValue,
        data: data,
        last_updated: new Date().toISOString()
      })

      await supabase.from('api_usage_log').insert({
        api_name: 'indian_api',
        endpoint: `/company/fundamentals/${symbol}`,
        user_id: user.id,
        status_code: 200
      })

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
      })
    }

    if (path.startsWith('/stock/history/')) {
      const symbol = path.split('/')[3]
      const period = url.searchParams.get('period') || '1M'
      
      const data = await fetchFromIndianAPI(`/stock/history/${symbol}?period=${period}`)
      
      // Store in stock_history table
      if (data && Array.isArray(data.history)) {
        const historyData = data.history.map((item: any) => ({
          symbol,
          date: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume
        }))

        await supabase.from('stock_history').upsert(historyData, {
          onConflict: 'symbol,date'
        })
      }

      await supabase.from('api_usage_log').insert({
        api_name: 'indian_api',
        endpoint: `/stock/history/${symbol}`,
        user_id: user.id,
        status_code: 200
      })

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (path === '/market/indices') {
      const data = await fetchFromIndianAPI('/market/indices')
      
      // Update cache for each index
      if (data && Array.isArray(data.indices)) {
        for (const index of data.indices) {
          await supabase.from('market_indices_cache').upsert({
            index_name: index.name,
            value: index.value,
            change: index.change,
            change_percent: index.change_percent,
            timestamp: new Date().toISOString()
          })
        }
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (path === '/market/news') {
      const limit = url.searchParams.get('limit') || '10'
      const symbol = url.searchParams.get('symbol')
      
      const endpoint = symbol 
        ? `/news?symbol=${symbol}&limit=${limit}`
        : `/news?limit=${limit}`
      
      const data = await fetchFromIndianAPI(endpoint)
      
      // Cache news
      if (data && Array.isArray(data.news)) {
        const newsData = data.news.map((item: any) => ({
          title: item.title,
          description: item.description,
          url: item.url,
          source: item.source,
          image_url: item.image_url,
          published_at: item.published_at,
          category: item.category,
          symbols: item.symbols || [],
          cached_at: new Date().toISOString()
        }))

        await supabase.from('news_cache_indian').insert(newsData)
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (path === '/market/top-gainers') {
      const data = await fetchFromIndianAPI('/market/top-gainers')
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (path === '/market/top-losers') {
      const data = await fetchFromIndianAPI('/market/top-losers')
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return errorResponse('Invalid endpoint', 404)

  } catch (error: any) {
    console.error('Error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
