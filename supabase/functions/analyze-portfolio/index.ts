// Supabase Edge Function for Portfolio Analysis
// This function analyzes portfolio holdings using Google's Gemini API
// Requires authentication since it deals with user portfolio data

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Helper to get Google service account credentials from environment variables
function getGoogleServiceAccount(): Record<string, unknown> {
  let rawJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!rawJson) {
    const base64 = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON_BASE64');
    if (base64) {
      rawJson = atob(base64);
    }
  }
  if (!rawJson) {
    throw new Error('Google service account JSON not found in environment variables.');
  }
  return JSON.parse(rawJson);
}

// CORS headers for Supabase Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Helper for error responses
function errorResponse(message: string, status = 400) {
  console.error(`[ANALYZE-PORTFOLIO] ${message}`);
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

// Get Supabase URL and key from environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// Helper to check authentication - returns user or null
async function getUserFromToken(authHeader: string | null): Promise<any> {
  if (!authHeader || !authHeader.startsWith('Bearer ') || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.error('[Auth] Invalid token:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('[Auth] Error validating token:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Check authentication - this endpoint requires authentication
  const authHeader = req.headers.get('Authorization');
  const user = await getUserFromToken(authHeader);
  
  if (!user) {
    return errorResponse('Authentication required. Please log in.', 401);
  }
  
  // Log authenticated user (but don't expose sensitive details)
  console.log(`[ANALYZE-PORTFOLIO] Authenticated request from user: ${user.id}`);

  // Only accept POST requests
  if (req.method !== "POST") {
    return errorResponse("Method Not Allowed", 405);
  }

  try {
    // Parse request body
    const body = await req.json();
    
    // Extract holdings data from request
    const { holdings } = body;

    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return errorResponse("Missing or invalid holdings data in request body", 400);
    }

    // --- Vertex AI with Service Account (Production) ---
    // 1. Get service account credentials
    const credentials = getGoogleServiceAccount();
    const projectId = credentials.project_id as string;
    const vertexRegion = 'us-central1'; // Change if your Vertex AI is in another region
    
    // 2. Get OAuth2 access token using service account
    // (Deno-compatible JWT signing)
    async function getAccessToken() {
      const header = { alg: 'RS256', typ: 'JWT' };
      const iat = Math.floor(Date.now() / 1000);
      const exp = iat + 60 * 60; // 1 hour
      const payload = {
        iss: credentials.client_email,
        sub: credentials.client_email,
        aud: 'https://oauth2.googleapis.com/token',
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        iat,
        exp,
      };
      function base64url(obj: object) {
        return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      }
      const enc = new TextEncoder();
      const toSign = `${base64url(header)}.${base64url(payload)}`;
      const keyData = credentials.private_key as string;
      const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        (function pemToArrayBuffer(pem: string) {
          const b64 = pem.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s+/g, '');
          const binary = atob(b64);
          const buf = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
          return buf.buffer;
        })(keyData),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, enc.encode(toSign));
      const jwt = `${toSign}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
      // Exchange JWT for access token
      const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
      });
      const tokenJson = await tokenResp.json();
      if (!tokenJson.access_token) throw new Error('Failed to get access token');
      return tokenJson.access_token;
    }

    // 3. Prepare the prompt
    const prompt = `
You are a Senior Equity Research Analyst assisting users on a financial platform called FinGenie. A user has entered their portfolio holdings.

Your job is to analyze the data and provide insightful, personalized, and jargon-free feedback for a retail investor. Use simple language but offer genuine financial intelligence. Base all analysis only on the data below (no external API or live data).

📊 PORTFOLIO HOLDINGS:
${JSON.stringify(holdings, null, 2)}

📊 ANALYSIS TASKS:

1. **Portfolio Overview**
   - Total invested amount
   - Current market value
   - Absolute and % Returns
   - Best & Worst Performing Stock (based on % return)

2. **Stock-Level Breakdown**
   - % Gain/Loss per stock
   - Highlight top gainers (e.g. >10%) and underperformers (<-10%)

3. **Diversification & Risk**
   - Sector exposure breakdown in %
   - Check for concentration risks (e.g. >50% in one sector)
   - Is the portfolio well-diversified?

4. **Insights & Recommendations**
   - Suggest stocks to hold, reallocate, or consider selling
   - Recommend sector/stock types for diversification
   - Mention if any red flags in risk

5. **One-paragraph Summary**
   Write a friendly and clear closing summary. Example:
   "Your portfolio has grown by 5.2%, driven by Tata Power. However, HDFC Bank is under pressure. Consider reducing exposure to Banking."

🧾 OUTPUT FORMAT (strictly in JSON):

{
  "overview": {
    "total_invested": "...",
    "market_value": "...",
    "absolute_return": "...",
    "percent_return": "...",
    "top_gainer": "...",
    "worst_performer": "..."
  },
  "stock_breakdown": [
    {
      "symbol": "...",
      "sector": "...",
      "percent_gain": "...",
      "recommendation": "Hold / Exit / Watch"
    },
    ...
  ],
  "diversification": {
    "sector_breakdown": {
      "IT": "40%",
      "Banking": "30%",
      "Energy": "30%"
    },
    "risk_flag": "High / Medium / Low"
  },
  "recommendations": [
    "Consider diversifying into FMCG or Pharma",
    "Book partial profit in Tata Power",
    ...
  ],
  "summary": "..."
}

Only use the data provided. Don't assume any external or real-time info.
    `;

    // 4. Get access token
    const accessToken = await getAccessToken();

    // 5. Call Vertex AI Text Generation endpoint
    const apiUrl = `https://${vertexRegion}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${vertexRegion}/publishers/google/models/gemini-1.5-pro:generateContent`;
    const vertexBody = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
    };
    const vertexResp = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(vertexBody)
    });
    const vertexJson = await vertexResp.json();
    if (!vertexJson.candidates || !vertexJson.candidates[0]?.content?.parts[0]?.text) {
      return new Response(
        JSON.stringify({ error: 'Vertex AI did not return a valid response', rawResponse: vertexJson }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    let analysisText = vertexJson.candidates[0].content.parts[0].text;

    // Try to parse the response as JSON
    let analysisJson;
    try {
      // Extract JSON from the response if it's wrapped in markdown code blocks
      if (analysisText.includes('```json')) {
        analysisText = analysisText.split('```json')[1].split('```')[0].trim();
      } else if (analysisText.includes('```')) {
        analysisText = analysisText.split('```')[1].split('```')[0].trim();
      }
      analysisJson = JSON.parse(analysisText);
    } catch (jsonError) {
      console.error('Error parsing Vertex AI response as JSON:', jsonError);
      console.log('Raw response:', analysisText);
      return new Response(
        JSON.stringify({ error: 'Failed to parse analysis results as JSON', rawResponse: analysisText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ 
        analysis: analysisJson, 
        timestamp: new Date().toISOString(),
        userId: user.id // Include the user ID for client-side verification
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          'X-Auth-Status': 'authenticated'
        }
      }
    );
  } catch (error) {
    console.error('Error processing portfolio analysis request:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown server error', 500);
  }
})
