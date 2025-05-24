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

// Helper for error responses
function errorResponse(message: string, status = 400) {
  console.error(`[EODHD-REALTIME] ${message}`);
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

// Validate environment variable at startup
const API_KEY = Deno.env.get('EODHD_API_KEY');
if (!API_KEY) {
  throw new Error('EODHD_API_KEY not set in environment variables.');
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    // In Supabase Edge Functions, the path will be /eodhd-realtime/SYMBOL
    const pathParts = path.split('/');
    const symbol = pathParts.length > 2 ? pathParts[2] : '';

    if (!symbol) {
      return errorResponse('Symbol is required', 400);
    }

    // Build query params from original request
    const queryParams = new URLSearchParams(url.search);
    if (!queryParams.has('api_token')) {
      queryParams.set('api_token', API_KEY!);
    }
    if (!queryParams.has('fmt')) {
      queryParams.set('fmt', 'json');
    }

    // Construct the target EODHD URL
    const targetUrl = `${EODHD_BASE_URL}/${symbol}?${queryParams.toString()}`;
    console.log(`[EODHD-REALTIME] Proxying to: ${targetUrl}`);

    // Forward the request to EODHD
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FinPathInsight/1.0'
      }
    });

    // Get the response
    const responseData = await response.text();

    // Return proxied response with CORS headers
    return new Response(responseData, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to proxy request to EODHD real-time API: ${errorMessage}`, 500);
  }
});
