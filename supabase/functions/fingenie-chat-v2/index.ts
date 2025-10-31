// Enhanced FinGenie with OpenAI + Indian API + Portfolio Context
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PortfolioHolding {
  symbol: string
  quantity: number
  purchase_price: number
  purchase_date: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Get request body
    const { query } = await req.json()
    if (!query) {
      return new Response(JSON.stringify({ error: 'Missing query' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Fetch user's portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolio_holdings')
      .select('symbol, quantity, purchase_price, purchase_date')
      .eq('user_id', user.id)

    const portfolioContext = portfolio && portfolio.length > 0
      ? `\n\nUSER'S PORTFOLIO:\n${portfolio.map((h: PortfolioHolding) => 
          `- ${h.symbol}: ${h.quantity} shares @ ₹${h.purchase_price} (bought ${h.purchase_date})`
        ).join('\n')}`
      : '\n\nUser has no portfolio holdings yet.'

    // 4. Extract stock symbols from query
    const symbolRegex = /\b([A-Z]{2,10})\b/g
    const symbols = [...new Set([...query.matchAll(symbolRegex)].map(m => m[1]))]
    
    // 5. Fetch real-time prices for mentioned symbols (with caching)
    let priceContext = ''
    if (symbols.length > 0 && symbols.length <= 5) {
      const pricePromises = symbols.map(async (symbol) => {
        // Check cache first (1 min TTL)
        const { data: cached } = await supabase
          .from('stock_prices_cache')
          .select('*')
          .eq('symbol', symbol)
          .gte('timestamp', new Date(Date.now() - 60000).toISOString())
          .single()

        if (cached) return cached

        // Fetch from Indian API
        try {
          const response = await fetch(
            `${Deno.env.get('INDIAN_API_BASE_URL')}/stock/realtime/${symbol}`,
            { headers: { 'X-Api-Key': Deno.env.get('INDIAN_API_KEY') ?? '' } }
          )
          const data = await response.json()
          
          // Cache it
          await supabase.from('stock_prices_cache').upsert({
            symbol,
            price: data.price,
            change_percent: data.change_percent,
            volume: data.volume,
            timestamp: new Date().toISOString()
          })
          
          return data
        } catch (e) {
          console.error(`Error fetching price for ${symbol}:`, e)
          return null
        }
      })

      const prices = await Promise.all(pricePromises)
      const validPrices = prices.filter(p => p !== null)
      
      if (validPrices.length > 0) {
        priceContext = `\n\nCURRENT MARKET DATA:\n${validPrices.map(p => 
          `- ${p.symbol}: ₹${p.price} (${p.change_percent > 0 ? '+' : ''}${p.change_percent}%)`
        ).join('\n')}`
      }
    }

    // 6. Fetch latest news (cached 5 min)
    const { data: news } = await supabase
      .from('news_cache')
      .select('title, source, published_at')
      .gte('cached_at', new Date(Date.now() - 300000).toISOString())
      .order('published_at', { ascending: false })
      .limit(3)

    const newsContext = news && news.length > 0
      ? `\n\nLATEST MARKET NEWS:\n${news.map(n => `- ${n.title} (${n.source})`).join('\n')}`
      : ''

    // 7. Build system prompt
    const systemPrompt = `You are FinGenie, a professional financial advisor for Indian investors.

RESPONSE FORMAT:
1. **Direct Answer** (2-3 sentences)
2. **Key Points** (3-5 bullet points)
3. **Recommendation** (if applicable)
4. **Disclaimer** (always include)

CONTEXT:${portfolioContext}${priceContext}${newsContext}

RULES:
- Use Indian terminology (₹, lakhs, crores, NSE, BSE, NIFTY, SENSEX)
- Cite data sources when using market data
- Never guarantee returns or specific outcomes
- Be conversational but professional
- If user asks about their portfolio, analyze their actual holdings

MANDATORY DISCLAIMER:
"⚠️ This is educational content, not investment advice. Consult a SEBI-registered advisor for personalized recommendations."`

    // 8. Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: query.length > 100 || query.toLowerCase().includes('analyze') ? 'gpt-4o' : 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${await openaiResponse.text()}`)
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0].message.content

    // 9. Save conversation to history
    await supabase.from('conversations').insert({
      user_id: user.id,
      user_message: query,
      bot_response: aiResponse,
      model_used: openaiData.model,
      tokens_used: openaiData.usage.total_tokens
    })

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('FinGenie error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
