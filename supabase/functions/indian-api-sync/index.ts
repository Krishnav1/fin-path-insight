/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role for admin access
    )

    const INDIAN_API_KEY = Deno.env.get('INDIAN_API_KEY')
    const INDIAN_API_BASE_URL = Deno.env.get('INDIAN_API_BASE_URL')

    if (!INDIAN_API_KEY || !INDIAN_API_BASE_URL) {
      throw new Error('Indian API credentials not configured')
    }

    console.log('Starting Indian API sync...')

    // 1. Fetch top 100 NSE stocks (by market cap)
    const topSymbols = [
      'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'ITC', 'SBIN',
      'BHARTIARTL', 'KOTAKBANK', 'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'HCLTECH',
      'BAJFINANCE', 'WIPRO', 'ULTRACEMCO', 'TITAN', 'SUNPHARMA', 'NESTLEIND', 'ONGC',
      'NTPC', 'TATAMOTORS', 'TATASTEEL', 'POWERGRID', 'M&M', 'JSWSTEEL', 'ADANIPORTS',
      'TECHM', 'INDUSINDBK', 'DRREDDY', 'CIPLA', 'EICHERMOT', 'BAJAJFINSV', 'COALINDIA',
      'DIVISLAB', 'GRASIM', 'SHREECEM', 'BRITANNIA', 'APOLLOHOSP', 'BPCL', 'HINDALCO',
      'TATACONSUM', 'HEROMOTOCO', 'ADANIENT', 'SBILIFE', 'UPL', 'HDFCLIFE', 'BAJAJ-AUTO'
    ]

    let syncedCount = 0
    let errorCount = 0

    // 2. Sync fundamentals for each stock
    for (const symbol of topSymbols) {
      try {
        // Fetch fundamentals from Indian API
        const response = await fetch(
          `${INDIAN_API_BASE_URL}/company/fundamentals/${symbol}`,
          { headers: { 'X-Api-Key': INDIAN_API_KEY } }
        )

        if (!response.ok) {
          console.error(`Failed to fetch ${symbol}: ${response.status}`)
          errorCount++
          continue
        }

        const data = await response.json()

        // Store in Supabase
        const { error } = await supabase
          .from('company_fundamentals')
          .upsert({
            symbol: symbol,
            company_name: data.company_name || data.name || symbol,
            sector: data.sector || 'Unknown',
            industry: data.industry || 'Unknown',
            market_cap: data.market_cap || data.marketCap || 0,
            pe_ratio: data.pe_ratio || data.peRatio || 0,
            pb_ratio: data.pb_ratio || data.pbRatio || 0,
            roe: data.roe || data.returnOnEquity || 0,
            debt_to_equity: data.debt_to_equity || data.debtToEquity || 0,
            dividend_yield: data.dividend_yield || data.dividendYield || 0,
            revenue: data.revenue || 0,
            profit: data.profit || data.netIncome || 0,
            eps: data.eps || 0,
            book_value: data.book_value || data.bookValue || 0,
            data: data, // Store full response
            last_updated: new Date().toISOString()
          })

        if (error) {
          console.error(`Error storing ${symbol}:`, error)
          errorCount++
        } else {
          syncedCount++
          console.log(`✓ Synced ${symbol}`)
        }

        // Rate limit: 1 request/second
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`Error processing ${symbol}:`, error)
        errorCount++
      }
    }

    console.log(`Sync complete: ${syncedCount} synced, ${errorCount} errors`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: syncedCount, 
        errors: errorCount,
        total: topSymbols.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
