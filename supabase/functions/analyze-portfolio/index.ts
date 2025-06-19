/// <reference types="https://deno.land/x/deno/cli/types/dts/index.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { create, getNumericDate } from 'https://deno.land/x/djwt@v2.9.1/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Define the structure for the analysis response, matching the frontend
interface GeminiAnalysis {
  overview: {
    total_invested: string;
    market_value: string;
    absolute_return: string;
    percent_return: string;
    top_gainer: string;
    worst_performer: string;
  };
  stock_breakdown: Array<{
    symbol: string;
    sector: string;
    percent_gain: string;
    recommendation: string;
  }>;
  diversification: {
    sector_breakdown: Record<string, string>;
    risk_flag: 'High' | 'Medium' | 'Low';
  };
  recommendations: string[];
  summary: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function errorResponse(message: string, status = 400) {
  console.error(`[ANALYZE-PORTFOLIO] ${message}`);
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function str2ab(str: string) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

async function getGoogleAuthToken() {
  const serviceAccountBase64 = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64");
  if (!serviceAccountBase64) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 environment variable is not set");
  }
  const serviceAccountJson = atob(serviceAccountBase64);
  const credentials = JSON.parse(serviceAccountJson);

  const pem = credentials.private_key;
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pem.replace(/\\n/g, "").substring(pemHeader.length, pem.length - pemFooter.length + 1);
  const binaryDer = atob(pemContents);

  const key = await crypto.subtle.importKey(
    "pkcs8",
    str2ab(binaryDer),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    true,
    ["sign"]
  );

  const jwt = await create({ alg: "RS256", typ: "JWT" }, {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: getNumericDate(3600),
    iat: getNumericDate(0),
  }, key);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get Google access token: ${await tokenResponse.text()}`);
  }

  const tokenData = await tokenResponse.json();
  return { token: tokenData.access_token, projectId: credentials.project_id };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Missing or invalid authorization header', 401);
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return errorResponse(userError?.message || 'Invalid token', 401);
    }

    const { portfolio } = await req.json();
    if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) {
      return errorResponse('Missing or invalid portfolio data in request body');
    }

    const { token: googleToken, projectId } = await getGoogleAuthToken();
    const region = "asia-south1";
    const vertex_ai_endpoint = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/gemini-1.5-pro:generateContent`;

    const holdingsString = portfolio.map(p => `${p.symbol}: ${p.quantity} shares`).join(', ');
    const prompt = `
      You are a world-class financial analyst AI, FinGenie. Your task is to provide a comprehensive analysis of the user's stock portfolio.
      The user's current holdings are: ${holdingsString}.

      You MUST return your analysis as a single, minified JSON object with no markdown formatting. The JSON object must strictly adhere to the following structure:
      A root object with keys: "overview", "stock_breakdown", "diversification", "recommendations", "summary".
      - "overview": an object with string keys "total_invested", "market_value", "absolute_return", "percent_return", "top_gainer", "worst_performer".
      - "stock_breakdown": an array of objects, each with string keys "symbol", "sector", "percent_gain", "recommendation".
      - "diversification": an object with key "sector_breakdown" (which is an object of string to string like {"Tech":"50%"}) and "risk_flag" (a string: "High", "Medium", or "Low").
      - "recommendations": an array of 3-5 strings.
      - "summary": a concise 2-3 sentence string.

      Analyze the provided holdings and generate the complete JSON object. Ensure all fields are populated with realistic, insightful, and data-driven strings. For fields requiring calculations (like returns), make reasonable assumptions based on the provided holdings.
    `;

    const vertexRequestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      "generationConfig": {
        "responseMimeType": "application/json",
      }
    };

    const vertexResponse = await fetch(vertex_ai_endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${googleToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(vertexRequestBody),
    });

    if (!vertexResponse.ok) {
      const errorText = await vertexResponse.text();
      return errorResponse(`Vertex AI API request failed: ${errorText}`, vertexResponse.status);
    }

    const responseJson = await vertexResponse.json();
    const analysisText = responseJson.candidates[0].content.parts[0].text;

