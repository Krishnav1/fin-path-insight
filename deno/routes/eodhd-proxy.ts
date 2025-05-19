// EODHD API Proxy handler for Deno Deploy
// This endpoint forwards requests to the EODHD API
/// <reference path="../deno.d.ts" />

const EODHD_BASE_URL = 'https://eodhd.com/api';

export async function eodhProxy(req: Request, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    // Extract the path that should be forwarded to EODHD
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Remove the '/api/eodhd-proxy' prefix to get the actual EODHD API path
    const eodhPath = path.replace('/api/eodhd-proxy', '');
    
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
}
