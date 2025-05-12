import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarketData } from "@/context/market-data-context";
import { useMarket } from "@/hooks/use-market";
import { StockQuote } from "@/lib/api-service";

// Mock data for active options (as we don't have live data for these)
const mockActiveOptions = [
  { symbol: "AAPL", name: "Apple $200 Call", price: "3.47", volume: "128.5K" },
  { symbol: "SPY", name: "S&P 500 ETF $490 Put", price: "2.76", volume: "98.3K" },
  { symbol: "TSLA", name: "Tesla $180 Call", price: "4.32", volume: "87.6K" },
  { symbol: "QQQ", name: "Invesco QQQ $415 Put", price: "1.98", volume: "76.2K" },
];

export default function TopMovers() {
  const { topGainers, topLosers, popularStocks, isLoading } = useMarketData();
  const { market } = useMarket();
  
  // Format currency based on market and symbol
  const formatCurrency = (value: number, symbol: string) => {
    // Use consistent currency symbols based on market type
    const currencySymbol = market === "india" && symbol && symbol.includes('.NS') ? "₹" : "$";
    
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
  
  // If we don't have gainers/losers data for India market, create some from popular stocks
  const getTopStocks = (isGainer: boolean): StockQuote[] => {
    if (market === 'global' && (isGainer ? topGainers : topLosers).length > 0) {
      return isGainer ? topGainers : topLosers;
    }
    
    // For India market or if we don't have data, use popular stocks
    const stocksArray = Object.values(popularStocks);
    
    // Filter by market
    const filteredStocks = stocksArray.filter(stock => 
      stock.symbol && stock.symbol.includes('.NS') ? market === 'india' : market === 'global'
    );
    
    // Sort by percent change (ascending or descending)
    return [...filteredStocks].sort((a, b) => 
      isGainer 
        ? b.changePercent - a.changePercent // Descending for gainers
        : a.changePercent - b.changePercent // Ascending for losers
    ).slice(0, 4);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Top Movers</CardTitle>
      </CardHeader>
      
      <Tabs defaultValue="gainers">
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="gainers" className="w-1/3">Gainers</TabsTrigger>
            <TabsTrigger value="losers" className="w-1/3">Losers</TabsTrigger>
            <TabsTrigger value="active" className="w-1/3">Active Options</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-4">
          <TabsContent value="gainers">
            <div className="space-y-3">
              {isLoading ? (
                // Loading skeleton
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-2">
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                    </div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                  </div>
                ))
              ) : (
                getTopStocks(true).map((stock) => (
                  <Link 
                    key={stock.symbol}
                    to={`/company/${stock.symbol}`} 
                    className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-semibold text-fin-primary dark:text-white">{stock.symbol}</span>
                        <span className="text-xs text-slate-600 dark:text-slate-400 ml-2 hidden md:inline">{stock.name || stock.symbol}</span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{formatCurrency(stock.price, stock.symbol)}</div>
                    </div>
                    <div className="flex items-center text-green-600 dark:text-green-500">
                      <TrendingUp size={16} className="mr-1" />
                      <div className="text-right">
                        <div className="font-medium">{stock.changePercent.toFixed(2)}%</div>
                        <div className="text-xs">{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}</div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
              <div className="pt-2">
                <Link 
                  to="/markets" 
                  className="text-sm text-fin-teal hover:underline font-medium inline-block dark:text-cyan-400"
                >
                  View all top gainers →
                </Link>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="losers">
            <div className="space-y-3">
              {isLoading ? (
                // Loading skeleton
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-2">
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                    </div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                  </div>
                ))
              ) : (
                getTopStocks(false).map((stock) => (
                  <Link 
                    key={stock.symbol}
                    to={`/company/${stock.symbol}`} 
                    className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-semibold text-fin-primary dark:text-white">{stock.symbol}</span>
                        <span className="text-xs text-slate-600 dark:text-slate-400 ml-2 hidden md:inline">{stock.name || stock.symbol}</span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{formatCurrency(stock.price, stock.symbol)}</div>
                    </div>
                    <div className="flex items-center text-red-600 dark:text-red-500">
                      <TrendingDown size={16} className="mr-1" />
                      <div className="text-right">
                        <div className="font-medium">{stock.changePercent.toFixed(2)}%</div>
                        <div className="text-xs">{stock.change.toFixed(2)}</div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
              <div className="pt-2">
                <Link 
                  to="/markets" 
                  className="text-sm text-fin-teal hover:underline font-medium inline-block dark:text-cyan-400"
                >
                  View all top losers →
                </Link>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="active">
            <div className="space-y-3">
              {mockActiveOptions.map((option) => (
                <Link 
                  key={option.symbol}
                  to={`/markets/options/${option.symbol}`} 
                  className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-semibold text-fin-primary dark:text-white">{option.symbol}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400 ml-2 hidden md:inline">{option.name}</span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">${option.price}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-slate-700 dark:text-slate-300">Vol: {option.volume}</div>
                  </div>
                </Link>
              ))}
              <div className="pt-2">
                <Link 
                  to="/markets/options/most-active" 
                  className="text-sm text-fin-teal hover:underline font-medium inline-block dark:text-cyan-400"
                >
                  View all active options →
                </Link>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
