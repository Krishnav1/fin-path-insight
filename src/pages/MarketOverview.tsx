import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, ChevronDown, Search, RefreshCw } from "lucide-react";
import { useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarket } from "@/hooks/use-market";
import { useMarketData } from "@/context/market-data-context";
import { StockQuote } from "@/lib/api-service";
import { Link } from "react-router-dom";

// Define types for mock data (for fallback)
type MarketData = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  type: 'stock' | 'crypto' | 'etf' | 'index';
  market: 'global' | 'india';
};

const MarketOverview = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const typeParam = queryParams.get('type');
  const [activeTab, setActiveTab] = useState<string>(typeParam || "stocks");
  const { market } = useMarket();
  const { 
    indices, 
    popularStocks, 
    topGainers, 
    topLosers, 
    isLoading, 
    refreshData,
    lastUpdated 
  } = useMarketData();

  // Set active tab based on query parameter when it changes
  useEffect(() => {
    if (typeParam) {
      setActiveTab(typeParam);
    }
  }, [typeParam]);

  // Convert market data context to format expected by UI
  const convertStockDataToMarketData = (
    data: Record<string, StockQuote>, 
    type: 'stock' | 'crypto' | 'etf' | 'index'
  ): MarketData[] => {
    return Object.values(data).map(stock => ({
      symbol: stock.symbol,
      name: stock.name || stock.symbol,
      price: stock.price,
      change: stock.change,
      changePercent: stock.changePercent,
      volume: stock.volume,
      type,
      market: stock.symbol && stock.symbol.includes('.NS') ? 'india' : 'global'
    }));
  };

  // Combine live data with existing mock data structure for each type
  const getStockData = (): MarketData[] => {
    const liveStocks = convertStockDataToMarketData(popularStocks, 'stock');
    
    // Fallback to empty array if no live data
    return liveStocks;
  };

  const getETFData = (): MarketData[] => {
    // For ETFs, we'll still use mock data for now
    return mockData.filter(item => item.type === 'etf' && item.market === market);
  };

  const getCryptoData = (): MarketData[] => {
    // For crypto, we'll still use mock data for now
    return mockData.filter(item => item.type === 'crypto');
  };

  const getIndicesData = (): MarketData[] => {
    // Convert live indices data
    return indices.map(index => {
      // Determine market based on symbol
      const marketValue = index.symbol && index.symbol.includes('.NS') ? 'india' : 'global';
      
      return {
        symbol: index.symbol,
        name: index.name,
        price: index.price,
        change: index.change,
        changePercent: index.changePercent,
        volume: 0,
        type: 'index' as const, // Use const assertion to ensure type is strictly 'index'
        market: marketValue as 'global' | 'india' // Use type assertion to ensure market is strictly 'global' or 'india'
      };
    }).filter(item => item.market === market);
  };

  // Filter data by search query
  const filterBySearch = (data: MarketData[]) => {
    if (!searchQuery) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter(
      item => 
        item.symbol.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query)
    );
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    await refreshData();
  };

  // Fallback mock data for when API fails or for categories we don't have live data for yet
  const mockData: MarketData[] = [
    // Global Stocks
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      price: 187.32,
      change: 1.43,
      changePercent: 0.77,
      volume: 54321000,
      type: 'stock',
      market: 'global'
    },
    // ... Rest of the existing mock data
    // Indian Stocks
    {
      symbol: "RELIANCE.NS",
      name: "Reliance Industries",
      price: 2857.45,
      change: 32.65,
      changePercent: 1.15,
      volume: 7865000,
      type: 'stock',
      market: 'india'
    },
    // Global ETFs
    {
      symbol: "SPY",
      name: "SPDR S&P 500 ETF Trust",
      price: 488.65,
      change: 3.21,
      changePercent: 0.66,
      volume: 78954000,
      type: 'etf',
      market: 'global'
    },
    {
      symbol: "QQQ",
      name: "Invesco QQQ Trust",
      price: 422.37,
      change: 5.43,
      changePercent: 1.30,
      volume: 32567000,
      type: 'etf',
      market: 'global'
    },
    // Indian ETFs
    {
      symbol: "NIFTYBEES.NS",
      name: "Nippon India ETF Nifty BeES",
      price: 256.85,
      change: 1.75,
      changePercent: 0.69,
      volume: 1234500,
      type: 'etf',
      market: 'india'
    },
    // Global Crypto
    {
      symbol: "BTC-USD",
      name: "Bitcoin",
      price: 67843.21,
      change: 1245.67,
      changePercent: 1.87,
      volume: 32456000000,
      type: 'crypto',
      market: 'global'
    },
    {
      symbol: "ETH-USD",
      name: "Ethereum",
      price: 3567.89,
      change: 87.45,
      changePercent: 2.51,
      volume: 15678000000,
      type: 'crypto',
      market: 'global'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />
        <main className="container py-8 px-4 md:px-6">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-slate-500 dark:text-slate-400">Fetching live market data...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formatTimestamp = (timestamp: Date | null) => {
    if (!timestamp) return 'Not available';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(timestamp);
  };

  const formatCurrency = (value: number, symbol: string) => {
    // Use consistent currency symbols based on market type
    const currencySymbol = market === "india" && (symbol && symbol.includes('.NS')) ? "₹" : "$";
    
    // Format large numbers with appropriate suffixes
    if (value >= 1e9) {
      return `${currencySymbol}${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `${currencySymbol}${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `${currencySymbol}${(value / 1e3).toFixed(2)}K`;
    } else {
      return `${currencySymbol}${value.toFixed(2)}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="container py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Market Overview</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {market === 'global' ? 'Global' : 'Indian'} market summary and performance
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Powered by EODHD Financial API</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                placeholder="Search markets..."
                className="w-full md:w-[300px] pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh}
              className="flex-shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex items-center justify-end gap-2">
          <span>Last updated:</span>
          <time dateTime={lastUpdated?.toISOString()}>{formatTimestamp(lastUpdated)}</time>
        </div>
        
        <div className="grid grid-cols-1 gap-6 mt-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Market Data</CardTitle>
              <CardDescription>
                Latest market data from {market === 'global' ? 'global' : 'Indian'} markets
                {lastUpdated && (
                  <span className="block text-xs mt-1">
                    Last updated: {formatTimestamp(lastUpdated)}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full md:w-auto grid grid-cols-2 md:flex md:gap-2">
                  <TabsTrigger value="stocks" className="flex-1">Stocks</TabsTrigger>
                  <TabsTrigger value="etfs" className="flex-1">ETFs</TabsTrigger>
                  <TabsTrigger value="crypto" className="flex-1">Crypto</TabsTrigger>
                  <TabsTrigger value="movers" className="flex-1">Top Movers</TabsTrigger>
                </TabsList>
                
                <TabsContent value="stocks">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Stocks</CardTitle>
                      <CardDescription>
                        Most active stocks in {market === 'global' ? 'global' : 'Indian'} markets
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <div className="grid grid-cols-12 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                          <div className="col-span-4 md:col-span-3">Symbol</div>
                          <div className="col-span-4 md:col-span-5 hidden md:block">Name</div>
                          <div className="col-span-4 md:col-span-2 text-right">Price</div>
                          <div className="col-span-4 md:col-span-2 text-right">Change</div>
                        </div>
                        <div className="divide-y dark:divide-slate-700">
                          {filterBySearch(getStockData()).length > 0 ? (
                            filterBySearch(getStockData()).map((item) => (
                              <Link 
                                to={`/company/${item.symbol}`}
                                key={item.symbol}
                                className="grid grid-cols-12 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
                              >
                                <div className="col-span-4 md:col-span-3 font-medium">{item.symbol}</div>
                                <div className="col-span-4 md:col-span-5 hidden md:block text-slate-500 dark:text-slate-400 truncate">{item.name}</div>
                                <div className="col-span-4 md:col-span-2 text-right font-medium">{formatCurrency(item.price, item.symbol)}</div>
                                <div className={`col-span-4 md:col-span-2 text-right flex items-center justify-end gap-1 ${
                                  item.change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                                }`}>
                                  {item.changePercent.toFixed(2)}%
                                  {item.change >= 0 ? (
                                    <TrendingUp className="h-4 w-4" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4" />
                                  )}
                                </div>
                              </Link>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                              No stocks found in {market} markets matching your search.
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {market === 'global' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Top Gainers</CardTitle>
                          <CardDescription>
                            Best performing stocks today
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="rounded-md border">
                            <div className="grid grid-cols-12 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                              <div className="col-span-4">Symbol</div>
                              <div className="col-span-4 text-right">Price</div>
                              <div className="col-span-4 text-right">Change</div>
                            </div>
                            <div className="divide-y dark:divide-slate-700">
                              {topGainers.length > 0 ? (
                                topGainers.map((item) => (
                                  <Link 
                                    to={`/company/${item.symbol}`}
                                    key={item.symbol}
                                    className="grid grid-cols-12 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                  >
                                    <div className="col-span-4 font-medium truncate">{item.symbol}</div>
                                    <div className="col-span-4 text-right font-medium">${item.price.toFixed(2)}</div>
                                    <div className="col-span-4 text-right flex items-center justify-end gap-1 text-green-600 dark:text-green-500">
                                      {item.changePercent.toFixed(2)}%
                                      <TrendingUp className="h-4 w-4" />
                                    </div>
                                  </Link>
                                ))
                              ) : (
                                <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                                  No data available.
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Top Losers</CardTitle>
                          <CardDescription>
                            Worst performing stocks today
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="rounded-md border">
                            <div className="grid grid-cols-12 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                              <div className="col-span-4">Symbol</div>
                              <div className="col-span-4 text-right">Price</div>
                              <div className="col-span-4 text-right">Change</div>
                            </div>
                            <div className="divide-y dark:divide-slate-700">
                              {topLosers.length > 0 ? (
                                topLosers.map((item) => (
                                  <Link 
                                    to={`/company/${item.symbol}`}
                                    key={item.symbol}
                                    className="grid grid-cols-12 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                  >
                                    <div className="col-span-4 font-medium truncate">{item.symbol}</div>
                                    <div className="col-span-4 text-right font-medium">${item.price.toFixed(2)}</div>
                                    <div className="col-span-4 text-right flex items-center justify-end gap-1 text-red-600 dark:text-red-500">
                                      {item.changePercent.toFixed(2)}%
                                      <TrendingDown className="h-4 w-4" />
                                    </div>
                                  </Link>
                                ))
                              ) : (
                                <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                                  No data available.
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="etfs">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top ETFs</CardTitle>
                      <CardDescription>
                        Most active ETFs in {market === 'global' ? 'global' : 'Indian'} markets
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <div className="grid grid-cols-12 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                          <div className="col-span-4 md:col-span-3">Symbol</div>
                          <div className="col-span-4 md:col-span-5 hidden md:block">Name</div>
                          <div className="col-span-4 md:col-span-2 text-right">Price</div>
                          <div className="col-span-4 md:col-span-2 text-right">Change</div>
                        </div>
                        <div className="divide-y dark:divide-slate-700">
                          {filterBySearch(getETFData()).length > 0 ? (
                            filterBySearch(getETFData()).map((item) => (
                              <div
                                key={item.symbol}
                                className="grid grid-cols-12 px-4 py-3 text-sm"
                              >
                                <div className="col-span-4 md:col-span-3 font-medium">{item.symbol}</div>
                                <div className="col-span-4 md:col-span-5 hidden md:block text-slate-500 dark:text-slate-400 truncate">{item.name}</div>
                                <div className="col-span-4 md:col-span-2 text-right font-medium">{formatCurrency(item.price, item.symbol)}</div>
                                <div className={`col-span-4 md:col-span-2 text-right flex items-center justify-end gap-1 ${
                                  item.change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                                }`}>
                                  {item.changePercent.toFixed(2)}%
                                  {item.change >= 0 ? (
                                    <TrendingUp className="h-4 w-4" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4" />
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                              No ETFs found in {market} markets matching your search.
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="crypto">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Cryptocurrencies</CardTitle>
                      <CardDescription>
                        Most active cryptocurrencies by market cap
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <div className="grid grid-cols-12 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                          <div className="col-span-4 md:col-span-3">Symbol</div>
                          <div className="col-span-4 md:col-span-5 hidden md:block">Name</div>
                          <div className="col-span-4 md:col-span-2 text-right">Price</div>
                          <div className="col-span-4 md:col-span-2 text-right">Change</div>
                        </div>
                        <div className="divide-y dark:divide-slate-700">
                          {filterBySearch(getCryptoData()).length > 0 ? (
                            filterBySearch(getCryptoData()).map((item) => (
                              <div
                                key={item.symbol}
                                className="grid grid-cols-12 px-4 py-3 text-sm"
                              >
                                <div className="col-span-4 md:col-span-3 font-medium">{item.symbol}</div>
                                <div className="col-span-4 md:col-span-5 hidden md:block text-slate-500 dark:text-slate-400 truncate">{item.name}</div>
                                <div className="col-span-4 md:col-span-2 text-right font-medium">${item.price.toFixed(2)}</div>
                                <div className={`col-span-4 md:col-span-2 text-right flex items-center justify-end gap-1 ${
                                  item.change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                                }`}>
                                  {item.changePercent.toFixed(2)}%
                                  {item.change >= 0 ? (
                                    <TrendingUp className="h-4 w-4" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4" />
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                              No cryptocurrencies found matching your search.
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="movers">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Movers</CardTitle>
                      <CardDescription>
                        Top movers in {market === 'global' ? 'global' : 'Indian'} markets
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <div className="grid grid-cols-12 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                          <div className="col-span-4 md:col-span-3">Symbol</div>
                          <div className="col-span-4 md:col-span-5 hidden md:block">Name</div>
                          <div className="col-span-4 md:col-span-2 text-right">Price</div>
                          <div className="col-span-4 md:col-span-2 text-right">Change</div>
                        </div>
                        <div className="divide-y dark:divide-slate-700">
                          {filterBySearch(getStockData()).length > 0 ? (
                            filterBySearch(getStockData()).map((item) => (
                              <div
                                key={item.symbol}
                                className="grid grid-cols-12 px-4 py-3 text-sm"
                              >
                                <div className="col-span-4 md:col-span-3 font-medium">{item.symbol}</div>
                                <div className="col-span-4 md:col-span-5 hidden md:block text-slate-500 dark:text-slate-400 truncate">{item.name}</div>
                                <div className="col-span-4 md:col-span-2 text-right font-medium">{formatCurrency(item.price, item.symbol)}</div>
                                <div className={`col-span-4 md:col-span-2 text-right flex items-center justify-end gap-1 ${
                                  item.change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                                }`}>
                                  {item.changePercent.toFixed(2)}%
                                  {item.change >= 0 ? (
                                    <TrendingUp className="h-4 w-4" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4" />
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                              No stocks found in {market} markets matching your search.
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MarketOverview;
