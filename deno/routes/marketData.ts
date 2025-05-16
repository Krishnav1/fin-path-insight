// Market Data API for Deno Deploy
// This endpoint provides market data from external APIs

// Declare Deno namespace for TypeScript
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

// Define the market data types
interface MarketDataItem {
  type: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: Date | string;
  [key: string]: any;
}

// Function to fetch stock data from Alpha Vantage API
async function fetchStockData(symbols: string[] = ['AAPL', 'MSFT', 'GOOGL', 'AMZN']): Promise<MarketDataItem[]> {
  try {
    const API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY') || 'demo';
    const results: MarketDataItem[] = [];
    
    for (const symbol of symbols) {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data['Global Quote']) {
        const quote = data['Global Quote'];
        results.push({
          type: 'stock',
          symbol: symbol,
          name: symbol, // Alpha Vantage Global Quote doesn't provide company name
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
          lastUpdated: new Date().toISOString(),
          volume: parseInt(quote['06. volume']),
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching stock data:', error);
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

export async function marketData(req: Request, corsHeaders: Record<string, string>): Promise<Response> {
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

    // Fetch data based on the type parameter
    if (type === "stocks") {
      const stockData = await fetchStockData();
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
}
