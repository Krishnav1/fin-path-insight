import { useState } from "react";
import { TrendingUp, TrendingDown, Search, RefreshCw } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarket } from "@/hooks/use-market";
import { Link } from "react-router-dom";

// Define types for ETF data
type ETFData = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  aum: number; // Assets under management
  expense: number; // Expense ratio
  category: string;
  market: 'global' | 'india';
};

// Mock ETF data - would be replaced by actual data in a real implementation
const mockETFs: ETFData[] = [
  // Global ETFs
  {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    price: 488.65,
    change: 3.21,
    changePercent: 0.66,
    aum: 430000000000,
    expense: 0.09,
    category: "Large Cap Blend",
    market: 'global'
  },
  {
    symbol: "QQQ",
    name: "Invesco QQQ Trust",
    price: 422.37,
    change: 5.43,
    changePercent: 1.30,
    aum: 218000000000,
    expense: 0.20,
    category: "Large Cap Growth",
    market: 'global'
  },
  {
    symbol: "VTI",
    name: "Vanguard Total Stock Market ETF",
    price: 253.84,
    change: 1.65,
    changePercent: 0.65,
    aum: 350000000000,
    expense: 0.03,
    category: "Total Market",
    market: 'global'
  },
  {
    symbol: "VOO",
    name: "Vanguard S&P 500 ETF",
    price: 448.28,
    change: 2.95,
    changePercent: 0.66,
    aum: 330000000000,
    expense: 0.03,
    category: "Large Cap Blend",
    market: 'global'
  },
  {
    symbol: "IEFA",
    name: "iShares Core MSCI EAFE ETF",
    price: 72.10,
    change: -0.42,
    changePercent: -0.58,
    aum: 110000000000,
    expense: 0.07,
    category: "Foreign Large Cap Blend",
    market: 'global'
  },
  {
    symbol: "AGG",
    name: "iShares Core U.S. Aggregate Bond ETF",
    price: 98.58,
    change: 0.16,
    changePercent: 0.16,
    aum: 94000000000,
    expense: 0.03,
    category: "Intermediate Core Bond",
    market: 'global'
  },
  {
    symbol: "VEA",
    name: "Vanguard FTSE Developed Markets ETF",
    price: 48.98,
    change: -0.27,
    changePercent: -0.55,
    aum: 143000000000,
    expense: 0.05,
    category: "Foreign Large Cap Blend",
    market: 'global'
  },
  // Indian ETFs
  {
    symbol: "NIFTYBEES.NS",
    name: "Nippon India ETF Nifty BeES",
    price: 256.85,
    change: 1.75,
    changePercent: 0.69,
    aum: 46000000000,
    expense: 0.05,
    category: "Large Cap",
    market: 'india'
  },
  {
    symbol: "BANKBEES.NS",
    name: "Nippon India ETF Bank BeES",
    price: 434.65,
    change: 3.85,
    changePercent: 0.89,
    aum: 25000000000,
    expense: 0.10,
    category: "Banking",
    market: 'india'
  },
  {
    symbol: "KOTAKGOLD.NS",
    name: "Kotak Gold ETF",
    price: 673.75,
    change: 7.88,
    changePercent: 1.18,
    aum: 12000000000,
    expense: 0.59,
    category: "Commodity",
    market: 'india'
  },
  {
    symbol: "LIQUIDBEES.NS",
    name: "Nippon India ETF Liquid BeES",
    price: 1000.06,
    change: 0.01,
    changePercent: 0.001,
    aum: 18000000000,
    expense: 0.07,
    category: "Liquid",
    market: 'india'
  }
];

const ETFsMarket = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const { market } = useMarket();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Filter ETFs by market, search query and category
  const filteredETFs = mockETFs.filter(etf => {
    const matchesMarket = etf.market === market;
    const matchesSearch = !searchQuery || 
      etf.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      etf.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !categoryFilter || etf.category === categoryFilter;
    
    return matchesMarket && matchesSearch && matchesCategory;
  });

  // Get unique categories for filter options
  const categories = Array.from(
    new Set(mockETFs.filter(etf => etf.market === market).map(etf => etf.category))
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

  const formatCurrency = (value: number, symbol: string) => {
    const currencySymbol = market === "india" && symbol.includes('.NS') ? "₹" : "$";
    return `${currencySymbol}${value.toFixed(2)}`;
  };

  const formatAUM = (aum: number) => {
    if (aum >= 1000000000000) {
      return `$${(aum / 1000000000000).toFixed(2)}T`;
    } else if (aum >= 1000000000) {
      return `$${(aum / 1000000000).toFixed(2)}B`;
    } else if (aum >= 1000000) {
      return `$${(aum / 1000000).toFixed(2)}M`;
    } else {
      return `$${aum.toLocaleString()}`;
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
              <p className="text-slate-500 dark:text-slate-400">Fetching ETF data...</p>
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">ETFs</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {market === 'global' ? 'Global Exchange Traded Funds' : 'Indian Exchange Traded Funds'} - Track the market with ETFs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                placeholder="Search ETFs..."
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
            <CardTitle>ETF Market Overview</CardTitle>
            <CardDescription>
              {filteredETFs.length} ETFs available in {market === 'global' ? 'global' : 'Indian'} markets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-3">Symbol</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Category</th>
                    <th className="text-right p-3">Price</th>
                    <th className="text-right p-3">Change</th>
                    <th className="text-right p-3">% Change</th>
                    <th className="text-right p-3">AUM</th>
                    <th className="text-right p-3">Expense Ratio</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredETFs.map((etf) => (
                    <tr key={etf.symbol} className="border-b border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-medium">{etf.symbol}</td>
                      <td className="p-3">{etf.name}</td>
                      <td className="p-3 text-slate-500">{etf.category}</td>
                      <td className="p-3 text-right">{formatCurrency(etf.price, etf.symbol)}</td>
                      <td className={`p-3 text-right ${etf.change >= 0 ? "text-fin-positive" : "text-fin-negative"}`}>
                        {etf.change >= 0 ? "+" : ""}{etf.change.toFixed(2)}
                      </td>
                      <td className={`p-3 text-right font-medium ${etf.changePercent >= 0 ? "text-fin-positive" : "text-fin-negative"}`}>
                        <div className="flex items-center justify-end">
                          {etf.changePercent >= 0 ? (
                            <TrendingUp className="mr-1 h-4 w-4" />
                          ) : (
                            <TrendingDown className="mr-1 h-4 w-4" />
                          )}
                          {etf.changePercent >= 0 ? "+" : ""}
                          {etf.changePercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        {formatAUM(etf.aum)}
                      </td>
                      <td className="p-3 text-right">
                        {etf.expense.toFixed(2)}%
                      </td>
                      <td className="p-3 text-right">
                        <Link 
                          to={`/etfs/${etf.symbol}`}
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

export default ETFsMarket; 