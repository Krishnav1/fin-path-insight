// Supabase Edge Function for EODHD Real-time API
// This function forwards requests to the EODHD Real-time API

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// CORS headers for Supabase Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const EODHD_BASE_URL = 'https://eodhd.com/api/real-time';

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Extract the path that should be forwarded to EODHD
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Extract the symbol from the path
    // In Supabase Edge Functions, the path will be /eodhd-realtime/SYMBOL
    const pathParts = path.split('/');
    const symbol = pathParts.length > 2 ? pathParts[2] : '';
    
    if (!symbol) {
      return new Response(
        JSON.stringify({
          error: 'Symbol is required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get API key from environment
    const API_KEY = Deno.env.get('EODHD_API_KEY');
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: 'EODHD_API_KEY not set in environment variables.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create a new URL with searchParams
    const queryParams = new URLSearchParams(url.search);
    
    // Don't override API key if it's already in the request
    if (!queryParams.has('api_token')) {
      queryParams.set('api_token', API_KEY);
    }
    
    // Make sure we're getting JSON format
    if (!queryParams.has('fmt')) {
      queryParams.set('fmt', 'json');
    }
    
    // Construct the target EODHD URL
    const targetUrl = `${EODHD_BASE_URL}/${symbol}?${queryParams.toString()}`;
    
    console.log(`Proxying to EODHD Real-time API: ${targetUrl}`);
    
    // Forward the request to EODHD
    const response = await fetch(targetUrl, {
      method: 'GET', // Real-time API only supports GET
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FinPathInsight/1.0'
      }
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
    console.error('Error in EODHD real-time proxy:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({
        error: `Failed to proxy request to EODHD real-time API: ${errorMessage}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
