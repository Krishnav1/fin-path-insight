// Supabase Edge Function for EODHD Real-time API
// This function forwards requests to the EODHD Real-time API
// Supports both authenticated and unauthenticated requests

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check authentication
    const authHeader = req.headers.get('Authorization');
    const user = await getUserFromToken(authHeader);
    const isAuthenticated = !!user;
    
    // Log authentication status (but don't expose user details)
    console.log(`[EODHD-REALTIME] Request authentication status: ${isAuthenticated ? 'Authenticated' : 'Unauthenticated'}`);
    
    // Parse URL and extract symbol
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

    // Return proxied response with CORS headers and authentication info
    return new Response(responseData, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'X-Auth-Status': isAuthenticated ? 'authenticated' : 'unauthenticated'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to proxy request to EODHD real-time API: ${errorMessage}`, 500);
  }
});
