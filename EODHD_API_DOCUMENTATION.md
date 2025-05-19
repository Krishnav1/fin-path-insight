# EODHD API Integration Documentation

This document provides an overview of how FinPath Insight integrates with the EODHD API to provide financial data to users.

## Overview

FinPath Insight uses the EODHD API for various financial data needs, including:

1. **Fundamental Data** - Company financials, balance sheets, income statements, etc.
2. **Live (Delayed) Stock Prices** - Real-time (15-20 minute delayed) stock price data
3. **Historical Data** - Historical price data for charts and analysis

## API Endpoints

### 1. Live Stock Price API

The Live Stock Price API provides real-time (with 15-20 minute delay) stock price data for almost all symbols and exchanges worldwide.

#### Features:
- Support for global symbols and exchanges
- Data with a 1-minute interval frequency
- Multiple tickers can be requested in a single API call
- Available in JSON and CSV formats

#### Implementation:

Our application uses a secure Deno backend to proxy requests to the EODHD API, protecting the API key and adding caching for better performance.

**Frontend Service:**
```typescript
// Get live (delayed) stock prices using the EODHD API
async function getLiveStockPrices(symbols: string | string[]): Promise<any> {
  // Convert single symbol to array for consistent handling
  const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
  const symbolsStr = symbolArray.join(',');
  
  const cacheKey = `live_prices_${symbolsStr}`;
  const cachedData = apiCache.get<any>(cacheKey);
  
  if (cachedData) {
    return Promise.resolve(cachedData);
  }
  
  try {
    // If it's a single symbol, use the primary symbol in the URL path
    // If multiple symbols, use the first one in the path and the rest in the 's' parameter
    const primarySymbol = symbolArray[0];
    const additionalSymbols = symbolArray.length > 1 ? symbolArray.slice(1).join(',') : '';
    
    const params: Record<string, string> = { fmt: 'json' };
    if (additionalSymbols) {
      params.s = additionalSymbols;
    }
    
    const response = await axios.get(`/api/eodhd-realtime/${primarySymbol}`, { params });
    
    // Cache the response with a short TTL (1 minute)
    apiCache.set(cacheKey, response.data, 60 * 1000);
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching live stock prices for ${symbolsStr}:`, error);
    return null;
  }
}
```

**Backend Proxy (Deno):**
```typescript
// EODHD Real-time API Proxy handler for Deno Deploy
export async function eodhRealtime(req: Request, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    // Extract the path that should be forwarded to EODHD
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Remove the '/api/eodhd-realtime' prefix to get the actual symbol
    const symbol = path.replace('/api/eodhd-realtime/', '');
    
    // Get API key from environment or use fallback
    let API_KEY = '682ab8a9176503.56947213'; // Default fallback
    try {
      const envKey = Deno?.env?.get?.('EODHD_API_KEY');
      if (envKey) API_KEY = envKey;
    } catch (e) {
      console.error('Error accessing environment variable:', e);
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
    
    // Forward the request to EODHD
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FinPathInsight/1.0'
      }
    });
    
    // Return the response with CORS headers
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in EODHD real-time proxy:', error);
    return new Response(
      JSON.stringify({
        error: `Failed to proxy request to EODHD real-time API: ${error instanceof Error ? error.message : 'Unknown error'}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
```

#### Usage Examples:

**Single Symbol:**
```javascript
// Get live price for Apple stock
const appleData = await getLiveStockPrices('AAPL.US');
console.log(`Current price of Apple: $${appleData.close}`);
```

**Multiple Symbols:**
```javascript
// Get live prices for multiple stocks
const techStocks = await getLiveStockPrices(['AAPL.US', 'MSFT.US', 'GOOGL.US']);
techStocks.forEach(stock => {
  console.log(`${stock.code}: $${stock.close} (${stock.change_p}%)`);
});
```

### 2. Fundamental Data API

The Fundamental Data API provides comprehensive financial information about companies, including general information, financial statements, balance sheets, and more.

#### Implementation:

Similar to the Live Stock Price API, our application uses a secure Deno backend to proxy requests to the EODHD API.

```typescript
// Get company general information and fundamentals
export async function getCompanyFundamentals(symbol: string) {
  const cacheKey = `fundamentals-general-${symbol}`;
  
  // Check cache first
  if (apiCache[cacheKey] && Date.now() - apiCache[cacheKey].timestamp < CACHE_TTL) {
    return apiCache[cacheKey].data;
  }
  
  try {
    const response = await axios.get(EODHD_FUNDAMENTALS_URL, {
      params: {
        symbol,
        type: 'general'
      }
    });
    
    // Cache the response
    apiCache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data;
  } catch (error) {
    console.error('Error fetching company fundamentals:', error);
    throw error;
  }
}
```

## API Response Format

### Live Stock Price API Response

```json
{
  "code": "AAPL.US",
  "timestamp": 1711670340,
  "gmtoffset": 0,
  "open": 170.92,
  "high": 173.07,
  "low": 170.76,
  "close": 172.28,
  "volume": 45589081,
  "previousClose": 171.19,
  "change": 1.09,
  "change_p": 0.6367,
  "index_name": "S&P 500"
}
```

### Fundamental Data API Response (General)

```json
{
  "General": {
    "Code": "AAPL.US",
    "Type": "Common Stock",
    "Name": "Apple Inc",
    "Exchange": "NASDAQ",
    "CurrencyCode": "USD",
    "CurrencyName": "US Dollar",
    "CurrencySymbol": "$",
    "CountryName": "USA",
    "CountryISO": "US",
    "ISIN": "US0378331005",
    "CUSIP": "037833100",
    "Sector": "Technology",
    "Industry": "Consumer Electronics",
    "Description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide...",
    "FullTimeEmployees": 161000,
    "UpdatedAt": "2023-09-30"
  }
}
```

## Best Practices

1. **Caching**: Implement appropriate caching to reduce API calls and improve performance
   - Use shorter TTL (Time-to-Live) for real-time data (60 seconds)
   - Use longer TTL for fundamental data that doesn't change frequently (5 minutes)

2. **Error Handling**: Implement robust error handling to gracefully handle API failures
   - Provide fallback data when API calls fail
   - Log errors for debugging

3. **Rate Limiting**: Be mindful of API rate limits
   - The free tier has a limit of 20 API calls per day
   - Paid plans have higher limits (up to 100,000 requests per day)

## API Key Management

API keys should be stored securely and never exposed to the client side. Our implementation uses a Deno backend to proxy requests to the EODHD API, keeping the API key secure.

For local development, you can use the demo API key provided by EODHD, which works for a limited set of symbols:
- AAPL.US
- TSLA.US
- VTI.US
- AMZN.US
- BTC-USD.CC
- EURUSD.FOREX

For production, obtain your own API key from [EODHD](https://eodhd.com/register) and set it as an environment variable in your Deno deployment.

## Resources

- [EODHD API Documentation](https://eodhd.com/financial-apis/)
- [Live Stock Prices API Documentation](https://eodhd.com/financial-apis/live-realtime-stocks-api)
- [Fundamental Data API Documentation](https://eodhd.com/financial-apis/fundamentals-data-financial-statements-api/)
