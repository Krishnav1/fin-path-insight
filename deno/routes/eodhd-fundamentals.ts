// EODHD Fundamentals API handler for Deno Deploy
// This endpoint provides stock fundamentals data from EODHD API
/// <reference path="../deno.d.ts" />

const EODHD_BASE_URL = 'https://eodhd.com/api';

/**
 * Handler for EODHD Fundamentals API requests
 * Provides comprehensive fundamental data for stocks
 */
export async function eodhFundamentals(req: Request, corsHeaders: Record<string, string>): Promise<Response> {
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
    
    // Get API key from environment or use premium API key
    let API_KEY = '682ab8a9176503.56947213'; // Default fallback
    try {
      const envKey = Deno?.env?.get?.('EODHD_API_KEY');
      if (envKey) API_KEY = envKey;
    } catch (e) {
      console.error('Error accessing environment variable:', e);
      // Continue with default API key
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
    console.error('Error in EODHD fundamentals proxy:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({ error: 'Failed to fetch fundamental data', details: error.message }),
      { 
        status: 500, 
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}
