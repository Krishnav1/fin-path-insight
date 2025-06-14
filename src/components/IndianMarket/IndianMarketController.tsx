import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { ERROR_TYPES } from '@/utils/errorHandler';
import { 
  getIndianMarketOverview, 
  getIndianStocksBatch, 
  MarketOverview,
  StockData
} from '@/services/indianMarketService';
import { getWatchlist } from '@/services/userPreferencesService';

// Interfaces for component props and state
interface IndianMarketControllerProps {
  children: React.ReactNode;
}

interface MarketDataState {
  overview: MarketOverview | null;
  stocks: Record<string, StockData>;
  watchlistStocks: Record<string, StockData>;
  lastUpdated: string;
  isLoading: boolean;
  error: any | null;
}

// Context to share market data with child components
export const IndianMarketContext = React.createContext<{
  marketData: MarketDataState;
  refreshData: () => Promise<void>;
  addToWatchedStocks: (symbol: string) => void;
}>({
  marketData: {
    overview: null,
    stocks: {},
    watchlistStocks: {},
    lastUpdated: '',
    isLoading: true,
    error: null
  },
  refreshData: async () => {},
  addToWatchedStocks: () => {}
});

// Define common Indian stock symbols
const COMMON_INDIAN_STOCKS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 
  'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK',
  'LT', 'AXISBANK', 'BAJFINANCE', 'HCLTECH', 'ASIANPAINT'
];

// Format a timestamp for display
const formatTimestamp = (timestamp: string | undefined) => {
  if (!timestamp) return 'Unknown time';
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return timestamp;
  }
};

const IndianMarketController: React.FC<IndianMarketControllerProps> = ({ children }) => {
  // Initialize state
  const [marketData, setMarketData] = useState<MarketDataState>({
    overview: null,
    stocks: {},
    watchlistStocks: {},
    lastUpdated: new Date().toISOString(),
    isLoading: true,
    error: null
  });

  // Function to fetch all market data
  const fetchMarketData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setMarketData(prev => ({ ...prev, isLoading: true, error: null }));

      // 1. Fetch market overview data
      const overview = await getIndianMarketOverview(forceRefresh);
      
      // 2. Get watchlist items
      const watchlist = getWatchlist();
      const watchlistSymbols = watchlist.map(item => item.symbol.split('.')[0]);
      
      // 3. Combine common stocks and watchlist for a single batch fetch
      const allSymbols = [...new Set([...COMMON_INDIAN_STOCKS, ...watchlistSymbols])];
      
      // 4. Fetch stock data in optimized batches
      const allStocksData = await getIndianStocksBatch(allSymbols, forceRefresh);
      
      // 5. Separate common stocks and watchlist stocks
      const commonStocksData: Record<string, StockData> = {};
      const watchlistStocksData: Record<string, StockData> = {};
      
      Object.entries(allStocksData).forEach(([symbol, data]) => {
        if (COMMON_INDIAN_STOCKS.includes(symbol)) {
          commonStocksData[symbol] = data;
        }
        
        if (watchlistSymbols.includes(symbol)) {
          watchlistStocksData[symbol] = data;
        }
      });
      
      // 6. Update state with new data
      setMarketData({
        overview,
        stocks: commonStocksData,
        watchlistStocks: watchlistStocksData,
        lastUpdated: new Date().toISOString(),
        isLoading: false,
        error: null
      });
    } catch (err: any) {
      console.error('Error fetching Indian market data:', err);
      
      // Create standardized error object
      const errorObj = {
        type: err.type || ERROR_TYPES.UNKNOWN,
        message: err.message || 'Failed to fetch market data',
        context: 'IndianMarketController.fetchMarketData'
      };
      
      setMarketData(prev => ({ 
        ...prev, 
        isLoading: false,
        error: errorObj
      }));
    }
  }, []);

  // Add a stock to the watched stocks list
  const addToWatchedStocks = useCallback((symbol: string) => {
    // If we already have data for this stock, add it to the watchlist stocks
    const baseSymbol = symbol.split('.')[0];
    if (marketData.stocks[baseSymbol]) {
      setMarketData(prev => ({
        ...prev,
        watchlistStocks: {
          ...prev.watchlistStocks,
          [baseSymbol]: prev.stocks[baseSymbol]
        }
      }));
    } else {
      // Otherwise, fetch it
      getIndianStocksBatch([baseSymbol])
        .then(result => {
          setMarketData(prev => ({
            ...prev,
            watchlistStocks: {
              ...prev.watchlistStocks,
              ...result
            }
          }));
        })
        .catch(err => console.error('Error adding to watched stocks:', err));
    }
  }, [marketData.stocks]);

  // Initial data load
  useEffect(() => {
    fetchMarketData();
    
    // Set up auto-refresh interval (5 minutes)
    const intervalId = setInterval(() => {
      fetchMarketData(true);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchMarketData]);

  return (
    <div>
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Clock size={16} />
          <span>
            Last updated: {formatTimestamp(marketData.lastUpdated)}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchMarketData(true)}
          disabled={marketData.isLoading}
          className="flex items-center gap-1"
        >
          <RefreshCw size={16} className={marketData.isLoading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </Button>
      </div>
      
      {/* Display any errors */}
      {marketData.error && (
        <ErrorDisplay 
          error={marketData.error} 
          onRetry={() => fetchMarketData(true)} 
          className="mb-4"
        />
      )}
      
      {/* Provide data to children through context */}
      <IndianMarketContext.Provider value={{ 
        marketData, 
        refreshData: () => fetchMarketData(true),
        addToWatchedStocks
      }}>
        {children}
      </IndianMarketContext.Provider>
    </div>
  );
};

export default IndianMarketController;
