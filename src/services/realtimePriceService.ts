/**
 * Real-time Price Update Service
 * Manages live price updates for portfolio holdings
 */

import { supabase } from '@/lib/supabase';

export interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  timestamp: string;
}

export interface PriceSubscription {
  symbols: string[];
  onUpdate: (updates: Map<string, PriceUpdate>) => void;
  onError?: (error: string) => void;
}

class RealtimePriceService {
  private intervalId: NodeJS.Timeout | null = null;
  private subscriptions: Map<string, PriceSubscription> = new Map();
  private priceCache: Map<string, PriceUpdate> = new Map();
  private updateInterval: number = 30000; // 30 seconds during market hours
  private isMarketHours: boolean = false;

  constructor() {
    this.checkMarketHours();
    // Check market hours every 5 minutes
    setInterval(() => this.checkMarketHours(), 5 * 60 * 1000);
  }

  /**
   * Check if market is currently open (IST 9:15 AM - 3:30 PM)
   */
  private checkMarketHours(): void {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    
    const hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    const day = istTime.getUTCDay();
    
    // Market open: Monday-Friday, 9:15 AM - 3:30 PM IST
    const isWeekday = day >= 1 && day <= 5;
    const isMarketTime = 
      (hours === 9 && minutes >= 15) || 
      (hours > 9 && hours < 15) || 
      (hours === 15 && minutes <= 30);
    
    this.isMarketHours = isWeekday && isMarketTime;
    
    // Adjust update interval based on market hours
    this.updateInterval = this.isMarketHours ? 30000 : 300000; // 30s or 5min
  }

  /**
   * Fetch live prices from API
   */
  private async fetchPrices(symbols: string[]): Promise<Map<string, PriceUpdate>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Call Supabase Edge Function for real-time prices
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/indian-market-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            action: 'getBulkPrices',
            symbols: symbols
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const priceMap = new Map<string, PriceUpdate>();

      // Process response and update cache
      if (data.prices) {
        Object.entries(data.prices).forEach(([symbol, priceData]: [string, any]) => {
          const update: PriceUpdate = {
            symbol,
            price: priceData.price || priceData.ltp || 0,
            change: priceData.change || 0,
            changePercent: priceData.changePercent || priceData.pChange || 0,
            volume: priceData.volume,
            timestamp: new Date().toISOString()
          };
          priceMap.set(symbol, update);
          this.priceCache.set(symbol, update);
        });
      }

      return priceMap;
    } catch (error) {
      console.error('Error fetching prices:', error);
      return new Map();
    }
  }

  /**
   * Subscribe to price updates for specific symbols
   */
  subscribe(id: string, subscription: PriceSubscription): void {
    this.subscriptions.set(id, subscription);

    // Start polling if not already started
    if (!this.intervalId) {
      this.startPolling();
    }

    // Immediately fetch prices for new subscription
    this.updatePrices();
  }

  /**
   * Unsubscribe from price updates
   */
  unsubscribe(id: string): void {
    this.subscriptions.delete(id);

    // Stop polling if no active subscriptions
    if (this.subscriptions.size === 0 && this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Start polling for price updates
   */
  private startPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.updatePrices();
    }, this.updateInterval);
  }

  /**
   * Update prices for all subscriptions
   */
  private async updatePrices(): Promise<void> {
    // Collect all unique symbols from subscriptions
    const allSymbols = new Set<string>();
    this.subscriptions.forEach(sub => {
      sub.symbols.forEach(symbol => allSymbols.add(symbol));
    });

    if (allSymbols.size === 0) return;

    // Fetch prices
    const priceUpdates = await this.fetchPrices(Array.from(allSymbols));

    // Notify all subscriptions
    this.subscriptions.forEach(subscription => {
      const relevantUpdates = new Map<string, PriceUpdate>();
      
      subscription.symbols.forEach(symbol => {
        const update = priceUpdates.get(symbol) || this.priceCache.get(symbol);
        if (update) {
          relevantUpdates.set(symbol, update);
        }
      });

      if (relevantUpdates.size > 0) {
        subscription.onUpdate(relevantUpdates);
      }
    });
  }

  /**
   * Get cached price for a symbol
   */
  getCachedPrice(symbol: string): PriceUpdate | null {
    return this.priceCache.get(symbol) || null;
  }

  /**
   * Force refresh prices
   */
  async refresh(): Promise<void> {
    await this.updatePrices();
  }

  /**
   * Get market status
   */
  getMarketStatus(): { isOpen: boolean; nextOpen?: string; nextClose?: string } {
    return {
      isOpen: this.isMarketHours,
      nextOpen: this.isMarketHours ? undefined : 'Next day 9:15 AM IST',
      nextClose: this.isMarketHours ? '3:30 PM IST' : undefined
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.subscriptions.clear();
    this.priceCache.clear();
  }
}

export const realtimePriceService = new RealtimePriceService();
