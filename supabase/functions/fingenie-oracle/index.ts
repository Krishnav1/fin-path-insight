/// <reference types="https://deno.land/x/deno/cli/types/dts/index.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
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
  console.error(`[FINGENIE-ORACLE] ${message}`);
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

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

    const { query } = await req.json();
    if (!query) {
      return errorResponse('Missing query in request body');
    }

    const { token: googleToken, projectId } = await getGoogleAuthToken();
    const region = "asia-south1";
    const vertex_ai_endpoint = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/gemini-1.5-pro:generateContent`;


    const promptTemplate = `
You are FinGenie Oracle, a specialized AI assistant focused on providing accurate, educational information about financial markets, investment strategies, and economic concepts.

User Query: "${query}"

Guidelines:
1. Provide factual, educational information about financial topics.
2. Explain complex financial concepts in clear, accessible language.
3. When discussing investment strategies, present multiple perspectives and approaches.
4. Include relevant historical context or data when appropriate.
5. NEVER provide specific investment advice or recommendations for individual securities.
6. Always include appropriate disclaimers about financial information.
7. If the query is not related to finance or economics, politely redirect to financial topics.

Format your response in well-structured Markdown, including:
- Clear headings and subheadings
- Bullet points for key information
- Examples where helpful
- A brief "Key Takeaways" section at the end
- A standard disclaimer at the end

Disclaimer to include: "This information is for educational purposes only and does not constitute investment advice. Financial markets involve risk, and past performance is not indicative of future results. Always consult with a qualified financial advisor before making investment decisions."
`;

    const vertexRequestBody = {
      contents: [{ role: "user", parts: [{ text: promptTemplate }] }],
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
        'Authorization': `Bearer ${googleToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vertexRequestBody),
    });

    if (!vertexResponse.ok) {
      throw new Error(`Vertex AI API request failed: ${await vertexResponse.text()}`);
    }

    const responseJson = await vertexResponse.json();
    const analysisText = responseJson.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ response: analysisText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return errorResponse(error.message, 500);
  }
})
