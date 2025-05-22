// Supabase Edge Function for Market Data
// This function provides market data from external APIs

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// CORS headers for Supabase Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Define the market data types
interface MarketDataItem {
  type: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: Date | string;
  volume?: number;
  marketCap?: number;
  aum?: string;
  expense?: number;
  category?: string;
  [key: string]: any;
}

// Function to fetch stock data from EODHD API
async function fetchStockData(symbols: string[] = ['AAPL.US', 'MSFT.US', 'GOOGL.US', 'AMZN.US']): Promise<MarketDataItem[]> {
  try {
    const API_KEY = Deno.env.get('EODHD_API_KEY');
    if (!API_KEY) {
      throw new Error('EODHD_API_KEY not set in environment variables.');
    }
    const results: MarketDataItem[] = [];

    for (const symbol of symbols) {
      // EODHD expects symbols like AAPL.US, RELIANCE.BSE, etc.
      const url = `https://eodhd.com/api/real-time/${symbol}?api_token=${API_KEY}&fmt=json`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`EODHD API error for ${symbol}: ${response.status}`);
        continue;
      }
      const data = await response.json();
      if (data && data.code) {
        results.push({
          type: 'stock',
          symbol: data.code,
          name: data.name || data.code,
          price: data.close,
          change: data.change,
          changePercent: data.change_p, // EODHD uses change_p for percent change
          lastUpdated: data.timestamp ? new Date(data.timestamp * 1000).toISOString() : new Date().toISOString(),
          volume: data.volume
        });
      }
    }
    return results;
  } catch (error) {
    console.error('Error fetching stock data from EODHD:', error);
    return [];
  }
}

