/// <reference types="https://deno.land/x/deno/cli/types/dts/index.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { create, getNumericDate } from 'https://deno.land/x/djwt@v2.9.1/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for Supabase Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper for consistent error responses
function errorResponse(message: string, status = 400) {
  console.error(`[FINGENIE-CHAT] ${message}`);
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

// In-memory store for conversation history
const conversationHistories: Record<string, { role: string; parts: { text: string }[] }[]> = {};
const MAX_HISTORY_LENGTH = 10;

// Helper to convert string to ArrayBuffer
function str2ab(str: string) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

// Deno-native Google Auth
async function getGoogleAuthToken() {
  const serviceAccountBase64 = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64");
  if (!serviceAccountBase64) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 environment variable is not set");
  }
  
  // Declare credentials outside try block so it's accessible throughout the function
  let credentials;
  
  try {
    // Clean up the base64 string - remove whitespace and newlines that might cause issues
    const cleanedBase64 = serviceAccountBase64.replace(/\s/g, '');
    const serviceAccountJson = atob(cleanedBase64);
    credentials = JSON.parse(serviceAccountJson);
  } catch (error) {
    console.error('Base64 decoding error:', error);
    throw new Error(`Failed to decode service account JSON: ${error.message}`);
  }

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

    const { query } = await req.json();
    if (!query) {
      return errorResponse('Missing query in request body');
    }

    const { token: googleToken, projectId } = await getGoogleAuthToken();
    const region = "asia-south1";
    const vertex_ai_endpoint = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/gemini-1.5-pro:generateContent`;

    const history = conversationHistories[user.id] || [];
    const currentHistory = [...history, { role: "user", parts: [{ text: query }] }];

    const vertexRequestBody = { contents: currentHistory };

    const vertexResponse = await fetch(vertex_ai_endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${googleToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(vertexRequestBody),
    });

    if (!vertexResponse.ok) {
      throw new Error(`Vertex AI API request failed: ${await vertexResponse.text()}`);
    }

    const responseJson = await vertexResponse.json();
    const aiResponseText = responseJson.candidates[0].content.parts[0].text;

    conversationHistories[user.id] = [
      ...currentHistory.slice(-MAX_HISTORY_LENGTH),
      { role: "model", parts: [{ text: aiResponseText }] },
    ];

    return new Response(JSON.stringify({ response: aiResponseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return errorResponse(error.message, 500);
  }
});