    const analysis: GeminiAnalysis = JSON.parse(analysisText);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return errorResponse(error.message, 500);
  }
});
// This function analyzes portfolio holdings using Google's Gemini API
// Requires authentication since it deals with user portfolio data

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { create, getNumericDate } from 'https://deno.land/x/djwt@v2.9.1/mod.ts';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    return new Response('ok', { headers: corsHeaders });
  }

  // Helper to standardize holdings for analysis
  function standardizeHoldings(holdings: any[]) {
    return holdings.map(holding => {
      const standardized = { ...holding };
      if (standardized.symbol) {
        standardized.symbol = standardized.symbol.split('.')[0];
      }
      if (standardized.currentPrice && typeof standardized.currentPrice !== 'number') {
        standardized.currentPrice = parseFloat(standardized.currentPrice) || 0;
      }
      return standardized;
    });
  }

  // Ensures the AI response matches the GeminiAnalysis interface shape
  function ensureGeminiAnalysisShape(obj: any): any {
    return {
      overview: {
        total_invested: obj?.overview?.total_invested ?? '',
        market_value: obj?.overview?.market_value ?? '',
        absolute_return: obj?.overview?.absolute_return ?? '',
        percent_return: obj?.overview?.percent_return ?? '',
        top_gainer: obj?.overview?.top_gainer ?? '',
        worst_performer: obj?.overview?.worst_performer ?? ''
      },
      stock_breakdown: Array.isArray(obj?.stock_breakdown) ? obj.stock_breakdown.map((s: any) => ({
        symbol: s?.symbol ?? '',
        sector: s?.sector ?? '',
        percent_gain: s?.percent_gain ?? '',
        recommendation: s?.recommendation ?? ''
      })) : [],
      diversification: {
        sector_breakdown: typeof obj?.diversification?.sector_breakdown === 'object' && obj.diversification.sector_breakdown !== null ? obj.diversification.sector_breakdown : {},
        risk_flag: obj?.diversification?.risk_flag ?? 'Medium'
      },
      recommendations: Array.isArray(obj?.recommendations) ? obj.recommendations : [],
      summary: obj?.summary ?? ''
    };
  }

  try {
    // Check authentication - this endpoint requires authentication
    const authHeader = req.headers.get('Authorization');
    const user = await getUserFromToken(authHeader);
    if (!user) {
      return errorResponse('Authentication required. Please log in.', 401);
    }

    // Only accept POST requests
    if (req.method !== "POST") {
      return errorResponse("Method Not Allowed", 405);
    }

    const body = await req.json();
    const { holdings } = body;
    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return errorResponse("Missing or invalid holdings data in request body", 400);
    }

    const { token, projectId } = await getGoogleAuthToken();
    const region = "asia-south1";
    const vertex_ai_endpoint = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/gemini-1.5-pro:generateContent`;

    // Standardize holdings and create the prompt
    const standardizedHoldings = standardizeHoldings(holdings);
    const prompt = `
      You are a Senior Equity Research Analyst assisting users on a financial platform called FinGenie. A user has entered their portfolio holdings.
      Your job is to analyze the data and provide insightful, personalized, and jargon-free feedback for a retail investor. Use simple language but offer genuine financial intelligence. Base all analysis only on the data below (no external API or live data).
      
      📊 PORTFOLIO HOLDINGS:
      ${JSON.stringify(standardizedHoldings, null, 2)}
      
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
          { "symbol": "...", "sector": "...", "percent_gain": "...", "recommendation": "Hold / Exit / Watch" }
        ],
        "diversification": {
          "sector_breakdown": { "IT": "40%", "Banking": "30%" },
          "risk_flag": "High / Medium / Low"
        },
        "recommendations": [
          "Consider diversifying into FMCG or Pharma",
          "Book partial profit in Tata Power"
        ],
        "summary": "..."
      }
    `;

    // Prepare and send the request to Vertex AI
    const requestBody = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
        response_mime_type: "application/json",
      },
    };

    const vertexResponse = await fetch(vertex_ai_endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!vertexResponse.ok) {
      const errorBody = await vertexResponse.text();
      throw new Error(`Vertex AI API request failed with status ${vertexResponse.status}: ${errorBody}`);
    }

    const responseJson = await vertexResponse.json();
    let analysisText = responseJson.candidates[0].content.parts[0].text;

    // Extract and parse the JSON from the response
    if (analysisText.trim().startsWith('```json')) {
      analysisText = analysisText.replace(/^```json|```$/g, '').trim();
    }
    const analysisJson = ensureGeminiAnalysisShape(JSON.parse(analysisText));

    // Return success response
    return new Response(
      JSON.stringify({ 
        analysis: analysisJson, 
        timestamp: new Date().toISOString(),
        userId: user.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error('Error processing portfolio analysis request:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown server error', 500);
  }
})
