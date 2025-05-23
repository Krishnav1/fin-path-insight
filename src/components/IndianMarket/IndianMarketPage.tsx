import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import * as apiService from '@/services/apiService';
import { getMultiSourceStockData, getComprehensiveStockData } from '@/lib/api-service';
import useRealTimeStock, { RealTimeStockData } from '@/hooks/useRealTimeStock';
import { ConnectionState } from '@/services/webSocketService';
import { ERROR_TYPES } from '@/utils/errorHandler';
import './IndianMarketPage.css';
import axios from 'axios';

// Define error object interface
interface ErrorObject {
  type: string;
  message: string;
  context?: string;
}

// Define types for better type safety
interface MarketSegment {
  market: string;
  marketStatus: string;
  marketStatusMessage: string;
  tradeDate: string;
  index?: string;
  last?: number;
  percentChange?: number;
}

interface MarketStatus {
  marketState?: MarketSegment[];
  indicativenifty50?: {
    finalClosingValue?: number;
    closingValue?: number;
    change: string;
    perChange: string;
    status: string;
    dateTime: string;
  };
  marketcap?: {
    marketCapinLACCRRupeesFormatted: string;
    marketCapinTRDollars: string;
    timeStamp: string;
  };
}

interface StockData {
  symbol: string;
  companyName: string;
  lastPrice: number;
  change: number;
  pChange: number;
  marketCap: number;
  sector: string;
}

interface TopStocksData {
  stocks: StockData[];
  timestamp: string;
  source: string;
  error?: string;
}

