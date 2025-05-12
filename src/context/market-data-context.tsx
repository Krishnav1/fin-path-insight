import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StockQuote, MarketIndex, getMajorIndices, getTopGainersLosers, getMultiSourceStockData } from '@/lib/api-service';
import { useMarket } from '@/hooks/use-market';

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
const GLOBAL_POPULAR_STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];
const INDIA_POPULAR_STOCKS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'TATAMOTORS']; // Removed .NS suffix

export function MarketDataProvider({ children }: { children: ReactNode }) {
  const { market } = useMarket();
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [popularStocks, setPopularStocks] = useState<Record<string, StockQuote>>({});
  const [topGainers, setTopGainers] = useState<StockQuote[]>([]);
  const [topLosers, setTopLosers] = useState<StockQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Function to fetch all market data
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
      
      for (const symbol of stockSymbols) {
        let quote: StockQuote | null = null;
        
        // Use consistent multi-source data fetching for both markets
        const symbolWithSuffix = market === 'india' && !symbol.includes('.NS') ? `${symbol}.NS` : symbol;
        const stockData = await getMultiSourceStockData(symbolWithSuffix, market);
        
        if (stockData) {
          // Convert comprehensive data to StockQuote format
          quote = {
            symbol: stockData.symbol,
            name: stockData.name,
            price: stockData.price,
            change: stockData.change,
            changePercent: stockData.changePercent,
            volume: stockData.volume || 0,
            marketCap: stockData.marketCap,
            previousClose: stockData.previousClose,
            open: stockData.open,
            high: stockData.high,
            low: stockData.low,
            timestamp: new Date().toISOString().split('T')[0]
          };
        }
        
        if (quote) {
          // Store with clean symbol for India market (without .NS)
          const displayKey = market === 'india' ? symbol : quote.symbol;
          stocksData[displayKey] = quote;
        }
        
        // Add small delay to avoid API rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      setPopularStocks(stocksData);

      // Get top gainers and losers (Note: This Alpha Vantage endpoint is US-only)
      // For Indian market, we might need to filter our own collection of stocks
      if (market === 'global') {
        const topMovers = await getTopGainersLosers();
        if (topMovers) {
          // Convert API format to our StockQuote format
          const gainers = (topMovers.top_gainers || []).map((item: any) => ({
            symbol: item.ticker,
            price: parseFloat(item.price),
            change: parseFloat(item.change_amount),
            changePercent: parseFloat(item.change_percentage.replace('%', '')),
            volume: parseInt(item.volume),
            timestamp: new Date().toISOString().split('T')[0]
          } as StockQuote)).slice(0, 5);
          
          const losers = (topMovers.top_losers || []).map((item: any) => ({
            symbol: item.ticker,
            price: parseFloat(item.price),
            change: parseFloat(item.change_amount),
            changePercent: parseFloat(item.change_percentage.replace('%', '')),
            volume: parseInt(item.volume),
            timestamp: new Date().toISOString().split('T')[0]
          } as StockQuote)).slice(0, 5);
          
          setTopGainers(gainers);
          setTopLosers(losers);
        }
      }

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
    
    // Auto refresh every 5 minutes (adjust based on API rate limits)
    const intervalId = setInterval(fetchMarketData, 5 * 60 * 1000);
    
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