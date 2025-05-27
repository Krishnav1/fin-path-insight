// Supabase Edge Function for FinGenie Oracle
// This function provides AI-powered financial information using Google's Gemini API
// Supports both authenticated and unauthenticated requests

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for Supabase Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Helper for error responses
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

// Get Supabase URL and key from environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// Helper to check authentication
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

// Cache for storing responses to avoid hitting rate limits
interface CachedResponse {
  response: string;
  timestamp: number;
}

const responseCache: Record<string, CachedResponse> = {};
const CACHE_TTL = 1800000; // 30 minutes in milliseconds

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Check authentication
  const authHeader = req.headers.get('Authorization');
  const user = await getUserFromToken(authHeader);
  const isAuthenticated = !!user;
  
  // Log authentication status (but don't expose user details)
  console.log(`[FINGENIE-ORACLE] Request authentication status: ${isAuthenticated ? 'Authenticated' : 'Unauthenticated'}`);

  // Only accept POST requests
  if (req.method !== "POST") {
    return errorResponse("Method Not Allowed", 405);
  }

  // Define requestBody outside try block so it's accessible in catch
  let requestBody: { userId?: string; query?: string } = {};

  try {
    // Parse request body
    const body = await req.json();
    
    // Store in outer variable for access in catch block
    requestBody = body;
    
    // Extract query from request
    // If user is authenticated, use their actual ID, otherwise use the provided userId or "anonymous"
    const { query } = body;
    const userId = isAuthenticated ? user.id : (body.userId || "anonymous");

    if (!query) {
      return errorResponse("Missing query in request body", 400);
    }

    // Check cache first
    const cacheKey = `${userId}:${query}`;
    const cachedData = responseCache[cacheKey];
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      console.log(`Using cached response for query: ${query}`);
      return new Response(
        JSON.stringify({
          response: cachedData.response,
          userId,
          cached: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get API key from environment
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY environment variable is not set" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Prepare the prompt for Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
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

    // Send the query to Gemini
    console.log("Sending query to Gemini Oracle...");
    const result = await model.generateContent(promptTemplate);
    const response = result.response;
    const oracleResponse = response.text();

    // Store in cache
    responseCache[cacheKey] = {
      response: oracleResponse,
      timestamp: Date.now()
    };

    // Return the response with authentication status
    return new Response(
      JSON.stringify({
        response: oracleResponse,
        timestamp: new Date().toISOString(),
        userId: userId,
        authenticated: isAuthenticated
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          'X-Auth-Status': isAuthenticated ? 'authenticated' : 'unauthenticated'
        },
      }
    );
  } catch (error) {
    console.error('Error in FinGenie Oracle:', error);
    console.error('Request body:', requestBody);
    
    // Use userId from authenticated user if available, otherwise from request or anonymous
    const userId = isAuthenticated ? user.id : (requestBody.userId || "anonymous");
    
    return new Response(
      JSON.stringify({
        error: "An error occurred while processing your request.",
        response: "This information is for educational purposes only and does not constitute investment advice. Financial markets involve risk, and past performance is not indicative of future results. Always consult with a qualified financial advisor before making investment decisions.",
        timestamp: new Date().toISOString(),
        userId: userId,
        authenticated: isAuthenticated
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          'X-Auth-Status': isAuthenticated ? 'authenticated' : 'unauthenticated'
        },
      }
    );
  }
})
