import { useState } from "react";
import { TrendingUp, TrendingDown, Search, RefreshCw } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

// Define types for crypto data
type CryptoData = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  volume: number;
  category: string;
};

// Mock cryptocurrency data - would be replaced by actual API data in a real implementation
const mockCryptos: CryptoData[] = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    price: 64356.19,
    change: 1508.22,
    changePercent: 2.40,
    marketCap: 1260000000000,
    volume: 32456000000,
    category: "Layer 1"
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    price: 3089.48,
    change: 43.38,
    changePercent: 1.42,
    marketCap: 371000000000,
    volume: 15678000000,
    category: "Layer 1"
  },
  {
    id: "binancecoin",
    symbol: "BNB",
    name: "BNB",
    price: 574.26,
    change: 7.64,
    changePercent: 1.35,
    marketCap: 88000000000,
    volume: 1234000000,
    category: "Exchange Token"
  },
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    price: 132.74,
    change: -3.26,
    changePercent: -2.40,
    marketCap: 57000000000,
    volume: 2345000000,
    category: "Layer 1"
  },
  {
    id: "ripple",
    symbol: "XRP",
    name: "XRP",
    price: 0.5337,
    change: -0.0054,
    changePercent: -1.00,
    marketCap: 29000000000,
    volume: 1456000000,
    category: "Payment"
  },
  {
    id: "cardano",
    symbol: "ADA",
    name: "Cardano",
    price: 0.4596,
    change: 0.0082,
    changePercent: 1.82,
    marketCap: 16000000000,
    volume: 456000000,
    category: "Layer 1"
  },
  {
    id: "dogecoin",
    symbol: "DOGE",
    name: "Dogecoin",
    price: 0.1273,
    change: -0.0024,
    changePercent: -1.85,
    marketCap: 18000000000,
    volume: 876000000,
    category: "Meme Coin"
  },
  {
    id: "polkadot",
    symbol: "DOT",
    name: "Polkadot",
    price: 6.53,
    change: 0.12,
    changePercent: 1.87,
    marketCap: 8600000000,
    volume: 345000000,
    category: "Layer 0"
  },
  {
    id: "chainlink",
    symbol: "LINK",
    name: "Chainlink",
    price: 13.89,
    change: 0.32,
    changePercent: 2.36,
    marketCap: 8100000000,
    volume: 567000000,
    category: "Oracle"
  },
  {
    id: "tron",
    symbol: "TRX",
    name: "TRON",
    price: 0.1235,
    change: 0.0011,
    changePercent: 0.90,
    marketCap: 11000000000,
    volume: 654000000,
    category: "Layer 1"
  },
  {
    id: "avalanche",
    symbol: "AVAX",
    name: "Avalanche",
    price: 29.76,
    change: 0.87,
    changePercent: 3.01,
    marketCap: 10800000000,
    volume: 432000000,
    category: "Layer 1"
  },
  {
    id: "shiba-inu",
    symbol: "SHIB",
    name: "Shiba Inu",
    price: 0.00001865,
    change: -0.00000052,
    changePercent: -2.71,
    marketCap: 11000000000,
    volume: 543000000,
    category: "Meme Coin"
  }
];

const CryptoMarket = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Filter cryptos by search query and category
  const filteredCryptos = mockCryptos.filter(crypto => {
    const matchesSearch = !searchQuery || 
      crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crypto.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !categoryFilter || crypto.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter options
  const categories = Array.from(
    new Set(mockCryptos.map(crypto => crypto.category))
  );

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call with timeout
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 1000);
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

  const formatValue = (value: number): string => {
    if (value >= 1) {
      return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } else if (value >= 0.01) {
      return value.toLocaleString('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
      });
    } else {
      return value.toLocaleString('en-US', {
        minimumFractionDigits: 8,
        maximumFractionDigits: 8
      });
    }
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(2)}T`;
    } else if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(2)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(2)}M`;
    } else {
      return `$${marketCap.toLocaleString()}`;
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
              <p className="text-slate-500 dark:text-slate-400">Fetching cryptocurrency data...</p>
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Cryptocurrency Markets</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Real-time prices and trading volume for major cryptocurrencies
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                placeholder="Search cryptocurrencies..."
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
        
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-medium mb-2">Filter by category:</div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={categoryFilter === null ? "default" : "outline"} 
                size="sm"
                onClick={() => setCategoryFilter(null)}
              >
                All
              </Button>
              {categories.map(category => (
                <Button 
                  key={category} 
                  variant={categoryFilter === category ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setCategoryFilter(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Cryptocurrency Market Overview</CardTitle>
            <CardDescription>
              {filteredCryptos.length} cryptocurrencies tracked in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Symbol</th>
                    <th className="text-left p-3">Category</th>
                    <th className="text-right p-3">Price (USD)</th>
                    <th className="text-right p-3">24h Change</th>
                    <th className="text-right p-3">24h % Change</th>
                    <th className="text-right p-3">Market Cap</th>
                    <th className="text-right p-3">24h Volume</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCryptos.map((crypto) => (
                    <tr key={crypto.id} className="border-b border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-medium">{crypto.name}</td>
                      <td className="p-3">{crypto.symbol}</td>
                      <td className="p-3 text-slate-500">{crypto.category}</td>
                      <td className="p-3 text-right">${formatValue(crypto.price)}</td>
                      <td className={`p-3 text-right ${crypto.change >= 0 ? "text-fin-positive" : "text-fin-negative"}`}>
                        {crypto.change >= 0 ? "+" : ""}${formatValue(Math.abs(crypto.change))}
                      </td>
                      <td className={`p-3 text-right font-medium ${crypto.changePercent >= 0 ? "text-fin-positive" : "text-fin-negative"}`}>
                        <div className="flex items-center justify-end">
                          {crypto.changePercent >= 0 ? (
                            <TrendingUp className="mr-1 h-4 w-4" />
                          ) : (
                            <TrendingDown className="mr-1 h-4 w-4" />
                          )}
                          {crypto.changePercent >= 0 ? "+" : ""}
                          {crypto.changePercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        {formatMarketCap(crypto.marketCap)}
                      </td>
                      <td className="p-3 text-right">
                        ${(crypto.volume / 1000000).toFixed(1)}M
                      </td>
                      <td className="p-3 text-right">
                        <Link 
                          to={`/crypto/${crypto.id}`}
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
        
        <div className="text-center mb-8">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Data shown is for demonstration purposes only. Real-time data would come from cryptocurrency APIs.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CryptoMarket; 