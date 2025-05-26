import { API_ENDPOINTS } from '@/config/api-config';
import { callEdgeFunction } from './edge-function-client';

// Types for market data responses
export type StockQuote = {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  previousClose?: number;
  open?: number;
  high?: number;
  low?: number;
  marketCap?: number;
  timestamp: string;
};

class ApiCache {
  private cache: Map<string, { data: any; timestamp: number; expiry: number }> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    const now = Date.now();
    if (now > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data as T;
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const timestamp = Date.now();
    const expiry = timestamp + ttl;
    this.cache.set(key, { data, timestamp, expiry });
  }

  clear(): void { 
    this.cache.clear(); 
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) this.cache.delete(key);
    }
  }
}

const apiCache = new ApiCache();

// Clear expired cache items every 10 minutes
setInterval(() => apiCache.clearExpired(), 10 * 60 * 1000);

// 1. Get real-time stock quote
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  const cacheKey = `quote-${symbol}`;
  const cachedData = apiCache.get<StockQuote>(cacheKey);
  if (cachedData) return cachedData;
  try {
    const url = `${API_ENDPOINTS.EODHD_REALTIME}/${symbol}?fmt=json`;
    const { data, error } = await callEdgeFunction(url, 'GET');
    if (error) throw new Error(`Failed to fetch stock quote: ${error.message}`);
    apiCache.set(cacheKey, data, 60 * 1000); // 1 min cache
    return data;
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    return null;
  }
}

// 2. Get historical OHLCV data
export async function getHistoricalPrices(symbol: string, from: string, to: string): Promise<any> {
  try {
    const url = `${API_ENDPOINTS.EODHD_PROXY}/eod/${symbol}?from=${from}&to=${to}&fmt=json`;
    const { data, error } = await callEdgeFunction(url, 'GET');
    if (error) throw new Error(`Failed to fetch historical prices: ${error.message}`);
    return data;
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    return null;
  }
}

// 3. Get company fundamentals (general)
export async function getCompanyFundamentals(symbol: string): Promise<any> {
  const cacheKey = `fundamentals-general-${symbol}`;
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) return cachedData;
  try {
    const url = new URL(API_ENDPOINTS.EODHD_FUNDAMENTALS);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('type', 'general');
    const { data, error } = await callEdgeFunction(url.toString(), 'GET');
    if (error) throw new Error(`Failed to fetch company fundamentals: ${error.message}`);
    apiCache.set(cacheKey, data, 24 * 60 * 60 * 1000); // 24h cache
    return data;
  } catch (error) {
    console.error('Error fetching company fundamentals:', error);
    return null;
  }
}

// 4. Get company financials
export async function getCompanyFinancials(symbol: string): Promise<any> {
  const cacheKey = `fundamentals-financials-${symbol}`;
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) return cachedData;
  try {
    const url = new URL(API_ENDPOINTS.EODHD_FUNDAMENTALS);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('type', 'financials');
    const { data, error } = await callEdgeFunction(url.toString(), 'GET');
    if (error) throw new Error(`Failed to fetch company financials: ${error.message}`);
    apiCache.set(cacheKey, data, 24 * 60 * 60 * 1000);
    return data;
  } catch (error) {
    console.error('Error fetching company financials:', error);
    return null;
  }
}

// 5. Get company dividends
export async function getCompanyDividends(symbol: string): Promise<any> {
  const cacheKey = `fundamentals-dividends-${symbol}`;
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) return cachedData;
  try {
    const url = new URL(API_ENDPOINTS.EODHD_FUNDAMENTALS);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('type', 'dividends');
    const { data, error } = await callEdgeFunction(url.toString(), 'GET');
    if (error) throw new Error(`Failed to fetch company dividends: ${error.message}`);
    apiCache.set(cacheKey, data, 24 * 60 * 60 * 1000);
    return data;
  } catch (error) {
    console.error('Error fetching company dividends:', error);
    return null;
  }
}

// 6. Get company splits
export async function getCompanySplits(symbol: string): Promise<any> {
  const cacheKey = `fundamentals-splits-${symbol}`;
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) return cachedData;
  try {
    const url = new URL(API_ENDPOINTS.EODHD_FUNDAMENTALS);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('type', 'splits');
    const { data, error } = await callEdgeFunction(url.toString(), 'GET');
    if (error) throw new Error(`Failed to fetch company splits: ${error.message}`);
    apiCache.set(cacheKey, data, 24 * 60 * 60 * 1000);
    return data;
  } catch (error) {
    console.error('Error fetching company splits:', error);
    return null;
  }
}

// 7. Get company earnings
export async function getCompanyEarnings(symbol: string): Promise<any> {
  const cacheKey = `fundamentals-earnings-${symbol}`;
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) return cachedData;
  try {
    const url = new URL(API_ENDPOINTS.EODHD_FUNDAMENTALS);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('type', 'earnings');
    const { data, error } = await callEdgeFunction(url.toString(), 'GET');
    if (error) throw new Error(`Failed to fetch company earnings: ${error.message}`);
    apiCache.set(cacheKey, data, 24 * 60 * 60 * 1000);
    return data;
  } catch (error) {
    console.error('Error fetching company earnings:', error);
    return null;
  }
}

