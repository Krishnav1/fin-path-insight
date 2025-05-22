// Supabase Edge Function for EODHD API Proxy
// This function forwards requests to the EODHD API

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// CORS headers for Supabase Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const EODHD_BASE_URL = 'https://eodhd.com/api';

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Extract the path that should be forwarded to EODHD
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Remove the function path prefix to get the actual EODHD API path
    // In Supabase Edge Functions, the path will be /eodhd-proxy/v1/... or similar
    const pathParts = path.split('/');
    const eodhPath = '/' + pathParts.slice(2).join('/'); // Skip the function name part
    
    // Get API key from environment
    let API_KEY = Deno.env.get('EODHD_API_KEY');
    
    // Use fallback if not available
    if (!API_KEY) {
      console.warn('EODHD_API_KEY not found in environment, using fallback key');
      API_KEY = '682ab8a9176503.56947213'; // Default fallback
    }
    
    // Create a new URL with searchParams
    const queryParams = new URLSearchParams(url.search);
    
    // Don't override API key if it's already in the request
    if (!queryParams.has('api_token')) {
      queryParams.set('api_token', API_KEY);
    }
    
    // Construct the target EODHD URL
    const targetUrl = `${EODHD_BASE_URL}${eodhPath}?${queryParams.toString()}`;
    
    console.log(`Proxying to EODHD: ${targetUrl}`);
    
    // Forward the request to EODHD
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FinPathInsight/1.0'
      },
      // Forward the body for POST/PUT requests
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text(),
    });
    
    // Get the response
    const responseData = await response.text();
    
    // Create a new response with the data and CORS headers
    return new Response(responseData, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in EODHD proxy:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({
        error: `Failed to proxy request to EODHD: ${errorMessage}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
