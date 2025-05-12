import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMarket } from "@/hooks/use-market";
import { useMarketData } from "@/context/market-data-context";

export default function MarketOverview() {
  const { market } = useMarket();
  const { indices, isLoading, refreshData, lastUpdated } = useMarketData();
  
  // Filter indices by market
  const filteredIndices = indices.filter(index => 
    index.symbol && index.symbol.includes('.NS') ? market === 'india' : market === 'global'
  );

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

  // Format market data for display
  const formatMarketData = (index: any) => {
    const formattedValue = formatCurrency(index.price, index.symbol);
    
    const changePercent = `${index.changePercent >= 0 ? '+' : ''}${index.changePercent.toFixed(2)}%`;
    const change = `${index.change >= 0 ? '+' : ''}${index.change.toFixed(2)}`;
    
    return {
      id: index.symbol,
      name: index.name,
      value: formattedValue,
      change: change,
      changePercent: changePercent,
      isPositive: index.change >= 0
    };
  };

  // Handle refresh click
  const handleRefresh = async () => {
    await refreshData();
  };

  // Format timestamp
  const formatLastUpdated = (timestamp: Date | null) => {
    if (!timestamp) return '';
    
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(timestamp);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-fin-primary dark:text-white">
          {market === "global" ? "Global Market Overview" : "Indian Market Overview"}
        </h2>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Updated: {formatLastUpdated(lastUpdated)}
            </span>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Link to="/markets" className="text-sm font-medium text-fin-teal hover:underline">
            View All Markets
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          // Loading skeleton
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden dark:border-slate-700">
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2 w-24"></div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2"></div>
                  <div className="flex justify-end">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredIndices.length > 0 ? (
          // Display real data
          filteredIndices.slice(0, 4).map((index) => {
            const formattedIndex = formatMarketData(index);
            return (
              <Card key={index.symbol} className="overflow-hidden dark:border-slate-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <Link 
                        to={`/markets/${index.symbol}`} 
                        className="font-semibold text-fin-primary hover:text-fin-secondary dark:text-white dark:hover:text-slate-300"
                      >
                        {index.name}
                      </Link>
                      <div className="text-lg font-bold mt-1 dark:text-white">
                        {formattedIndex.value}
                      </div>
                    </div>
                    <div className={`flex flex-col items-end ${formattedIndex.isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                      <div className="flex items-center">
                        {formattedIndex.isPositive ? (
                          <TrendingUp size={18} className="mr-1" />
                        ) : (
                          <TrendingDown size={18} className="mr-1" />
                        )}
                        <span className="font-medium">{formattedIndex.changePercent}</span>
                      </div>
                      <span className="text-sm">{formattedIndex.change}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          // Fallback message when no data is available
          <div className="col-span-4 text-center p-8 border rounded-lg dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">
              No market data available for {market === "global" ? "global" : "Indian"} markets.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              className="mt-4"
            >
              Refresh Data
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