// 8. Get company news
export async function getCompanyNews(symbol: string): Promise<any> {
  const cacheKey = `news-${symbol}`;
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) return cachedData;
  try {
    const url = `${API_ENDPOINTS.EODHD_PROXY}/news?symbols=${symbol}&fmt=json`;
    const { data, error } = await callEdgeFunction(url, 'GET');
    if (error) throw new Error(`Failed to fetch company news: ${error.message}`);
    apiCache.set(cacheKey, data, 60 * 60 * 1000); // 1h cache
    return data;
  } catch (error) {
    console.error('Error fetching company news:', error);
    return null;
  }
}

// 9. Get comprehensive stock data (for Indian, US, and Global stocks)
export async function getComprehensiveStockData(symbol: string, isIndian: boolean = false): Promise<any> {
  const quote = await getStockQuote(symbol);
  const fundamentals = await getCompanyFundamentals(symbol);
  const financials = await getCompanyFinancials(symbol);
  const dividends = await getCompanyDividends(symbol);
  const splits = await getCompanySplits(symbol);
  const earnings = await getCompanyEarnings(symbol);
  const news = await getCompanyNews(symbol);
  return { quote, fundamentals, financials, dividends, splits, earnings, news };
}

export async function getIndianStockData(symbol: string): Promise<any> {
  return getComprehensiveStockData(symbol, true);
}

export async function getUSStockData(symbol: string): Promise<any> {
  return getComprehensiveStockData(symbol, false);
}

export async function getGlobalStockData(symbol: string): Promise<any> {
  return getComprehensiveStockData(symbol, false);
}

// --- Additional Utilities ---

/**
 * Type for a market index quote (ETF or index proxy)
 */
export type MarketIndex = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
};

/**
 * Batch fetch stock quotes for a list of symbols
 */
export async function getBatchQuotes(symbols: string[]): Promise<Record<string, StockQuote | null>> {
  const results: Record<string, StockQuote | null> = {};
  for (const symbol of symbols) {
    try {
      results[symbol] = await getStockQuote(symbol);
    } catch (e) {
      results[symbol] = null;
    }
    // Optional: Delay to avoid API rate limits
    await new Promise(res => setTimeout(res, 150));
  }
  return results;
}

/**
 * Fetch major global and Indian indices (ETF proxies)
 */
export async function getMajorIndices(): Promise<MarketIndex[]> {
  // Example symbols: US ETFs and Indian indices proxies
  const indices = [
    { symbol: 'SPY', name: 'S&P 500 ETF' },
    { symbol: 'QQQ', name: 'NASDAQ-100 ETF' },
    { symbol: 'DIA', name: 'Dow Jones ETF' },
    { symbol: 'NSEI.BSE', name: 'Nifty 50' },
    { symbol: 'BSESN.BSE', name: 'Sensex' }
  ];
  const quotes = await getBatchQuotes(indices.map(i => i.symbol));
  return indices.map(idx => {
    const q = quotes[idx.symbol];
    return {
      symbol: idx.symbol,
      name: idx.name,
      price: q?.price ?? 0,
      change: q?.change ?? 0,
      changePercent: q?.changePercent ?? 0,
      timestamp: q?.timestamp ?? ''
    };
  });
}

/**
 * Type for OHLCV chart data point
 */
export type ChartDataPoint = {
  date: string; // ISO string or timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

/**
 * Fetch intraday OHLCV chart data for a symbol
 * @param symbol Stock symbol (e.g., 'AAPL')
 * @param interval Interval string (e.g., '5m', '15m', '1h', '1d')
 * @param range Number of days or data points (default: 1d)
 * @returns Array of ChartDataPoint
 */
export async function getIntradayPrices(
  symbol: string,
  interval: string = '5m', 
  range: string = '1d'
): Promise<ChartDataPoint[] | null> {
  const cacheKey = `intraday-${symbol}-${interval}-${range}`;
  const cachedData = apiCache.get<ChartDataPoint[]>(cacheKey);
  if (cachedData) return cachedData;

  try {
    const url = `${API_ENDPOINTS.EODHD_PROXY}/intraday/${symbol}?interval=${interval}&range=${range}&fmt=json`;
    const { data, error } = await callEdgeFunction(url, 'GET');
    
    if (error) throw new Error(`Failed to fetch intraday prices: ${error.message}`);
    
    // Cache for 5 minutes (shorter for intraday data)
    apiCache.set(cacheKey, data, 5 * 60 * 1000);
    return data as ChartDataPoint[];
  } catch (error) {
    console.error('Error fetching intraday prices:', error);
    return null;
  }
}

