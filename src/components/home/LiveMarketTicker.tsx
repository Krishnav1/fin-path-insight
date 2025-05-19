import { useMarketData } from "@/context/market-data-context";
import { useMarket } from "@/hooks/use-market";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function LiveMarketTicker() {
  const { popularStocks, indices, isLoading } = useMarketData();
  const { market } = useMarket();
  const [scrollPosition, setScrollPosition] = useState(0);

  // Combine indices and popular stocks into one ticker array
  const tickerItems = [
    ...Object.values(indices).filter(index => index.symbol && index.symbol.includes('.NS') ? market === 'india' : market === 'global'),
    ...Object.values(popularStocks).filter(stock => stock.symbol && stock.symbol.includes('.NS') ? market === 'india' : market === 'global')
  ];

  // Auto scroll ticker
  useEffect(() => {
    if (tickerItems.length === 0 || isLoading) return;
    
    const tickerInterval = setInterval(() => {
      setScrollPosition(prev => {
        // Reset to beginning when we've scrolled through all items
        if (prev >= tickerItems.length) {
          return 0;
        }
        return prev + 0.5; // Smooth scrolling
      });
    }, 2000); // Speed of ticker movement
    
    return () => clearInterval(tickerInterval);
  }, [tickerItems.length, isLoading]);

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

  const isStock = (symbol: string) => {
    return !symbol.includes('^') && !symbol.includes('BEE');
  };

  if (isLoading || tickerItems.length === 0) {
    return (
      <div className="w-full bg-fin-primary text-white dark:bg-slate-800 py-2 overflow-hidden">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <div className="flex-shrink-0 flex items-center space-x-2">
            <div>
              <span className="font-medium">Live Markets</span>
              <span className="text-xs opacity-80 ml-2">via EODHD</span>
            </div>
            {isLoading && <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin" />}
          </div>  
          <span className="text-sm">Loading market data...</span>
          <span className="text-xs opacity-80 ml-2">via EODHD</span>
        </div>
      </div>
    );
  }

  const currentIndex = Math.floor(scrollPosition) % tickerItems.length;
  const nextIndex = (currentIndex + 1) % tickerItems.length;
  const percentComplete = scrollPosition % 1;

  // Calculate current item position for smooth animation
  const translateX = -percentComplete * 100;

  return (
    <div className="w-full py-2 bg-fin-primary text-white overflow-hidden">
      <div className="container relative">
        <div 
          className="flex transition-transform duration-1000 ease-linear"
          style={{ transform: `translateX(${translateX}%)` }}
        >
          <div className="flex-shrink-0 w-full flex items-center justify-center">
            {tickerItems[currentIndex] && (
              <MarketTickerItem 
                symbol={tickerItems[currentIndex].symbol}
                price={tickerItems[currentIndex].price}
                change={tickerItems[currentIndex].change}
                changePercent={tickerItems[currentIndex].changePercent}
                formatPrice={formatCurrency}
              />
            )}
          </div>
          
          <div className="flex-shrink-0 w-full flex items-center justify-center">
            {tickerItems[nextIndex] && (
              <MarketTickerItem 
                symbol={tickerItems[nextIndex].symbol}
                price={tickerItems[nextIndex].price}
                change={tickerItems[nextIndex].change}
                changePercent={tickerItems[nextIndex].changePercent}
                formatPrice={formatCurrency}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type MarketTickerItemProps = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  formatPrice: (price: number, symbol: string) => string;
};

function MarketTickerItem({ symbol, price, change, changePercent, formatPrice }: MarketTickerItemProps) {
  const isStockSymbol = symbol && !symbol.includes('^') && !symbol.includes('BEE');
  
  return (
    <div className="flex items-center space-x-4 px-4">
      <span className="font-medium">{symbol || 'Unknown'}</span>
      <span>{formatPrice(price, symbol || '')}</span>
      <div 
        className={`flex items-center space-x-1 ${
          change >= 0 ? "text-green-500" : "text-red-500"
        }`}
      >
        <span>{change >= 0 ? "+" : ""}{change.toFixed(2)}</span>
        <span>({change >= 0 ? "+" : ""}{changePercent.toFixed(2)}%)</span>
        {change >= 0 ? 
          <ArrowUpRight className="h-3 w-3" /> : 
          <ArrowDownRight className="h-3 w-3" />
        }
      </div>
      {isStockSymbol && (
        <Link 
          to={`/company/${symbol}`} 
          className="text-xs text-white/70 hover:text-white underline ml-2"
        >
          View
        </Link>
      )}
    </div>
  );
}