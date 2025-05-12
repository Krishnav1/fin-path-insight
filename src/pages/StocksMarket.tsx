import { useState } from "react";
import { TrendingUp, TrendingDown, Search, RefreshCw } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarket } from "@/hooks/use-market";
import { useMarketData } from "@/context/market-data-context";
import { Link } from "react-router-dom";

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
};

const StocksMarket = () => {
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

  // Convert stock data to our format
  const getStockData = (): StockData[] => {
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
    
    return uniqueStocks.map(stock => ({
      symbol: stock.symbol,
      name: stock.name || stock.symbol,
      price: stock.price,
      change: stock.change,
      changePercent: stock.changePercent,
      volume: stock.volume,
      sector: stock.sector,
      market: stock.symbol.includes('.NS') ? 'india' : 'global'
    })).filter(stock => stock.market === market);
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
    new Set(getStockData().map(stock => stock.sector).filter(Boolean))
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
    const currencySymbol = market === "india" && symbol.includes('.NS') ? "₹" : "$";
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
                  onClick={() => setSectorFilter(sector)}
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
                    <tr key={stock.symbol} className="border-b border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-medium">{stock.symbol}</td>
                      <td className="p-3">{stock.name}</td>
                      <td className="p-3 text-slate-500">{stock.sector || "—"}</td>
                      <td className="p-3 text-right">{formatCurrency(stock.price, stock.symbol)}</td>
                      <td className={`p-3 text-right ${stock.change >= 0 ? "text-fin-positive" : "text-fin-negative"}`}>
                        {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}
                      </td>
                      <td className={`p-3 text-right font-medium ${stock.changePercent >= 0 ? "text-fin-positive" : "text-fin-negative"}`}>
                        <div className="flex items-center justify-end">
                          {stock.changePercent >= 0 ? (
                            <TrendingUp className="mr-1 h-4 w-4" />
                          ) : (
                            <TrendingDown className="mr-1 h-4 w-4" />
                          )}
                          {stock.changePercent >= 0 ? "+" : ""}
                          {stock.changePercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        {stock.volume.toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <Link 
                          to={`/stocks/${stock.symbol}`}
                          className="px-3 py-1 bg-fin-primary text-white text-sm rounded hover:bg-fin-primary-dark"
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