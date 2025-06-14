import React, { useContext } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianMarketContext } from './IndianMarketController';

const MarketOverview: React.FC = () => {
  const { marketData } = useContext(IndianMarketContext);
  const { overview, isLoading } = marketData;

  if (isLoading && !overview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
          <CardDescription>Loading market data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!overview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
          <CardDescription>Key metrics for the Indian stock market</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-slate-500">
            Market data not available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Overview</CardTitle>
        <CardDescription>Key metrics for the Indian stock market</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* NIFTY 50 Snapshot */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-50">NIFTY 50</h3>
            <div className="text-2xl font-bold mb-1">
              {overview.nifty50.price.toLocaleString('en-IN')}
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${overview.nifty50.change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
              {overview.nifty50.change >= 0 ? '+' : ''}{overview.nifty50.change.toFixed(2)} 
              ({overview.nifty50.changePercent.toFixed(2)}%)
              {overview.nifty50.change >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Status: {overview.nifty50.status || 'Unknown'}
            </div>
          </div>

          {/* Market Capitalization */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-50">Market Capitalization</h3>
            <div className="text-xl font-bold mb-1">
              {overview.marketCap.totalInCrores} Lakh Cr
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              ({overview.marketCap.totalInUSD} Trillion USD)
            </div>
          </div>
        </div>

        {/* Market Segments */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {overview.marketSegments.map((segment, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-slate-50">{segment.name}</h3>
              <div className="mt-2">
                <span className="text-sm font-medium">Status: </span>
                <span className={`text-sm font-medium ${
                  segment.status?.toLowerCase() === 'open' 
                    ? 'text-green-600 dark:text-green-500' 
                    : 'text-red-600 dark:text-red-500'
                }`}>
                  {segment.status}
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {segment.message}
              </div>
              {segment.index && (
                <div className="mt-2 text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Index: </span>
                  <span className="font-medium">{segment.index}</span>
                  {segment.value && (
                    <span> - {segment.value.toLocaleString('en-IN')}</span>
                  )}
                  {segment.change !== undefined && (
                    <span className={segment.change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                      {' '}({segment.change.toFixed(2)}%)
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketOverview;
