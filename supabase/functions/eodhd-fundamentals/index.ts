// Supabase Edge Function for EODHD Fundamentals API
// This function provides stock fundamentals data from EODHD API

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
    // Extract the query parameters
    const url = new URL(req.url);
    const symbol = url.searchParams.get('symbol');
    const type = url.searchParams.get('type') || 'general'; // Default to general info
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol parameter is required' }),
        { 
          status: 400, 
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
    
    // Get API key from environment
    let API_KEY = Deno.env.get('EODHD_API_KEY');
    
    // Use fallback if not available
    if (!API_KEY) {
      console.warn('EODHD_API_KEY not found in environment, using fallback key');
      API_KEY = '682ab8a9176503.56947213'; // Default fallback
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
    
    // Get the response data
    const data = await response.json();
    
    // Return the response with CORS headers
    return new Response(
      JSON.stringify(data),
      { 
        status: response.status, 
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
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
