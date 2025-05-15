import { useState } from "react";
import { TrendingUp, TrendingDown, Search, RefreshCw } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarket } from "@/hooks/use-market";
import { useMarketData } from "@/context/market-data-context";
import { Link } from "react-router-dom";

// Define types for market mover data
type MarketMover = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  sector?: string;
  market: 'global' | 'india';
  type: 'stock' | 'etf' | 'crypto' | 'index';
};

const MarketMovers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { market } = useMarket();
  const { 
    topGainers, 
    topLosers, 
    isLoading, 
    refreshData,
    lastUpdated 
  } = useMarketData();
  const [selectedTab, setSelectedTab] = useState<'all' | 'stocks' | 'etfs' | 'crypto'>('all');

  // Convert market data context to format expected by UI
  const getTopGainers = (): MarketMover[] => {
    if (Object.keys(topGainers).length === 0) {
      return mockMovers.filter(item => item.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 10);
    }
    
    return Object.values(topGainers).map(stock => ({
      symbol: stock.symbol,
      name: stock.name || stock.symbol,
      price: stock.price,
      change: stock.change,
      changePercent: stock.changePercent,
      volume: stock.volume,
      sector: stock.sector,
      market: stock.symbol.includes('.NS') ? 'india' : 'global',
      type: 'stock'
    })).filter(item => item.market === market);
  };

  const getTopLosers = (): MarketMover[] => {
    if (Object.keys(topLosers).length === 0) {
      return mockMovers.filter(item => item.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 10);
    }
    
    return Object.values(topLosers).map(stock => ({
      symbol: stock.symbol,
      name: stock.name || stock.symbol,
      price: stock.price,
      change: stock.change,
      changePercent: stock.changePercent,
      volume: stock.volume,
      sector: stock.sector,
      market: stock.symbol.includes('.NS') ? 'india' : 'global',
      type: 'stock'
    })).filter(item => item.market === market);
  };

  // Filter data by search query and type
  const filterBySearchAndType = (data: MarketMover[]) => {
    if (!searchQuery && selectedTab === 'all') return data;
    
    return data.filter(item => {
      const matchesSearch = !searchQuery || 
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedTab === 'all' || item.type === selectedTab;
      
      return matchesSearch && matchesType;
    });
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    await refreshData();
  };

  // Fallback mock data for when API fails or for categories we don't have live data for yet
  const mockMovers: MarketMover[] = [
    // Top Gainers
    {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      price: 950.62,
      change: 47.53,
      changePercent: 5.27,
      volume: 72345000,
      sector: "Technology",
      market: 'global',
      type: 'stock'
    },
    {
      symbol: "META",
      name: "Meta Platforms Inc",
      price: 496.78,
      change: 17.82,
      changePercent: 3.72,
      volume: 25678000,
      sector: "Communication Services",
      market: 'global',
      type: 'stock'
    },
    {
      symbol: "AVAX-USD",
      name: "Avalanche",
      price: 29.76,
      change: 0.87,
      changePercent: 3.01,
      volume: 432000000,
      market: 'global',
      type: 'crypto'
    },
    {
      symbol: "SOFI",
      name: "SoFi Technologies Inc",
      price: 7.82,
      change: 0.22,
      changePercent: 2.89,
      volume: 34568000,
      sector: "Financial Services",
      market: 'global',
      type: 'stock'
    },
    {
      symbol: "BTC-USD",
      name: "Bitcoin",
      price: 64356.19,
      change: 1508.22,
      changePercent: 2.40,
      volume: 32456000000,
      market: 'global',
      type: 'crypto'
    },
    {
      symbol: "KOTAKGOLD.NS",
      name: "Kotak Gold ETF",
      price: 673.75,
      change: 7.88,
      changePercent: 1.18,
      volume: 12000000,
      market: 'india',
      type: 'etf'
    },
    // Top Losers
    {
      symbol: "SHIB-USD",
      name: "Shiba Inu",
      price: 0.00001865,
      change: -0.00000052,
      changePercent: -2.71,
      volume: 543000000,
      market: 'global',
      type: 'crypto'
    },
    {
      symbol: "CRM",
      name: "Salesforce Inc",
      price: 247.35,
      change: -6.23,
      changePercent: -2.46,
      volume: 8456000,
      sector: "Technology",
      market: 'global',
      type: 'stock'
    },
    {
      symbol: "SOL-USD",
      name: "Solana",
      price: 132.74,
      change: -3.26,
      changePercent: -2.40,
      volume: 2345000000,
      market: 'global',
      type: 'crypto'
    },
    {
      symbol: "MARA",
      name: "Marathon Digital Holdings Inc",
      price: 18.97,
      change: -0.41,
      changePercent: -2.12,
      volume: 29876000,
      sector: "Technology",
      market: 'global',
      type: 'stock'
    },
    {
      symbol: "NKE",
      name: "Nike Inc",
      price: 79.25,
      change: -1.53,
      changePercent: -1.89,
      volume: 15642000,
      sector: "Consumer Cyclical",
      market: 'global',
      type: 'stock'
    },
    {
      symbol: "DOGE-USD",
      name: "Dogecoin",
      price: 0.1273,
      change: -0.0024,
      changePercent: -1.85,
      volume: 876000000,
      market: 'global',
      type: 'crypto'
    }
  ];

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

  const formatCurrency = (value: number, symbol: string, type: string) => {
    // Use standard formatting for stocks and ETFs
    if (type !== 'crypto') {
      const currencySymbol = market === "india" && symbol.includes('.NS') ? "₹" : "$";
      return `${currencySymbol}${value.toFixed(2)}`;
    }
    
    // Special formatting for cryptocurrencies
    if (value >= 1) {
      return `$${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    } else if (value >= 0.01) {
      return `$${value.toLocaleString('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
      })}`;
    } else {
      return `$${value.toLocaleString('en-US', {
        minimumFractionDigits: 8,
        maximumFractionDigits: 8
      })}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />
        <main className="container py-8 px-4 md:px-6">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-slate-500 dark:text-slate-400">Fetching market movers data...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Get filtered data
  const filteredGainers = filterBySearchAndType(getTopGainers());
  const filteredLosers = filterBySearchAndType(getTopLosers());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="container py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Market Movers</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {market === 'global' ? 'Global Market' : 'Indian Market'} - Biggest gainers and losers today
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                placeholder="Search movers..."
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
        
        <div className="mb-6">
          <div className="text-sm font-medium mb-2">Filter by asset type:</div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedTab === 'all' ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedTab('all')}
            >
              All Assets
            </Button>
            <Button 
              variant={selectedTab === 'stocks' ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedTab('stocks')}
            >
              Stocks
            </Button>
            <Button 
              variant={selectedTab === 'etfs' ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedTab('etfs')}
            >
              ETFs
            </Button>
            <Button 
              variant={selectedTab === 'crypto' ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedTab('crypto')}
            >
              Cryptocurrencies
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-fin-positive">
                <TrendingUp className="mr-2 h-5 w-5" />
                Top Gainers
              </CardTitle>
              <CardDescription>
                Assets with the largest percentage gains today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left p-3">Symbol</th>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-right p-3">Price</th>
                      <th className="text-right p-3">Change</th>
                      <th className="text-right p-3">% Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGainers.length > 0 ? (
                      filteredGainers.map((item) => (
                        <tr key={item.symbol} className="border-b border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-medium">
                            <Link 
                              to={`/${item.type === 'stock' ? 'stocks' : item.type === 'etf' ? 'etfs' : 'crypto'}/${item.symbol}`}
                              className="text-fin-primary hover:underline"
                            >
                              {item.symbol}
                            </Link>
                          </td>
                          <td className="p-3">{item.name}</td>
                          <td className="p-3 text-slate-500 capitalize">{item.type}</td>
                          <td className="p-3 text-right">{formatCurrency(item.price, item.symbol, item.type)}</td>
                          <td className="p-3 text-right text-fin-positive">
                            +{item.type === 'crypto' && item.price < 1 ? item.change.toFixed(8) : item.change.toFixed(2)}
                          </td>
                          <td className="p-3 text-right text-fin-positive font-medium">
                            <div className="flex items-center justify-end">
                              <TrendingUp className="mr-1 h-4 w-4" />
                              +{item.changePercent.toFixed(2)}%
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-500">
                          No matching gainers found. Try adjusting your search or filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-fin-negative">
                <TrendingDown className="mr-2 h-5 w-5" />
                Top Losers
              </CardTitle>
              <CardDescription>
                Assets with the largest percentage losses today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left p-3">Symbol</th>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-right p-3">Price</th>
                      <th className="text-right p-3">Change</th>
                      <th className="text-right p-3">% Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLosers.length > 0 ? (
                      filteredLosers.map((item) => (
                        <tr key={item.symbol} className="border-b border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-medium">
                            <Link 
                              to={`/${item.type === 'stock' ? 'stocks' : item.type === 'etf' ? 'etfs' : 'crypto'}/${item.symbol}`}
                              className="text-fin-primary hover:underline"
                            >
                              {item.symbol}
                            </Link>
                          </td>
                          <td className="p-3">{item.name}</td>
                          <td className="p-3 text-slate-500 capitalize">{item.type}</td>
                          <td className="p-3 text-right">{formatCurrency(item.price, item.symbol, item.type)}</td>
                          <td className="p-3 text-right text-fin-negative">
                            {item.type === 'crypto' && item.price < 1 ? item.change.toFixed(8) : item.change.toFixed(2)}
                          </td>
                          <td className="p-3 text-right text-fin-negative font-medium">
                            <div className="flex items-center justify-end">
                              <TrendingDown className="mr-1 h-4 w-4" />
                              {item.changePercent.toFixed(2)}%
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-500">
                          No matching losers found. Try adjusting your search or filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mb-8">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Data is refreshed throughout the trading day. Some data may be delayed by 15 minutes or more.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MarketMovers; 