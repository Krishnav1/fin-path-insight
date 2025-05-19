import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Search, RefreshCw, Wifi, WifiOff } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarket } from "@/hooks/use-market";
import { useMarketData } from "@/context/market-data-context";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useRealTimeStock, { RealTimeStockData } from "@/hooks/useRealTimeStock";
import { ConnectionState } from "@/services/webSocketService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define types for market data
type StockData = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  sector?: string;
  market: 'global' | 'india';
  exchange?: 'us' | 'eu' | 'cn' | 'in';
  lastUpdated?: Date;
};

// Sample symbols for different exchanges
const EXCHANGE_SYMBOLS = {
  us: ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'WMT'],
  eu: ['BMW.XETRA', 'AIR.PARIS', 'NESN.SWISS', 'SAN.MC', 'VOD.L', 'BP.L', 'HSBA.L'],
  cn: ['BABA', 'TCEHY', 'JD', 'PDD', 'BIDU', 'NIO', 'LI', 'XPEV'],
  in: ['RELIANCE.BSE', 'TCS.BSE', 'HDFCBANK.BSE', 'INFY.BSE', 'ICICIBANK.BSE']
};

const StocksMarket = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const { market } = useMarket();
  const { 
    popularStocks, 
    topGainers, 
    topLosers, 
    isLoading, 
    refreshData,
    lastUpdated 
  } = useMarketData();
  
  // Get exchange from URL query params or default to 'us'
  const queryParams = new URLSearchParams(location.search);
  const exchangeParam = queryParams.get('exchange') as 'us' | 'eu' | 'cn' | 'in' | null;
  const [activeExchange, setActiveExchange] = useState<'us' | 'eu' | 'cn' | 'in'>(exchangeParam || 'us');
  const [realTimeEnabled, setRealTimeEnabled] = useState<boolean>(true);
  
  // Use real-time stock data for the active exchange
  const { 
    connectionState,
    stockData: realTimeStockData,
    error: wsError,
    connect,
    disconnect,
    isConnected
  } = useRealTimeStock(EXCHANGE_SYMBOLS[activeExchange] || [], {
    autoConnect: true,
    exchange: activeExchange,
    onConnectionChange: (state) => {
      console.log('WebSocket connection state changed:', state);
    },
    onError: (err) => {
      console.error('WebSocket error:', err);
    }
  });
  
  // Update URL when exchange changes
  useEffect(() => {
    const newParams = new URLSearchParams(location.search);
    newParams.set('type', 'stocks');
    newParams.set('exchange', activeExchange);
    navigate(`/markets?${newParams.toString()}`, { replace: true });
  }, [activeExchange, navigate, location.search]);
  
  // Toggle real-time updates
  const toggleRealTime = () => {
    if (realTimeEnabled) {
      disconnect();
    } else {
      connect();
    }
    setRealTimeEnabled(!realTimeEnabled);
  };

  // Convert stock data to our format, combining market data and real-time data
  const getStockData = (): StockData[] => {
    // If we're viewing real-time data from a specific exchange
    if (realTimeEnabled && Object.keys(realTimeStockData).length > 0) {
      return Object.entries(realTimeStockData).map(([symbol, data]) => {
        return {
          symbol,
          name: symbol, // We might not have the company name from real-time data
          price: data.price,
          change: data.change,
          changePercent: data.changePercent,
          volume: data.volume,
          sector: 'Other', // We don't have sector info from real-time data
          market: 'global' as 'global' | 'india', // Cast to the correct union type
          exchange: data.exchange as 'us' | 'eu' | 'cn' | 'in',
          lastUpdated: data.lastUpdated
        };
      }).filter(stock => !stock.exchange || stock.exchange === activeExchange);
    }
    
    // Otherwise, use the regular market data
    // Combine our data sources
    const stocks = [
      ...Object.values(popularStocks),
      ...Object.values(topGainers),
      ...Object.values(topLosers)
    ];
    
    // Remove duplicates and convert to our format
    const uniqueStocks = Array.from(
      new Map(stocks.map(stock => [stock.symbol, stock])).values()
    );
    
    return uniqueStocks.map(stock => {
      // Determine the market based on context rather than suffix
      // Indian stocks should not have .NS suffix in our application
      const stockMarket = market as 'global' | 'india'; // Cast to the correct union type
      
      return {
        symbol: stock.symbol, // Symbol should already be without suffix
        name: stock.name || stock.symbol,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
        volume: stock.volume,
        // Add optional chaining and provide default value for sector
        sector: (stock as any).sector || 'Other',
        market: stockMarket,
        exchange: activeExchange
      };
    }).filter(stock => stock.market === market);
  };

  // Filter stocks by search query and sector
  const filteredStocks = getStockData().filter(stock => {
    const matchesSearch = !searchQuery || 
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSector = !sectorFilter || stock.sector === sectorFilter;
    
    return matchesSearch && matchesSector;
  });

  // Get unique sectors for filter options
  const sectors = Array.from(
    new Set(getStockData().map(stock => stock.sector).filter(Boolean) as string[])
  );

  // Handle refresh button click
  const handleRefresh = async () => {
    await refreshData();
  };

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
    // Use the current market setting to determine currency symbol,
    // not based on .NS suffix which is no longer used
    const currencySymbol = market === "india" ? "₹" : "$";
    return `${currencySymbol}${value.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />
        <main className="container py-8 px-4 md:px-6">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-slate-500 dark:text-slate-400">Fetching live stock data...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="container py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Stock Markets</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {market === 'global' ? 'Global Stock Markets' : 'Indian Stock Markets'} - Live updates and insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                placeholder="Search stocks..."
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
        
        <div className="flex justify-between items-center mb-4">
          <Tabs defaultValue={activeExchange} onValueChange={(value) => setActiveExchange(value as 'us' | 'eu' | 'cn' | 'in')}>
            <TabsList>
              <TabsTrigger value="us">US Market</TabsTrigger>
              <TabsTrigger value="eu">European Market</TabsTrigger>
              <TabsTrigger value="cn">China Market</TabsTrigger>
              <TabsTrigger value="in">Indian Market</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <span className="mr-2 text-sm">Real-time:</span>
              <div 
                className={`w-3 h-3 rounded-full mr-1 ${isConnected && realTimeEnabled ? 'bg-green-500' : 'bg-gray-400'}`} 
                title={connectionState}
              ></div>
              <button 
                onClick={toggleRealTime} 
                className={`text-xs px-2 py-1 rounded flex items-center ${realTimeEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
              >
                {realTimeEnabled ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                {realTimeEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="text-xs text-gray-500">
              {connectionState === ConnectionState.CONNECTED ? 'Connected' : 
               connectionState === ConnectionState.CONNECTING ? 'Connecting...' :
               connectionState === ConnectionState.RECONNECTING ? 'Reconnecting...' :
               connectionState === ConnectionState.ERROR ? 'Connection Error' : 'Disconnected'}
            </div>
          </div>
        </div>
        
        {wsError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {wsError}
          </div>
        )}
        
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex items-center justify-end gap-2">
          <span>Last updated:</span>
          <time dateTime={lastUpdated?.toISOString()}>{formatTimestamp(lastUpdated)}</time>
        </div>
        
        {sectors.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-medium mb-2">Filter by sector:</div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={sectorFilter === null ? "default" : "outline"} 
                size="sm"
                onClick={() => setSectorFilter(null)}
              >
                All
              </Button>
              {sectors.map(sector => (
                <Button 
                  key={sector} 
                  variant={sectorFilter === sector ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setSectorFilter(sector || null)}
                >
                  {sector}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Stock Market Overview</CardTitle>
            <CardDescription>
              {filteredStocks.length} stocks available in {market === 'global' ? 'global' : 'Indian'} markets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-3">Symbol</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Sector</th>
                    <th className="text-right p-3">Price</th>
                    <th className="text-right p-3">Change</th>
                    <th className="text-right p-3">% Change</th>
                    <th className="text-right p-3">Volume</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((stock) => (
                <tr key={stock.symbol}>
                  <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="font-medium">{stock.symbol}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{stock.name}</div>
                    {stock.lastUpdated && (
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        Updated: {stock.lastUpdated.toLocaleTimeString()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-right">
                    {formatCurrency(stock.price, stock.symbol)}
                  </td>
                  <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-right">
                    <div className={`flex items-center justify-end ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                      {stock.change.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-right">
                    <div className={`${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.changePercent.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-right">
                    {stock.volume.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-right">
                    <Link 
                      to={`/company/${stock.symbol}`} 
                      className="text-fin-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default StocksMarket; 