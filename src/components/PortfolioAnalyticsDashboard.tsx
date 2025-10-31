/**
 * Portfolio Analytics Dashboard Component
 * Displays comprehensive portfolio analytics with real-time updates
 */

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  AlertTriangle,
  Activity,
  Target,
  Award
} from 'lucide-react';
import { portfolioAnalyticsService, PortfolioAnalytics, HoldingData } from '@/services/portfolioAnalyticsService';
import { realtimePriceService, PriceUpdate } from '@/services/realtimePriceService';

interface PortfolioAnalyticsDashboardProps {
  holdings: HoldingData[];
  portfolioId?: string;
}

export const PortfolioAnalyticsDashboard: React.FC<PortfolioAnalyticsDashboardProps> = ({ 
  holdings, 
  portfolioId 
}) => {
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [marketStatus, setMarketStatus] = useState<{ isOpen: boolean; nextOpen?: string; nextClose?: string }>();
  const [liveUpdates, setLiveUpdates] = useState<Map<string, PriceUpdate>>(new Map());

  // Calculate analytics when holdings change
  useEffect(() => {
    if (holdings.length > 0) {
      const calculatedAnalytics = portfolioAnalyticsService.calculateAnalytics(holdings);
      setAnalytics(calculatedAnalytics);
      
      const generatedInsights = portfolioAnalyticsService.generateInsights(calculatedAnalytics);
      setInsights(generatedInsights);

      // Save to Supabase
      portfolioAnalyticsService.saveAnalytics(calculatedAnalytics, portfolioId);
    }
  }, [holdings, portfolioId]);

  // Subscribe to real-time price updates
  useEffect(() => {
    if (holdings.length === 0) return;

    const symbols = holdings.map(h => h.symbol);
    
    realtimePriceService.subscribe('portfolio-dashboard', {
      symbols,
      onUpdate: (updates) => {
        setLiveUpdates(updates);
        
        // Recalculate analytics with live prices
        const updatedHoldings = holdings.map(holding => {
          const livePrice = updates.get(holding.symbol);
          return {
            ...holding,
            currentPrice: livePrice?.price || holding.currentPrice
          };
        });
        
        const updatedAnalytics = portfolioAnalyticsService.calculateAnalytics(updatedHoldings);
        setAnalytics(updatedAnalytics);
      },
      onError: (error) => {
        console.error('Price update error:', error);
      }
    });

    // Get market status
    const status = realtimePriceService.getMarketStatus();
    setMarketStatus(status);

    return () => {
      realtimePriceService.unsubscribe('portfolio-dashboard');
    };
  }, [holdings]);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fin-teal"></div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Market Status Banner */}
      {marketStatus && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          marketStatus.isOpen 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
        }`}>
          <Activity size={18} className={marketStatus.isOpen ? 'text-green-600' : 'text-slate-600'} />
          <span className="text-sm font-medium">
            {marketStatus.isOpen ? (
              <>Market Open - Live updates enabled (Closes at {marketStatus.nextClose})</>
            ) : (
              <>Market Closed - {marketStatus.nextOpen}</>
            )}
          </span>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Total Value</span>
            <DollarSign size={18} className="text-fin-teal" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(analytics.total_value)}
          </div>
          {analytics.day_change !== undefined && (
            <div className={`text-sm mt-1 flex items-center gap-1 ${
              analytics.day_change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {analytics.day_change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {formatCurrency(Math.abs(analytics.day_change))} today
            </div>
          )}
        </div>

        {/* Total Profit/Loss */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Total P&L</span>
            {analytics.total_profit >= 0 ? (
              <TrendingUp size={18} className="text-green-600" />
            ) : (
              <TrendingDown size={18} className="text-red-600" />
            )}
          </div>
          <div className={`text-2xl font-bold ${
            analytics.total_profit >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(analytics.total_profit)}
          </div>
          <div className={`text-sm mt-1 ${
            analytics.profit_percentage >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatPercentage(analytics.profit_percentage)}
          </div>
        </div>

        {/* Total Invested */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Invested</span>
            <Target size={18} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(analytics.total_invested)}
          </div>
          <div className="text-sm mt-1 text-slate-600 dark:text-slate-400">
            {holdings.length} holdings
          </div>
        </div>

        {/* Risk Score */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Risk Score</span>
            <AlertTriangle size={18} className={
              (analytics.risk_score || 0) > 70 ? 'text-red-600' : 
              (analytics.risk_score || 0) > 40 ? 'text-yellow-600' : 
              'text-green-600'
            } />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {analytics.risk_score?.toFixed(0) || 'N/A'}/100
          </div>
          <div className="text-sm mt-1 text-slate-600 dark:text-slate-400">
            {(analytics.risk_score || 0) > 70 ? 'High Risk' : 
             (analytics.risk_score || 0) > 40 ? 'Moderate Risk' : 
             'Low Risk'}
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-fin-teal/10 to-fin-teal-dark/10 rounded-lg p-4 border border-fin-teal/20">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Award size={20} className="text-fin-teal" />
            Portfolio Insights
          </h3>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="mt-0.5">•</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sector Allocation */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <PieChart size={20} className="text-fin-teal" />
          Sector Allocation
        </h3>
        <div className="space-y-3">
          {Object.entries(analytics.sector_allocation)
            .sort(([, a], [, b]) => b - a)
            .map(([sector, percentage]) => (
              <div key={sector}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700 dark:text-slate-300">{sector}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-fin-teal to-fin-teal-dark h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Top & Worst Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Performers */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-600" />
            Top Performers
          </h3>
          <div className="space-y-2">
            {analytics.top_performers.map((stock, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{stock.symbol}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">{stock.name}</div>
                </div>
                <div className="text-green-600 font-semibold">
                  {formatPercentage(stock.profit_percentage)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worst Performers */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <TrendingDown size={20} className="text-red-600" />
            Needs Attention
          </h3>
          <div className="space-y-2">
            {analytics.worst_performers.map((stock, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{stock.symbol}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">{stock.name}</div>
                </div>
                <div className="text-red-600 font-semibold">
                  {formatPercentage(stock.profit_percentage)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioAnalyticsDashboard;
