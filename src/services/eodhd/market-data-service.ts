/**
 * EODHD Market Data Service
 * Handles stock prices, historical data, and real-time quotes
 */

import { EODHDBaseService, ENDPOINTS } from './base-service';
import { CacheService } from './cache-service';

// Types
export interface IntradayPrice {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close: number;
  volume: number;
}

export interface RealTimeQuote {
  code: string;
  timestamp: number;
  gmtoffset: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  previousClose: number;
  change: number;
  change_p: number;
  marketCap?: number;
}

/**
 * Service for accessing EODHD market data
 */
export class MarketDataService extends EODHDBaseService {
  private static instance: MarketDataService;

  private constructor() {
    super();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  /**
   * Fetch intraday OHLCV price data
   * @param symbol Stock symbol (e.g., 'AAPL.US')
   * @param interval Interval string (e.g., '5m', '15m', '1h', '1d')
   * @param range Data range (e.g., '1d', '5d', '1m')
   * @returns Array of intraday prices
   */
  async getIntradayPrices(symbol: string, interval: string = '5m', range: string = '1d'): Promise<IntradayPrice[]> {
    const formattedSymbol = this.formatSymbol(symbol);
    
    // Calculate from date based on range
    const now = new Date();
    const from = new Date();
    
    switch (range) {
      case '1d': from.setDate(now.getDate() - 1); break;
      case '5d': from.setDate(now.getDate() - 5); break;
      case '1m': from.setMonth(now.getMonth() - 1); break;
      case '3m': from.setMonth(now.getMonth() - 3); break;
      case '6m': from.setMonth(now.getMonth() - 6); break;
      case '1y': from.setFullYear(now.getFullYear() - 1); break;
      default: from.setDate(now.getDate() - 1);
    }
    
    const fromStr = from.toISOString().split('T')[0];
    
    const data = await this.callAPI<IntradayPrice[]>(
      ENDPOINTS.PROXY,
      `/intraday/${formattedSymbol}`,
      {
        interval,
        from: fromStr,
        fmt: 'json'
      },
      CacheService.REALTIME_TTL
    );
    
    return this.normalizeResponse<IntradayPrice[]>(data);
  }

  /**
   * Fetch historical EOD price data
   * @param symbol Stock symbol
   * @param fromDate Start date in format 'YYYY-MM-DD'
   * @param toDate End date in format 'YYYY-MM-DD'
   * @returns Array of historical prices
   */
  async getHistoricalPrices(
    symbol: string, 
    fromDate: string, 
    toDate: string = new Date().toISOString().split('T')[0]
  ): Promise<HistoricalPrice[]> {
    const formattedSymbol = this.formatSymbol(symbol);
    
    const data = await this.callAPI<HistoricalPrice[]>(
      ENDPOINTS.PROXY,
      `/eod/${formattedSymbol}`,
      {
        from: fromDate,
        to: toDate,
        fmt: 'json'
      },
      CacheService.DEFAULT_TTL
    );
    
    return this.normalizeResponse<HistoricalPrice[]>(data);
  }

  /**
   * Fetch real-time quotes for multiple symbols
   * @param symbols Array of stock symbols
   * @returns Object with symbol as key and quote data as value
   */
  async getBulkQuotes(symbols: string[]): Promise<Record<string, RealTimeQuote>> {
    if (!symbols || symbols.length === 0) {
      return {};
    }
    
    const formattedSymbols = symbols.map(symbol => this.formatSymbol(symbol));
    const symbolString = formattedSymbols.join(',');
    
    const data = await this.callAPI<Record<string, RealTimeQuote>>(
      ENDPOINTS.REALTIME,
      `/${symbolString}`,
      { fmt: 'json' },
      CacheService.REALTIME_TTL
    );
    
    return this.normalizeResponse<Record<string, RealTimeQuote>>(data);
  }

  /**
   * Fetch a single real-time quote
   * @param symbol Stock symbol
   * @returns Real-time quote data
   */
  async getRealTimeQuote(symbol: string): Promise<RealTimeQuote> {
    const quotes = await this.getBulkQuotes([symbol]);
    const formattedSymbol = this.formatSymbol(symbol);
    return quotes[formattedSymbol] || {} as RealTimeQuote;
  }
}

// Export singleton instance
export const marketDataService = MarketDataService.getInstance();
