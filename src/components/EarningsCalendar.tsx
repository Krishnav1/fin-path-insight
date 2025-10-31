/**
 * Earnings Calendar Component
 * Displays upcoming earnings dates for portfolio stocks
 */

import React, { useEffect, useState } from 'react';
import { Calendar, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/services/notificationService';

interface EarningsEvent {
  id: string;
  symbol: string;
  company_name: string;
  earnings_date: string;
  earnings_time?: string;
  estimated_eps?: number;
  actual_eps?: number;
  surprise_percentage?: number;
  fiscal_quarter?: string;
  fiscal_year?: number;
}

interface EarningsCalendarProps {
  portfolioSymbols?: string[];
  daysAhead?: number;
}

export const EarningsCalendar: React.FC<EarningsCalendarProps> = ({ 
  portfolioSymbols = [],
  daysAhead = 30 
}) => {
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'portfolio'>('all');

  useEffect(() => {
    loadEarningsData();
  }, [daysAhead, filter]);

  const loadEarningsData = async () => {
    try {
      setIsLoading(true);

      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysAhead);

      let query = supabase
        .from('earnings_calendar')
        .select('*')
        .gte('earnings_date', today.toISOString().split('T')[0])
        .lte('earnings_date', futureDate.toISOString().split('T')[0])
        .order('earnings_date', { ascending: true });

      if (filter === 'portfolio' && portfolioSymbols.length > 0) {
        query = query.in('symbol', portfolioSymbols);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading earnings data:', error);
        return;
      }

      setEarnings(data || []);

      // Create notifications for upcoming earnings (within 3 days)
      const upcomingEarnings = (data || []).filter(e => {
        const earningsDate = new Date(e.earnings_date);
        const daysUntil = Math.ceil((earningsDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 3 && daysUntil >= 0;
      });

      for (const earning of upcomingEarnings) {
        await notificationService.createEarningsAlert(
          earning.symbol,
          new Date(earning.earnings_date).toLocaleDateString()
        );
      }
    } catch (error) {
      console.error('Error in loadEarningsData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupByDate = (events: EarningsEvent[]) => {
    const grouped: Record<string, EarningsEvent[]> = {};
    
    events.forEach(event => {
      const date = event.earnings_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });

    return grouped;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const groupedEarnings = groupByDate(earnings);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fin-teal"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Calendar size={20} className="text-fin-teal" />
          Earnings Calendar
        </h3>
        
        {portfolioSymbols.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === 'all'
                  ? 'bg-fin-teal text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('portfolio')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === 'portfolio'
                  ? 'bg-fin-teal text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              My Portfolio
            </button>
          </div>
        )}
      </div>

      {/* Earnings List */}
      {Object.keys(groupedEarnings).length === 0 ? (
        <div className="text-center p-8 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <Calendar size={48} className="mx-auto mb-2 text-slate-400" />
          <p className="text-slate-600 dark:text-slate-400">
            No earnings scheduled in the next {daysAhead} days
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedEarnings).map(([date, events]) => {
            const daysUntil = getDaysUntil(date);
            const isUrgent = daysUntil <= 2;

            return (
              <div key={date} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Date Header */}
                <div className={`p-3 border-b border-slate-200 dark:border-slate-700 ${
                  isUrgent ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-slate-50 dark:bg-slate-700/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className={isUrgent ? 'text-orange-600' : 'text-slate-600'} />
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {formatDate(date)}
                      </span>
                    </div>
                    {isUrgent && (
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-full flex items-center gap-1">
                        <AlertCircle size={12} />
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>

                {/* Events */}
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {events.map((event) => {
                    const isPortfolioStock = portfolioSymbols.includes(event.symbol);

                    return (
                      <div 
                        key={event.id} 
                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                          isPortfolioStock ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {event.symbol}
                              </span>
                              {isPortfolioStock && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                  In Portfolio
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {event.company_name}
                            </p>
                            {event.fiscal_quarter && (
                              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                {event.fiscal_quarter} {event.fiscal_year}
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            {event.earnings_time && (
                              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                {event.earnings_time}
                              </div>
                            )}
                            {event.estimated_eps !== null && event.estimated_eps !== undefined && (
                              <div className="text-xs text-slate-500 dark:text-slate-500">
                                Est. EPS: ₹{event.estimated_eps.toFixed(2)}
                              </div>
                            )}
                            {event.actual_eps !== null && event.actual_eps !== undefined && (
                              <div className="flex items-center gap-1 text-xs mt-1">
                                <TrendingUp size={12} className={
                                  (event.surprise_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                } />
                                <span className={
                                  (event.surprise_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                }>
                                  {event.surprise_percentage?.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EarningsCalendar;
