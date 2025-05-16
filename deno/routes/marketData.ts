// Market Data API for Deno Deploy
// This endpoint provides market data for the frontend

// Mock market data for demonstration
const mockMarketData = {
  stocks: [
    {
      type: "stock",
      symbol: "AAPL",
      name: "Apple Inc.",
      price: 187.32,
      change: 1.25,
      changePercent: 0.67,
      lastUpdated: new Date(),
      volume: 52436789,
      marketCap: "2.95T",
      pe: 31.2,
      sector: "Technology"
    },
    {
      type: "stock",
      symbol: "MSFT",
      name: "Microsoft Corporation",
      price: 417.88,
      change: 3.45,
      changePercent: 0.83,
      lastUpdated: new Date(),
      volume: 28976543,
      marketCap: "3.11T",
      pe: 37.5,
      sector: "Technology"
    },
    {
      type: "stock",
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      price: 175.98,
      change: -0.87,
      changePercent: -0.49,
      lastUpdated: new Date(),
      volume: 18765432,
      marketCap: "2.21T",
      pe: 25.3,
      sector: "Technology"
    },
    {
      type: "stock",
      symbol: "AMZN",
      name: "Amazon.com Inc.",
      price: 178.75,
      change: 2.34,
      changePercent: 1.32,
      lastUpdated: new Date(),
      volume: 32145678,
      marketCap: "1.85T",
      pe: 42.8,
      sector: "Consumer Cyclical"
    }
  ],
  crypto: [
    {
      type: "crypto",
      symbol: "BTC",
      name: "Bitcoin",
      price: 63245.87,
      change: 1243.56,
      changePercent: 2.01,
      lastUpdated: new Date(),
      volume: 32456789012,
      marketCap: "1.24T",
      circulatingSupply: "19.5M"
    },
    {
      type: "crypto",
      symbol: "ETH",
      name: "Ethereum",
      price: 3456.78,
      change: 87.65,
      changePercent: 2.60,
      lastUpdated: new Date(),
      volume: 18765432109,
      marketCap: "415.8B",
      circulatingSupply: "120.3M"
    }
  ],
  etfs: [
    {
      type: "etf",
      symbol: "SPY",
      name: "SPDR S&P 500 ETF Trust",
      price: 508.32,
      change: 2.15,
      changePercent: 0.42,
      lastUpdated: new Date(),
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
      lastUpdated: new Date(),
      volume: 43219876,
      aum: "224.3B",
      expense: 0.20,
      category: "Large Growth"
    }
  ]
};

export async function marketData(req: Request, corsHeaders: Record<string, string>): Promise<Response> {
  // Only accept GET requests
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    
    // Filter data based on type parameter
    let data;
    if (type === "stock" || type === "stocks") {
      data = mockMarketData.stocks;
    } else if (type === "crypto") {
      data = mockMarketData.crypto;
    } else if (type === "etf" || type === "etfs") {
      data = mockMarketData.etfs;
    } else {
      // Return all data if no type specified
      data = [
        ...mockMarketData.stocks,
        ...mockMarketData.crypto,
        ...mockMarketData.etfs
      ];
    }
    
    // Add timestamps to the data
    const dataWithTimestamps = data.map(item => ({
      ...item,
      lastUpdated: new Date().toISOString()
    }));

    return new Response(
      JSON.stringify(dataWithTimestamps),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing market data request:", error);
    
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
