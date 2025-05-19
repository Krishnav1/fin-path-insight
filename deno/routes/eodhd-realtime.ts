// EODHD Real-time API Proxy handler for Deno Deploy
// This endpoint forwards requests to the EODHD Real-time API
/// <reference path="../deno.d.ts" />

const EODHD_BASE_URL = 'https://eodhd.com/api/real-time';

export async function eodhRealtime(req: Request, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    // Extract the path that should be forwarded to EODHD
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Remove the '/api/eodhd-realtime' prefix to get the actual symbol
    const symbol = path.replace('/api/eodhd-realtime/', '');
    
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
    
    // Get API key from environment or use premium API key
    // Use a try-catch block to handle potential Deno namespace issues
    let API_KEY = '682ab8a9176503.56947213'; // Default fallback
    try {
      const envKey = Deno?.env?.get?.('EODHD_API_KEY');
      if (envKey) API_KEY = envKey;
    } catch (e) {
      console.error('Error accessing environment variable:', e);
      // Continue with default API key
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
}
