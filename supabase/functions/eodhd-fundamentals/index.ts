// Supabase Edge Function for EODHD Fundamentals API
// This function provides stock fundamentals data from EODHD API
// Supports both authenticated and unauthenticated requests

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for Supabase Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const EODHD_BASE_URL = 'https://eodhd.com/api';

// Helper to format symbols correctly for EODHD API
function formatSymbolForEODHD(symbol: string): string {
  // If no symbol is provided, return empty
  if (!symbol) return '';
  
  // Convert to uppercase
  let formattedSymbol = symbol.toUpperCase();
  
  // Fix Indian stock symbols: convert .NS (Yahoo Finance) to .NSE (EODHD)
  if (formattedSymbol.endsWith('.NS')) {
    return formattedSymbol.replace(/\.NS$/, '.NSE');
  }
  
  // If there's no dot (exchange suffix), assume it's an Indian stock
  // and add .NSE suffix
  if (!formattedSymbol.includes('.')) {
    return `${formattedSymbol}.NSE`;
  }
  
  return formattedSymbol;
}

// Helper for error responses
function errorResponse(message: string, status = 400) {
  console.error(`[EODHD-FUNDAMENTALS] ${message}`);
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

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check authentication
    const authHeader = req.headers.get('Authorization');
    const user = await getUserFromToken(authHeader);
    const isAuthenticated = !!user;
    
    // Log authentication status (but don't expose user details)
    console.log(`[EODHD-FUNDAMENTALS] Request authentication status: ${isAuthenticated ? 'Authenticated' : 'Unauthenticated'}`);
    
    // Extract the query parameters
    const url = new URL(req.url);
    const rawSymbol = url.searchParams.get('symbol');
    const type = url.searchParams.get('type') || 'general'; // Default to general info
    
    // Format symbol for EODHD API
    const symbol = formatSymbolForEODHD(rawSymbol || '');
    console.log(`[EODHD-FUNDAMENTALS] Original symbol: ${rawSymbol}, Formatted symbol: ${symbol}`);
    
    if (!symbol) {
      return errorResponse('Symbol parameter is required', 400);
    }
    
    // Get API key from environment
    const API_KEY = Deno.env.get('EODHD_API_KEY');
    if (!API_KEY) {
      return errorResponse('EODHD_API_KEY not set in environment variables.', 500);
    }
    
    // Create query parameters
    const queryParams = new URLSearchParams();
    queryParams.set('api_token', API_KEY);
    
    // Determine the endpoint based on the requested data type
    let endpoint = '';
    switch (type) {
      case 'general':
        endpoint = `/fundamentals/${symbol}`;
        break;
      case 'highlights':
        endpoint = `/fundamentals/${symbol}?filter=Highlights`;
        break;
      case 'financials':
        endpoint = `/fundamentals/${symbol}?filter=Financials`;
        break;
      case 'balancesheet':
        endpoint = `/fundamentals/${symbol}/balance-sheet`;
        break;
      case 'income':
        endpoint = `/fundamentals/${symbol}/income-statement`;
        break;
      case 'cashflow':
        endpoint = `/fundamentals/${symbol}/cash-flow`;
        break;
      case 'earnings':
        endpoint = `/fundamentals/${symbol}/earnings`;
        break;
      case 'dividends':
        endpoint = `/fundamentals/${symbol}/dividends`;
        break;
      case 'insiders':
        endpoint = `/insider-transactions?code=${symbol}`;
        break;
      default:
        endpoint = `/fundamentals/${symbol}`;
    }
    
    // Construct the target EODHD URL
    const targetUrl = `${EODHD_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryParams.toString()}`;
    
    console.log(`Fetching fundamentals from EODHD: ${targetUrl}`);
    
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
    
    // Return the response with CORS headers and authentication status
    return new Response(responseData, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'X-Auth-Status': isAuthenticated ? 'authenticated' : 'unauthenticated'
      }
    });
  } catch (error) {
    console.error('Error in EODHD fundamentals:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({
        error: `Failed to fetch fundamentals from EODHD: ${errorMessage}`
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
})