const IndianMarketPage: React.FC = () => {
  const navigate = useNavigate();
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [topStocks, setTopStocks] = useState<TopStocksData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [realTimeEnabled, setRealTimeEnabled] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  // Use the real-time stock hook
  const { 
    stockData: realTimeStockData, 
    isConnected: isWebSocketConnected, 
    subscribe 
  } = useRealTimeStock();

  // Define Indian stock symbols for top stocks
  const indianStockSymbols = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 
    'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK',
    'LT', 'AXISBANK', 'BAJFINANCE', 'HCLTECH', 'ASIANPAINT'
  ];

  // Format timestamp for display
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

  useEffect(() => {
    fetchData();
    
    // Set up an interval to refresh data every 5 minutes as a fallback
    const intervalId = setInterval(() => {
      if (!realTimeEnabled || !isWebSocketConnected) {
        console.log('Fallback refresh: WebSocket not connected or disabled');
        fetchData();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(intervalId);
  }, []);

  // Update stocks when real-time data changes
  useEffect(() => {
    if (realTimeEnabled && isWebSocketConnected && topStocks && topStocks.stocks) {
      const updatedStocks = updateStocksWithRealTimeData(topStocks.stocks, realTimeStockData);
      
      setTopStocks(prev => ({
        ...prev,
        stocks: updatedStocks,
        timestamp: new Date().toLocaleString(),
        source: 'EODHD WebSocket (Real-time)'
      }));
    }
  }, [realTimeStockData, realTimeEnabled, isWebSocketConnected]);

  // Subscribe to new symbols when topStocks changes
  useEffect(() => {
    if (realTimeEnabled && topStocks && topStocks.stocks) {
      const symbolsToSubscribe = getSymbolsToSubscribe();
      subscribe(symbolsToSubscribe);
    }
  }, [topStocks?.stocks]);

  // Function to fetch market data using EODHD API
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Prepare the symbols for EODHD API (NSE exchange code)
      const formattedSymbols = indianStockSymbols.map(symbol => `${symbol}.NSE`);
      
      // Get EODHD API key and base URL from environment or default
      const EODHD_BASE_URL = '/api/eodhd-proxy'; // Proxied through backend
      const EODHD_API_KEY = import.meta.env.VITE_EODHD_API_KEY || '682ab8a9176503.56947213';
      
      // Fetch NSE index data (NIFTY 50) from EODHD
      const niftyResponse = await axios.get(
        `${EODHD_BASE_URL}/real-time/NIFTY50.INDX?fmt=json`
      ).then(response => response.data)
        .catch(err => {
          console.error('Error fetching NIFTY50 data:', err);
          return null;
        });
      
      // Fetch batch stock data for top Indian stocks
      const stockPromises = formattedSymbols.map(async (symbol) => {
        try {
          // Use the getMultiSourceStockData for detailed data
          const stockData = await getMultiSourceStockData(symbol, 'india')
            .catch(err => {
              console.error(`API error for ${symbol}:`, err);
              // Return a minimal object with the symbol to prevent null errors
              return {
                name: symbol.split('.')[0],
                price: 0,
                change: 0,
                changePercent: 0,
                marketCap: 0,
                sector: 'Technology'
              };
            });
          
          // Ensure we have a valid stockData object
          if (!stockData) {
            throw new Error(`No data returned for ${symbol}`);
          }
          
          return {
            symbol: symbol.split('.')[0], // Remove the .NSE suffix
            companyName: stockData.name || symbol.split('.')[0],
            lastPrice: stockData.price || 0,
            change: stockData.change || 0,
            pChange: stockData.changePercent || 0,
            marketCap: stockData.marketCap ? Math.floor(stockData.marketCap / 10000000) : 0, // Convert to crores
            sector: stockData.sector || 'Unknown'
          };
        } catch (err) {
          console.error(`Error processing data for ${symbol}:`, err);
          // Return a default object instead of null to prevent mapping errors
          return {
            symbol: symbol.split('.')[0],
            companyName: symbol.split('.')[0],
            lastPrice: 0,
            change: 0,
            pChange: 0,
            marketCap: 0,
            sector: 'Unknown'
          };
        }
      });
      
      // Wait for all stock data to be fetched
      const fetchedStocks = await Promise.all(stockPromises);
      
      // Apply real-time data if available and enabled
      const finalStocks = realTimeEnabled && isWebSocketConnected 
        ? updateStocksWithRealTimeData(fetchedStocks, realTimeStockData)
        : fetchedStocks;
      
      const topStocksData: TopStocksData = {
        stocks: finalStocks,
        timestamp: new Date().toLocaleString(),
        source: realTimeEnabled && isWebSocketConnected ? 'EODHD WebSocket (Real-time)' : 'EODHD API'
      };

      // Create market status data
      const marketStatusData: MarketStatus = {
        indicativenifty50: {
          finalClosingValue: niftyResponse?.price || 0,
          closingValue: niftyResponse?.price || 0,
          change: niftyResponse?.change?.toString() || '0',
          perChange: niftyResponse?.changePercent?.toString() || '0',
          status: new Date().getHours() < 16 ? 'Open' : 'Closed', // Basic logic - update as needed
          dateTime: new Date().toISOString()
        },
        marketcap: {
          marketCapinLACCRRupeesFormatted: '300+', // This would need to be calculated correctly from actual data
          marketCapinTRDollars: '3.5+', // This would need to be calculated correctly from actual data
          timeStamp: new Date().toISOString()
        },
        marketState: [
          {
            market: 'NSE',
            marketStatus: new Date().getHours() < 16 ? 'Open' : 'Closed',
            marketStatusMessage: new Date().getHours() < 16 ? 'Trading in Progress' : 'Market Closed for the Day',
            tradeDate: new Date().toISOString().split('T')[0],
            index: 'NIFTY 50',
            last: niftyResponse?.price || 0,
            percentChange: niftyResponse?.changePercent || 0
          },
          {
            market: 'BSE',
            marketStatus: new Date().getHours() < 16 ? 'Open' : 'Closed',
            marketStatusMessage: new Date().getHours() < 16 ? 'Trading in Progress' : 'Market Closed for the Day',
            tradeDate: new Date().toISOString().split('T')[0],
            index: 'SENSEX',
            last: 0, // Would need another API call for BSE data
            percentChange: 0 // Would need another API call for BSE data
          }
        ]
      };
      
      // Sort stocks by market cap
      finalStocks.sort((a, b) => b.marketCap - a.marketCap);
      
      setMarketStatus(marketStatusData);
      setTopStocks(topStocksData);
      setLastUpdated(new Date().toISOString());
    } catch (err: any) {
      console.error('Error fetching Indian market data:', err);
      
      // Use our error handler to get a standardized error object
      const errorObj = {
        type: err.type || ERROR_TYPES.UNKNOWN,
        message: err.message || 'Failed to fetch market data',
        context: 'IndianMarketPage.fetchData'
      };
      
      setError(errorObj);
      
      // Keep old data if available, only clear if we have nothing
      if (!marketStatus) setMarketStatus(null);
      if (!topStocks) setTopStocks(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle stock click and navigate to company analysis
  const handleStockClick = (symbol: string) => {
    // Symbol should already be without .NS or .NSE suffix
    navigate(`/company-analysis/${symbol}`);
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    await fetchData();
  };
  
  // Function to update stocks with real-time data with defensive checks
  const updateStocksWithRealTimeData = (stocks: StockData[], realTimeData: RealTimeStockData) => {
    if (!stocks || !Array.isArray(stocks) || !realTimeData) {
      return stocks || [];
    }
    
    return stocks.map(stock => {
      if (!stock || typeof stock !== 'object') {
        return {
          symbol: 'UNKNOWN',
          companyName: 'Unknown',
          lastPrice: 0,
          change: 0,
          pChange: 0,
          marketCap: 0,
          sector: 'Unknown'
        };
      }
      
      const realTimeStock = stock.symbol ? realTimeData[stock.symbol] : null;
      if (realTimeStock) {
        return {
          ...stock,
          lastPrice: typeof realTimeStock.price === 'number' ? realTimeStock.price : (stock.lastPrice || 0),
          change: typeof realTimeStock.change === 'number' ? realTimeStock.change : (stock.change || 0),
          pChange: typeof realTimeStock.changePercent === 'number' ? realTimeStock.changePercent : (stock.pChange || 0)
        };
      }
      return {
        ...stock,
        lastPrice: stock.lastPrice || 0,
        change: stock.change || 0,
        pChange: stock.pChange || 0,
        marketCap: stock.marketCap || 0,
        sector: stock.sector || 'Unknown'
      };
    });
  };

  // Function to get symbols to subscribe to WebSocket
  const getSymbolsToSubscribe = () => {
    return indianStockSymbols.map(symbol => symbol.split('.')[0]);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      <main className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Indian Market Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400">Live data from National Stock Exchange of India (NSE)</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <span className="mr-2 text-sm">Real-time:</span>
              <div 
                className={`w-3 h-3 rounded-full mr-1 ${isWebSocketConnected && realTimeEnabled ? 'bg-green-500' : 'bg-gray-400'}`} 
                title={isWebSocketConnected && realTimeEnabled ? 'Connected' : 'Disconnected'}
              ></div>
              <button 
                onClick={() => setRealTimeEnabled(!realTimeEnabled)} 
                className={`text-xs px-2 py-1 rounded ${realTimeEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
              >
                {realTimeEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {error && (
          <ErrorDisplay 
            error={error} 
            onRetry={handleRefresh} 
            className="mb-6" 
          />
        )}

        {isLoading && !error ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* Market Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Market Overview</CardTitle>
                <CardDescription>
                  Key metrics for the Indian stock market
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* NIFTY 50 Snapshot */}
                  {marketStatus && marketStatus.indicativenifty50 && (
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-50">NIFTY 50</h3>
                      <div className="text-2xl font-bold mb-1">
                        {marketStatus.indicativenifty50.finalClosingValue || marketStatus.indicativenifty50.closingValue || 'N/A'}
                      </div>
                      <div className={`flex items-center gap-1 text-sm font-medium ${marketStatus.indicativenifty50.change && parseFloat(marketStatus.indicativenifty50.change) >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                        {marketStatus.indicativenifty50.change || 'N/A'} ({marketStatus.indicativenifty50.perChange || 'N/A'}%)
                        {marketStatus.indicativenifty50.change && parseFloat(marketStatus.indicativenifty50.change) >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Status: {marketStatus.indicativenifty50.status || 'Unknown'}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        As of: {marketStatus.indicativenifty50.dateTime || formatTimestamp(lastUpdated) || 'Unknown time'}
                      </div>
                    </div>
                  )}

                  {/* Market Capitalization */}
                  {marketStatus && marketStatus.marketcap && (
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-50">Market Capitalization</h3>
                      <div className="text-xl font-bold mb-1">
                        {marketStatus.marketcap.marketCapinLACCRRupeesFormatted || 'N/A'} Lakh Cr
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        ({marketStatus.marketcap.marketCapinTRDollars || 'N/A'} Trillion USD)
                      </div>
                      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        As of: {marketStatus.marketcap.timeStamp || 'Unknown time'}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Market Segments Card */}
            {marketStatus && marketStatus.marketState && marketStatus.marketState.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Market Segments</CardTitle>
                  <CardDescription>
                    Current status of different market segments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {marketStatus.marketState.map((segment, index) => {
                      // Safely handle potentially undefined properties
                      const statusClass = segment.marketStatus ? 
                        segment.marketStatus.toLowerCase().replace(/\s+/g, '-') : 
                        'unknown';
                      
                      return (
                        <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-50">{segment.market || 'Unknown Market'}</h4>
                          <div className="mt-2">
                            <span className="text-sm font-medium">Status: </span>
                            <span className={`text-sm font-medium ${statusClass === 'open' ? 'text-green-600 dark:text-green-500' : statusClass === 'close' ? 'text-red-600 dark:text-red-500' : 'text-yellow-600 dark:text-yellow-500'}`}>
                              {segment.marketStatus || 'Unknown'}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {segment.marketStatusMessage || 'No message available'}
                          </div>
                          {segment.index && (
                            <div className="mt-2 text-sm">
                              <span className="text-slate-500 dark:text-slate-400">Index: </span>
                              <span className="font-medium">{segment.index}</span>
                              {segment.last && (
                                <span> - {segment.last}</span>
                              )}
                              {segment.percentChange !== undefined && (
                                <span className={segment.percentChange >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                                  {' '}({segment.percentChange}%)
                                </span>
                              )}
                            </div>
                          )}
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Trade Date: {segment.tradeDate || 'Unknown date'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top NSE Stocks Card */}
            <Card>
              <CardHeader>
                <CardTitle>Top NSE Stocks</CardTitle>
                <CardDescription>
                  Leading stocks on the National Stock Exchange
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!topStocks || !topStocks.stocks || topStocks.stocks.length === 0 ? (
                  <p className="text-center py-6 text-slate-500 dark:text-slate-400">Top stocks data not available.</p>
                ) : (
                  <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800">
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Symbol</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400 hidden md:table-cell">Company Name</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-500 dark:text-slate-400">Last Price (₹)</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-500 dark:text-slate-400">Change</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-500 dark:text-slate-400 hidden sm:table-cell">Market Cap (Cr)</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400 hidden lg:table-cell">Sector</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {topStocks.stocks.map((stock, index) => (
                            <tr 
                              key={index} 
                              onClick={() => handleStockClick(stock.symbol)}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-50">{stock.symbol}</td>
                              <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell">{stock.companyName}</td>
                              <td className="px-4 py-3 text-sm font-medium text-right text-slate-900 dark:text-slate-50">{stock.lastPrice.toLocaleString('en-IN')}</td>
                              <td className="px-4 py-3 text-sm font-medium text-right flex items-center justify-end gap-1">
                                <span className={stock.change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.pChange >= 0 ? '+' : ''}{stock.pChange.toFixed(2)}%)
                                </span>
                                {stock.change >= 0 ? (
                                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-500" />
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-slate-500 dark:text-slate-400 hidden sm:table-cell">{(stock.marketCap).toLocaleString('en-IN')}</td>
                              <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 hidden lg:table-cell">{stock.sector}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400">
                      <p>Last updated: {topStocks.timestamp ? formatTimestamp(topStocks.timestamp) : 'Unknown'}</p>
                      <p className="mt-1">Click on any stock to view detailed company analysis</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default IndianMarketPage;