// Function to fetch crypto data
async function fetchCryptoData(symbols: string[] = ['BTC', 'ETH']): Promise<MarketDataItem[]> {
  try {
    const results: MarketDataItem[] = [];
    
    for (const symbol of symbols) {
      // Using CoinGecko API (no key required)
      const url = `https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase() === 'btc' ? 'bitcoin' : 'ethereum'}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      results.push({
        type: 'crypto',
        symbol: symbol,
        name: data.name,
        price: data.market_data.current_price.usd,
        change: data.market_data.price_change_24h,
        changePercent: data.market_data.price_change_percentage_24h,
        lastUpdated: data.last_updated,
        marketCap: data.market_data.market_cap.usd,
        volume: data.market_data.total_volume.usd,
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    return [];
  }
}

// Function to fetch ETF data (simplified for now)
async function fetchETFData(): Promise<MarketDataItem[]> {
  // For ETFs, we'll use a simplified approach with some common ETFs
  const etfs = [
    {
      type: "etf",
      symbol: "SPY",
      name: "SPDR S&P 500 ETF Trust",
      price: 508.32,
      change: 2.15,
      changePercent: 0.42,
      lastUpdated: new Date().toISOString(),
      volume: 65432198,
      aum: "425.6B",
      expense: 0.09,
      category: "Large Blend"
    },
    {
      type: "etf",
      symbol: "QQQ",
      name: "Invesco QQQ Trust",
      price: 437.65,
      change: 3.87,
      changePercent: 0.89,
      lastUpdated: new Date().toISOString(),
      volume: 43219876,
      aum: "224.3B",
      expense: 0.20,
      category: "Large Growth"
    }
  ];
  
  return etfs;
}

async function fetchEodhdScreener(sort: string, limit = 5) {
  const API_KEY = Deno.env.get('EODHD_API_KEY');
  if (!API_KEY) throw new Error('EODHD_API_KEY not set in environment variables.');
  const url = `https://eodhd.com/api/screener?filters=[{"field":"exchange","operator":"=","value":"NSE"},{"field":"is_primary","operator":"=","value":true}]&sort=${sort}&limit=${limit}&api_token=${API_KEY}&fmt=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch screener data');
  return await res.json();
}

async function fetchEodhdScreenerBulk(limit = 100) {
  const API_KEY = Deno.env.get('EODHD_API_KEY');
  if (!API_KEY) throw new Error('EODHD_API_KEY not set in environment variables.');
  const url = `https://eodhd.com/api/screener?filters=[{"field":"exchange","operator":"=","value":"NSE"},{"field":"is_primary","operator":"=","value":true}]&limit=${limit}&api_token=${API_KEY}&fmt=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch screener data');
  return await res.json();
}

serve(async (req) => {
  // --- Custom endpoint for Indian Market ---
  if (req.method === 'GET' && new URL(req.url).pathname.endsWith('/indian-market')) {
    try {
      const API_KEY = Deno.env.get('EODHD_API_KEY');
      if (!API_KEY) {
        return new Response(JSON.stringify({ error: 'EODHD_API_KEY not set in environment variables.' }), { status: 500 });
      }
      const urlObj = new URL(req.url);
      const search = urlObj.searchParams.get('search')?.toUpperCase() || '';
      const limit = Number(urlObj.searchParams.get('limit')) || 50;
      // Fetch a list of Indian stocks using the EODHD screener API
      const screenerUrl = `https://eodhd.com/api/screener?filters=[{"field":"exchange","operator":"=","value":"NSE"},{"field":"is_primary","operator":"=","value":true}]&limit=${limit}&api_token=${API_KEY}&fmt=json`;
      const screenerRes = await fetch(screenerUrl);
      if (!screenerRes.ok) throw new Error('Failed to fetch screener data');
      const screenerData = await screenerRes.json();
      let stocks = screenerData.data || [];
      // Filter by search query if provided
      if (search) {
        stocks = stocks.filter((item: any) =>
          item.Code?.toUpperCase().includes(search) ||
          item.Name?.toUpperCase().includes(search)
        );
      }
      // Fetch real-time data for filtered symbols, up to 20 at a time for performance
      const batch = stocks.slice(0, 20);
      const results: MarketDataItem[] = [];
      for (const item of batch) {
        const symbol = item.Code;
        const url = `https://eodhd.com/api/real-time/${symbol}.NSE?api_token=${API_KEY}&fmt=json`;
        const response = await fetch(url);
        if (!response.ok) continue;
        const data = await response.json();
        if (data && data.code) {
          // Remove .NSE suffix from symbol
          const cleanSymbol = data.code.replace(/\.NSE$/, '');
          results.push({
            type: 'stock',
            symbol: cleanSymbol,
            name: data.name || cleanSymbol,
            price: data.close,
            change: data.change,
            changePercent: data.change_p,
            lastUpdated: data.timestamp ? new Date(data.timestamp * 1000).toISOString() : new Date().toISOString(),
            volume: data.volume
          });
        }
      }
      return new Response(JSON.stringify({ stocks: results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept GET requests
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Get the type parameter from the URL
    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    // --- Custom endpoints for gainers-losers and sector-performance ---
    if (url.pathname.endsWith("/gainers-losers")) {
      try {
        const gainers = await fetchEodhdScreener('change_p.desc', 5);
        const losers = await fetchEodhdScreener('change_p.asc', 5);
        return new Response(
          JSON.stringify({
            gainers: gainers.map(item => ({
              ticker: item.code,
              name: item.name,
              price: item.close,
              changePct: item.change_p,
            })),
            losers: losers.map(item => ({
              ticker: item.code,
              name: item.name,
              price: item.close,
              changePct: item.change_p,
            })),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    } else if (url.pathname.endsWith("/sector-performance")) {
      try {
        const data = await fetchEodhdScreenerBulk(100); // Fetch 100 stocks for sector aggregation
        // Group by sector
        const sectorMap: Record<string, any[]> = {};
        data.forEach(item => {
          if (!item.sector) return;
          if (!sectorMap[item.sector]) sectorMap[item.sector] = [];
          sectorMap[item.sector].push(item);
        });
        const sectorPerformance = Object.entries(sectorMap).map(([sector, stocks]) => ({
          sector,
          changePct: (
            stocks.reduce((sum, s) => sum + (Number(s.change_p) || 0), 0) / stocks.length
          ),
          tickers: stocks.slice(0, 3).map(s => s.code),
        }));
        return new Response(JSON.stringify(sectorPerformance), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }
    // --- END Custom endpoints ---

    // Fetch data based on the type parameter
    if (type === "stocks") {
      const symbolParam = url.searchParams.get("symbol");
      const market = url.searchParams.get("market") || "global";
      let symbols: string[] = [];
      if (symbolParam) {
        symbols = symbolParam.split(',').map(s => s.trim()).filter(Boolean);
        if (market.toLowerCase() === "india") {
          // For Indian stocks, Alpha Vantage expects .BSE or .NSE suffix
          symbols = symbols.map(s => s.endsWith('.BSE') || s.endsWith('.NSE') ? s : `${s}.BSE`);
        }
      }
      const stockData = symbols.length > 0
        ? await fetchStockData(symbols)
        : await fetchStockData();
      return new Response(JSON.stringify(stockData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (type === "crypto") {
      const cryptoData = await fetchCryptoData();
      return new Response(JSON.stringify(cryptoData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (type === "etfs") {
      const etfData = await fetchETFData();
      return new Response(JSON.stringify(etfData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Return all data if no type is specified
      const [stocks, crypto, etfs] = await Promise.all([
        fetchStockData(),
        fetchCryptoData(),
        fetchETFData()
      ]);
      
      return new Response(JSON.stringify({
        stocks,
        crypto,
        etfs,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in marketData:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: `Failed to process market data request: ${errorMessage}`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
})
