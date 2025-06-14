import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IndianMarketContext } from './IndianMarketController';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '@/services/userPreferencesService';

const TopStocks: React.FC = () => {
  const router = useRouter();
  const { marketData, refreshData } = useContext(IndianMarketContext);
  const { stocks, isLoading } = marketData;

  const handleStockClick = (symbol: string) => {
    router.push(`/company/${symbol}.NSE`);
  };

  const toggleWatchlist = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the row click from firing
    
    const fullSymbol = `${symbol}.NSE`;
    
    if (isInWatchlist(fullSymbol)) {
      removeFromWatchlist(fullSymbol);
    } else {
      addToWatchlist(fullSymbol, stocks[symbol]?.name || symbol);
    }
    
    // Refresh data to update the UI
    refreshData();
  };

  const renderStockRows = () => {
    if (isLoading && Object.keys(stocks).length === 0) {
      return (
        <tr>
          <td colSpan={5} className="p-4 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2">Loading stocks...</span>
            </div>
          </td>
        </tr>
      );
    }

    if (Object.keys(stocks).length === 0) {
      return (
        <tr>
          <td colSpan={5} className="p-4 text-center text-slate-500">
            No stock data available
          </td>
        </tr>
      );
    }

    return Object.values(stocks)
      .sort((a, b) => b.marketCap - a.marketCap)
      .map((stock) => (
        <tr 
          key={stock.symbol}
          onClick={() => handleStockClick(stock.symbol)}
          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
        >
          <td className="p-2 pl-4 whitespace-nowrap">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 mr-2"
                onClick={(e) => toggleWatchlist(stock.symbol, e)}
              >
                <Star 
                  className={`h-4 w-4 ${isInWatchlist(`${stock.symbol}.NSE`) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'}`}
                />
              </Button>
              <div>
                <div className="font-medium">{stock.symbol}</div>
                <div className="text-xs text-slate-500">{stock.name}</div>
              </div>
            </div>
          </td>
          <td className="p-2 whitespace-nowrap font-medium">
            ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </td>
          <td className="p-2 whitespace-nowrap">
            <div className={`flex items-center ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stock.change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              <span className="font-medium">
                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
              </span>
            </div>
          </td>
          <td className="p-2 pr-4 text-right whitespace-nowrap text-slate-500">
            <div className="font-medium">
              {(stock.marketCap / 1000).toFixed(2)}K Cr
            </div>
            <div className="text-xs">
              {stock.sector}
            </div>
          </td>
        </tr>
      ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Indian Stocks</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-auto max-h-[500px]">
        <table className="w-full border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
            <tr>
              <th className="p-2 pl-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Stock</th>
              <th className="p-2 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Price</th>
              <th className="p-2 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Change</th>
              <th className="p-2 pr-4 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">Market Cap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {renderStockRows()}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default TopStocks;
