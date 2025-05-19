// EODHD API Proxy for Netlify Functions
// This function forwards requests to the EODHD API and handles CORS

const axios = require('axios');

// EODHD API base URL
const EODHD_BASE_URL = 'https://eodhd.com/api';

exports.handler = async function(event, context) {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  try {
    // Get path parameters (everything after /api/eodhd-proxy/)
    const pathSegments = event.path.split('/');
    // Find the index of 'eodhd-proxy' in the path
    const proxyIndex = pathSegments.findIndex(segment => segment === 'eodhd-proxy');
    // Combine the remaining segments to form the EODHD API path
    const eodhPath = '/' + pathSegments.slice(proxyIndex + 1).join('/');

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    
    // Get API key from environment or use fallback
    const API_KEY = process.env.EODHD_API_KEY || '682ab8a9176503.56947213';
    
    // Don't override API key if it's already in the request
    if (!queryParams.api_token) {
      queryParams.api_token = API_KEY;
    }

    // Convert query parameters to query string
    const queryString = Object.keys(queryParams)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
      .join('&');

    // Construct the target EODHD URL
    const targetUrl = `${EODHD_BASE_URL}${eodhPath}${queryString ? '?' + queryString : ''}`;
    
    console.log(`Proxying to EODHD: ${targetUrl}`);
    
    // Forward the request to EODHD
    const response = await axios({
      method: event.httpMethod,
      url: targetUrl,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FinPathInsight/1.0'
      },
      // Forward the body for POST/PUT requests
      data: event.httpMethod === 'GET' || event.httpMethod === 'HEAD' ? undefined : JSON.parse(event.body || '{}'),
      // Set a reasonable timeout
      timeout: 10000
    });
    
    // Return the response from EODHD
    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': response.headers['content-type'] || 'application/json'
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error in EODHD proxy:', error);
    
    // Handle case where the API request failed
    return {
      statusCode: error.response?.status || 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: `Failed to proxy request to EODHD: ${error.message}`,
        details: error.response?.data || {},
        path: event.path,
        params: event.queryStringParameters
      })
    };
  }
};
