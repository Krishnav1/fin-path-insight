import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StockQuote } from '@/lib/api-service';
import axios from 'axios';

// Define the MarketIndex type
interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  previousClose: number;
}

// Define market types
type MarketType = 'global' | 'india';

// Define market data types for the context
interface MarketDataContextType {
  indices: MarketIndex[];
  popularStocks: Record<string, StockQuote>;
  topGainers: StockQuote[];
  topLosers: StockQuote[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  lastUpdated: Date | null;
  nextRefreshTime: Date | null;
}

// Create the context with default values
const MarketDataContext = createContext<MarketDataContextType>({
  indices: [],
  popularStocks: {},
  topGainers: [],
  topLosers: [],
  isLoading: true,
  refreshData: async () => { return Promise.resolve(); },
  lastUpdated: null,
  nextRefreshTime: null
});

// Lists of popular stocks by market
const GLOBAL_POPULAR_STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'WMT'];

// Indian stock lists - using consistent format without .NS suffix
const INDIA_POPULAR_STOCKS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'TATAMOTORS',
  'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK', 
  'BAJFINANCE', 'HINDUNILVR', 'AXISBANK', 'LT', 'WIPRO'
];

export function MarketDataProvider({ children }: { children: ReactNode }) {
  // Default to global market data
  const market: MarketType = "global";
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [popularStocks, setPopularStocks] = useState<Record<string, StockQuote>>({});
  const [topGainers, setTopGainers] = useState<StockQuote[]>([]);
  const [topLosers, setTopLosers] = useState<StockQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Import API endpoints for Supabase Edge Functions
  const [apiEndpoints, setApiEndpoints] = useState<typeof import('@/config/api-config').API_ENDPOINTS | null>(null);
  
  // Load API endpoints
  useEffect(() => {
    const loadEndpoints = async () => {
      const { API_ENDPOINTS } = await import('@/config/api-config');
      setApiEndpoints(API_ENDPOINTS);
    };
    loadEndpoints();
  }, []);
  
  // Define major indices to track
  const majorIndices = {
    global: [
      { symbol: 'SPY.US', name: 'S&P 500 ETF' },
      { symbol: 'QQQ.US', name: 'NASDAQ-100 ETF' },
      { symbol: 'DIA.US', name: 'Dow Jones ETF' },
      { symbol: 'IWM.US', name: 'Russell 2000 ETF' },
    ],
    india: [
      { symbol: 'NIFTY.NSE', name: 'Nifty 50' },
      { symbol: 'BANKNIFTY.NSE', name: 'Bank Nifty' },
      { symbol: 'FINNIFTY.NSE', name: 'Fin Nifty' },
      { symbol: 'SENSEX.NSE', name: 'Sensex' },
    ]
  };

  // Function to fetch all market data using EODHD API
  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      // Check if apiEndpoints is loaded
      if (!apiEndpoints) {
        console.error('API endpoints not loaded yet');
        return;
      }
      
      // Get major indices data
      const indicesData: MarketIndex[] = [];
      
      // Fetch all indices (both global and india)
      const allIndices = [...majorIndices.global, ...majorIndices.india];
      
      // Parallel fetch for all indices for better performance
      const indicesPromises = allIndices.map(async (index) => {
        try {
          const response = await axios.get(
            `${apiEndpoints.EODHD_PROXY}/real-time/${index.symbol}?fmt=json`
          );
          
          const data = response.data;
          if (!data) return null;
          
          // Format data to match MarketIndex type
          const marketIndex: MarketIndex = {
            symbol: index.symbol,
            name: index.name,
            price: data.close || data.previousClose || 0,
            change: data.change || 0,
            changePercent: data.changePercent || data.pctChange || 0,
            volume: data.volume || 0,
            previousClose: data.previousClose || 0,
          };
          
          return marketIndex;
        } catch (error) {
          console.error(`Error fetching data for index ${index.symbol}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(indicesPromises);
      
      // Filter out null results
      const validIndices = results.filter(index => index !== null) as MarketIndex[];
      
      // Filter indices by market
      const filteredIndices = validIndices.filter(index => 
        index.symbol && index.symbol.includes('.NS') ? market === 'india' as MarketType : market === 'global' as MarketType
      );
      setIndices(filteredIndices);

      // Get popular stocks based on selected market
      const stockSymbols = market === 'global' ? GLOBAL_POPULAR_STOCKS : INDIA_POPULAR_STOCKS;
      const stocksData: Record<string, StockQuote> = {};
      
      // Format symbols according to EODHD requirements
      const formattedSymbols = stockSymbols.map(symbol => {
        if (market as string === 'india') {
          return `${symbol}.NSE`; // Use NSE suffix for Indian stocks with EODHD
        } else {
          return `${symbol}.US`;  // Use US suffix for US stocks with EODHD
        }
      });
      
      // Use batch request for better performance when possible
      // For EODHD, make parallel requests for each symbol as their batch API is limited
      const stockPromises = formattedSymbols.map(async (formattedSymbol) => {
        try {
          // Get real-time quote using EODHD API
          const response = await axios.get(
            `${apiEndpoints?.EODHD_PROXY}/real-time/${formattedSymbol}?fmt=json`
          );
          
          const data = response.data;
          if (!data) return null;
          
          // Extract the base symbol without the exchange suffix
          const baseSymbol = formattedSymbol.split('.')[0];
          
          // Convert to our StockQuote format
          const quote: StockQuote = {
            symbol: baseSymbol, // Store without suffix
            name: data.name || baseSymbol,
            price: data.close || data.previousClose || 0,
            change: data.change || 0,
            changePercent: data.changePercent || data.pctChange || 0,
            volume: data.volume || 0,
            marketCap: data.marketCap || 0,
            previousClose: data.previousClose || 0,
            open: data.open || 0,
            high: data.high || 0,
            low: data.low || 0,
            timestamp: data.timestamp || new Date().toISOString()
          };
          
          return { symbol: baseSymbol, quote };
        } catch (error) {
          console.error(`Error fetching data for ${formattedSymbol}:`, error);
          return null;
        }
      });
      
      // Wait for all requests to complete
      const stockResults = await Promise.all(stockPromises);
      
      // Process results
      stockResults.forEach(result => {
        if (result) {
          stocksData[result.symbol] = result.quote;
        }
      });
      setPopularStocks(stocksData);

      // For top gainers and losers, use the values from stocksData
      // This works for both Global and Indian markets
      const stocksArray = Object.values(stocksData);
      
      // Sort by percent change for gainers (highest first)
      const gainers = [...stocksArray]
        .filter(stock => (stock.changePercent ?? 0) > 0)
        .sort((a, b) => {
          const changeA = a.changePercent ?? -Infinity; // Treat null/undefined as least favorable for gainers
          const changeB = b.changePercent ?? -Infinity;
          return changeB - changeA; // Descending order
        })
        .slice(0, 5);
      
      // Sort by percent change for losers (lowest first)
      const losers = [...stocksArray]
        .filter(stock => (stock.changePercent ?? 0) < 0)
        .sort((a, b) => {
          const changeA = a.changePercent ?? Infinity; // Treat null/undefined as least favorable for losers
          const changeB = b.changePercent ?? Infinity;
          return changeA - changeB; // Ascending order
        })
        .slice(0, 5);
      
      setTopGainers(gainers);
      setTopLosers(losers);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on initial load and when market or apiEndpoints change
  useEffect(() => {
    // Only fetch data when apiEndpoints are loaded
    if (apiEndpoints) {
      fetchMarketData();
      
      // Auto refresh every 15 minutes (adjusted for EODHD API rate limits)
      // EODHD recommends not making too many requests in short periods
      const intervalId = setInterval(fetchMarketData, 15 * 60 * 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [market, apiEndpoints]);
  
  // Set up a timer to track when the next refresh will happen
  const [nextRefreshTime, setNextRefreshTime] = useState<Date | null>(null);
  
  // Update the next refresh time whenever data is refreshed
  useEffect(() => {
    if (lastUpdated) {
      const nextTime = new Date(lastUpdated.getTime() + 15 * 60 * 1000);
      setNextRefreshTime(nextTime);
    }
  }, [lastUpdated]);
  
  // Function to manually trigger data refresh
  const refreshData = async () => {
    await fetchMarketData();
    // After refresh, update the next refresh time
    const now = new Date();
    setNextRefreshTime(new Date(now.getTime() + 15 * 60 * 1000));
    return Promise.resolve();
  };

  return (
    <MarketDataContext.Provider 
      value={{ 
        indices, 
        popularStocks, 
        topGainers, 
        topLosers, 
        isLoading, 
        refreshData,
        lastUpdated,
        nextRefreshTime
      }}
    >
      {children}
    </MarketDataContext.Provider>
  );
}

// Custom hook to use the market data context
export function useMarketData() {
  const context = useContext(MarketDataContext);
  if (context === undefined) {
    throw new Error('useMarketData must be used within a MarketDataProvider');
  }
  return context;
} 