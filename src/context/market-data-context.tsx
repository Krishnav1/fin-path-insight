import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StockQuote, MarketIndex, getMajorIndices, getTopGainersLosers, getMultiSourceStockData, getComprehensiveStockData } from '@/lib/api-service';
import { useMarket } from '@/hooks/use-market';
import axios from 'axios';

// Define market data types for the context
interface MarketDataContextType {
  indices: MarketIndex[];
  popularStocks: Record<string, StockQuote>;
  topGainers: StockQuote[];
  topLosers: StockQuote[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  lastUpdated: Date | null;
}

// Create the context with default values
const MarketDataContext = createContext<MarketDataContextType>({
  indices: [],
  popularStocks: {},
  topGainers: [],
  topLosers: [],
  isLoading: true,
  refreshData: async () => {},
  lastUpdated: null
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
  const { market } = useMarket();
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [popularStocks, setPopularStocks] = useState<Record<string, StockQuote>>({});
  const [topGainers, setTopGainers] = useState<StockQuote[]>([]);
  const [topLosers, setTopLosers] = useState<StockQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // EODHD API configuration
  const EODHD_BASE_URL = '/api/eodhd-proxy'; // Uses the proxy through the backend
  const EODHD_API_KEY = import.meta.env.VITE_EODHD_API_KEY || '682ab8a9176503.56947213';

  // Function to fetch all market data using EODHD API
  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      // Get major indices data
      const indicesData = await getMajorIndices();
      if (indicesData) {
        setIndices(indicesData);
      }

      // Get popular stocks based on selected market
      const stockSymbols = market === 'global' ? GLOBAL_POPULAR_STOCKS : INDIA_POPULAR_STOCKS;
      const stocksData: Record<string, StockQuote> = {};
      
      // Format symbols according to EODHD requirements
      const formattedSymbols = stockSymbols.map(symbol => {
        if (market === 'india') {
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
            `${EODHD_BASE_URL}/real-time/${formattedSymbol}?fmt=json`
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
      const results = await Promise.all(stockPromises);
      
      // Process results
      results.forEach(result => {
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
        .filter(stock => stock.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 5);
      
      // Sort by percent change for losers (lowest first)
      const losers = [...stocksArray]
        .filter(stock => stock.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
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

  // Fetch data on initial load and when market changes
  useEffect(() => {
    fetchMarketData();
    
    // Auto refresh every 15 minutes (adjusted for EODHD API rate limits)
    // EODHD recommends not making too many requests in short periods
    const intervalId = setInterval(fetchMarketData, 15 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [market]);

  return (
    <MarketDataContext.Provider 
      value={{ 
        indices, 
        popularStocks, 
        topGainers, 
        topLosers, 
        isLoading, 
        refreshData: fetchMarketData,
        lastUpdated
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