import React, { useState, useEffect } from 'react';
import { Star, XCircle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  getWatchlist, 
  removeFromWatchlist, 
  WatchlistItem 
} from '@/services/userPreferencesService';
import { getCacheItem, setCacheItem } from '@/services/cacheService';
import axios from 'axios';

// Define types for better type safety
interface StockData {
  symbol: string;
  companyName: string;
  lastPrice: number;
  change: number;
  pChange: number;
  sector: string;
}

interface WatchlistProps {
  onRefresh?: () => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ onRefresh }) => {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [stockData, setStockData] = useState<Record<string, StockData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const navigate = useNavigate();

  // Load watchlist on component mount
  useEffect(() => {
    loadWatchlist();
  }, []);

  // Load watchlist and fetch data
  const loadWatchlist = async () => {
    const items = getWatchlist();
    setWatchlistItems(items);
    
    if (items.length > 0) {
      await fetchWatchlistData(items);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string | number) => {
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
      return String(timestamp);
    }
  };

  // Fetch data for watchlist items
  const fetchWatchlistData = async (items: WatchlistItem[]) => {
    if (items.length === 0) return;
    
    setIsLoading(true);
    
    try {
      // Check if we have cached data first
      const cachedData = getCacheItem<Record<string, StockData>>('watchlist_data');
      if (cachedData) {
        setStockData(cachedData);
        setLastUpdated(new Date().toISOString());
        setIsLoading(false);
        return;
      }
      
      // Import API endpoints for Supabase Edge Functions
      const { API_ENDPOINTS } = await import('@/config/api-config');
      
      // Prepare symbols for batch API call (max 15 symbols per request as recommended)
      const symbols = items.map(item => item.symbol);
      const batches = [];
      
      // Split into batches of 15 symbols
      for (let i = 0; i < symbols.length; i += 15) {
        batches.push(symbols.slice(i, i + 15));
      }
      
      // Fetch data for each batch
      const batchResults: Record<string, StockData> = {};
      
      await Promise.all(batches.map(async (batchSymbols) => {
        try {
          // Use the first symbol as the main symbol and the rest as additional symbols
          const mainSymbol = batchSymbols[0];
          const additionalSymbols = batchSymbols.slice(1);
          
          const url = additionalSymbols.length > 0
            ? `${API_ENDPOINTS.EODHD_PROXY}/real-time/${mainSymbol}?s=${additionalSymbols.join(',')}&fmt=json`
            : `${API_ENDPOINTS.EODHD_PROXY}/real-time/${mainSymbol}?fmt=json`;
            
          const response = await axios.get(url);
          
          // Process the response (handle both single and batch responses)
          if (Array.isArray(response.data)) {
            // Batch response
            response.data.forEach((item: any) => {
              const symbol = item.code.split('.')[0];
              batchResults[symbol] = {
                symbol,
                companyName: symbol, // We might not have the company name
                lastPrice: item.close || 0,
                change: item.change || 0,
                pChange: item.change_p || 0,
                sector: 'Unknown' // We might not have sector information
              };
            });
          } else {
            // Single item response
            const item = response.data;
            const symbol = item.code.split('.')[0];
            batchResults[symbol] = {
              symbol,
              companyName: symbol,
              lastPrice: item.close || 0,
              change: item.change || 0,
              pChange: item.change_p || 0,
              sector: 'Unknown'
            };
          }
        } catch (error) {
          console.error('Error fetching batch data:', error);
        }
      }));
      
      // Update state with the fetched data
      setStockData(batchResults);
      setLastUpdated(new Date().toISOString());
      
      // Cache the results
      setCacheItem('watchlist_data', batchResults);
    } catch (error) {
      console.error('Error fetching watchlist data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    await fetchWatchlistData(watchlistItems);
    if (onRefresh) {
      onRefresh();
    }
  };

  // Handle removing an item from watchlist
  const handleRemoveItem = (symbol: string) => {
    removeFromWatchlist(symbol);
    setWatchlistItems(prevItems => prevItems.filter(item => item.symbol !== symbol));
  };

  // Handle stock click to navigate to company analysis
  const handleStockClick = (symbol: string) => {
    navigate(`/company-analysis/${symbol.split('.')[0]}`);
  };

  return (
    <Card className="bg-white dark:bg-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Watchlist</span>
            </CardTitle>
            <CardDescription>Your favorite Indian stocks</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {watchlistItems.length === 0 ? (
          <div className="py-6 text-center text-slate-500 dark:text-slate-400">
            <p>Your watchlist is empty.</p>
            <p className="text-sm mt-2">Add stocks to track your favorites.</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Symbol</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-500 dark:text-slate-400">Price (₹)</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-500 dark:text-slate-400">Change</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {watchlistItems.map((item, index) => {
                    const symbol = item.symbol.split('.')[0];
                    const data = stockData[symbol] || {
                      lastPrice: 0,
                      change: 0,
                      pChange: 0
                    };
                    
                    return (
                      <tr 
                        key={index} 
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td 
                          className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-50 cursor-pointer"
                          onClick={() => handleStockClick(symbol)}
                        >
                          {symbol}
                        </td>
                        <td 
                          className="px-4 py-3 text-sm font-medium text-right text-slate-900 dark:text-slate-50 cursor-pointer"
                          onClick={() => handleStockClick(symbol)}
                        >
                          {data.lastPrice ? data.lastPrice.toLocaleString('en-IN') : '-'}
                        </td>
                        <td 
                          className="px-4 py-3 text-sm font-medium text-right flex items-center justify-end gap-1 cursor-pointer"
                          onClick={() => handleStockClick(symbol)}
                        >
                          <span className={data.change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                            {data.change >= 0 ? '+' : ''}{data.change ? data.change.toFixed(2) : '-'} ({data.pChange >= 0 ? '+' : ''}{data.pChange ? data.pChange.toFixed(2) : '-'}%)
                          </span>
                          {data.change > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />
                          ) : data.change < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-500" />
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.symbol)}
                            title="Remove from watchlist"
                          >
                            <XCircle className="h-4 w-4 text-slate-500 hover:text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Last updated: {formatTimestamp(lastUpdated)}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Watchlist;
