/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, getNumericDate } from 'https://deno.land/x/djwt@v2.9.1/mod.ts'

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

// Helper for consistent error responses
function errorResponse(message: string, status = 400) {
  console.error(`[FINGENIE] ${message}`)
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

// Helper to convert string to ArrayBuffer
function str2ab(str: string) {
  const buf = new ArrayBuffer(str.length)
  const bufView = new Uint8Array(buf)
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

// Get Google Auth Token for Vertex AI
async function getGoogleAuthToken() {
  const serviceAccountBase64 = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64")
  if (!serviceAccountBase64) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 environment variable is not set")
  }
  
  let credentials
  try {
    const cleanedBase64 = serviceAccountBase64.replace(/\s/g, '')
    const serviceAccountJson = atob(cleanedBase64)
    credentials = JSON.parse(serviceAccountJson)
  } catch (error) {
    console.error('Base64 decoding error:', error)
    throw new Error(`Failed to decode service account JSON: ${error.message}`)
  }

  const pem = credentials.private_key
  const pemHeader = "-----BEGIN PRIVATE KEY-----"
  const pemFooter = "-----END PRIVATE KEY-----"
  const pemContents = pem.replace(/\\n/g, "").substring(pemHeader.length, pem.length - pemFooter.length + 1)
  const binaryDer = atob(pemContents)

  const key = await crypto.subtle.importKey(
    "pkcs8",
    str2ab(binaryDer),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    true,
    ["sign"]
  )

  const jwt = await create({ alg: "RS256", typ: "JWT" }, {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: getNumericDate(3600),
    iat: getNumericDate(0),
  }, key)

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  })

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get Google access token: ${await tokenResponse.text()}`)
  }

  const tokenData = await tokenResponse.json()
  return { token: tokenData.access_token, projectId: credentials.project_id }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Missing or invalid authorization header', 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return errorResponse(userError?.message || 'Invalid token', 401)
    }

    // 2. Get request body
    const { query } = await req.json()
    if (!query || query.trim().length === 0) {
      return errorResponse('Missing or empty query')
    }

    // Sanitize input
    const sanitizedQuery = query.trim().slice(0, 2000)

    // 3. Fetch user's portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolio_holdings')
      .select('symbol, quantity, purchase_price, purchase_date')
      .eq('user_id', user.id)

    let portfolioContext = '\n\nUSER PORTFOLIO: User has no portfolio holdings yet.'
    if (portfolio && portfolio.length > 0) {
      portfolioContext = `\n\nUSER PORTFOLIO:\n${portfolio.map((h: PortfolioHolding) => 
        `- ${h.symbol}: ${h.quantity} shares @ ₹${h.purchase_price} (bought ${h.purchase_date})`
      ).join('\n')}`
    }

    // 4. Extract stock symbols from query
    const symbolRegex = /\b([A-Z]{2,10})\b/g
    const symbols = [...new Set([...sanitizedQuery.matchAll(symbolRegex)].map(m => m[1]))]
    
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
          
          if (!response.ok) return null
          
          const data = await response.json()
          
          // Cache it
          await supabase.from('stock_prices_cache').upsert({
            symbol,
            price: data.price || data.close,
            change_percent: data.change_percent || data.pChange,
            volume: data.volume,
            timestamp: new Date().toISOString()
          })
          
          return { symbol, price: data.price || data.close, change_percent: data.change_percent || data.pChange }
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
- Keep responses concise and actionable

MANDATORY DISCLAIMER:
"⚠️ This is educational content, not investment advice. Consult a SEBI-registered advisor for personalized recommendations."`

    // 8. Call Vertex AI Gemini
    const { token: googleToken, projectId } = await getGoogleAuthToken()
    const region = "asia-south1"
    
    // Determine model based on query complexity
    const isComplex = sanitizedQuery.length > 100 || 
                     sanitizedQuery.toLowerCase().includes('analyze') ||
                     sanitizedQuery.toLowerCase().includes('portfolio')
    const model = isComplex ? 'gemini-1.5-pro' : 'gemini-1.5-flash'
    
    const vertex_ai_endpoint = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:generateContent`

    const vertexRequestBody = {
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: sanitizedQuery }] }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 0.9,
        topK: 40
      }
    }

    const vertexResponse = await fetch(vertex_ai_endpoint, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${googleToken}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(vertexRequestBody),
    })

    if (!vertexResponse.ok) {
      const errorText = await vertexResponse.text()
      console.error('Vertex AI error:', errorText)
      throw new Error(`Vertex AI API request failed: ${errorText}`)
    }

    const responseJson = await vertexResponse.json()
    const aiResponseText = responseJson.candidates[0].content.parts[0].text

    // 9. Save conversation to history
    await supabase.from('conversations').insert({
      user_id: user.id,
      user_message: sanitizedQuery,
      bot_response: aiResponseText,
      model_used: model,
      tokens_used: responseJson.usageMetadata?.totalTokenCount || 0
    })

    // 10. Log API usage
    await supabase.from('api_usage_log').insert({
      api_name: 'gemini',
      endpoint: model,
      user_id: user.id,
      status_code: 200,
      response_time_ms: 0
    })

    return new Response(JSON.stringify({ response: aiResponseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('FinGenie error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
