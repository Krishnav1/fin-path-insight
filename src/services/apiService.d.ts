export interface StockData {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  timestamp?: string;
  [key: string]: any;
}

export interface MarketOverview {
  indices?: any[];
  topGainers?: any[];
  topLosers?: any[];
  mostActive?: any[];
  marketStatus?: any;
  timestamp?: string;
  [key: string]: any;
}

export interface ChartData {
  symbol: string;
  interval: string;
  range: string;
  timestamp: string;
  prices: Array<{
    date: string;
    open?: number;
    high?: number;
    low?: number;
    close: number;
    volume?: number;
  }>;
  [key: string]: any;
}

export interface FinancialData {
  symbol: string;
  financials: any[];
  ratios?: any;
  timestamp?: string;
  [key: string]: any;
}

export interface NewsItem {
  title: string;
  summary?: string;
  url: string;
  source?: string;
  publishedAt?: string;
  imageUrl?: string;
  [key: string]: any;
}

/**
 * Get stock data with fallback mechanism
 */
export function getStockData(symbol: string, market?: string): Promise<any>;

/**
 * Get market overview with fallback mechanism
 */
export function getMarketOverview(market?: string): Promise<any>;

/**
 * Get stock chart data with fallback mechanism
 */
export function getStockChart(
  symbol: string, 
  interval?: string, 
  range?: string, 
  market?: string
): Promise<any>;

/**
 * Get stock financials with fallback mechanism
 */
export function getStockFinancials(symbol: string, market?: string): Promise<any>;

/**
 * Get latest news with fallback mechanism
 */
export function getLatestNews(market?: string): Promise<any[]>;

/**
 * Get company news with fallback mechanism
 */
export function getCompanyNews(symbol: string): Promise<any[]>;

/**
 * Get peer comparison data with fallback mechanism
 */
export function getPeerComparison(symbol: string, sector?: string | null): Promise<any[]>;

declare const apiService: {
  getStockData: typeof getStockData;
  getMarketOverview: typeof getMarketOverview;
  getStockChart: typeof getStockChart;
  getStockFinancials: typeof getStockFinancials;
  getLatestNews: typeof getLatestNews;
  getCompanyNews: typeof getCompanyNews;
  getPeerComparison: typeof getPeerComparison;
};

export default apiService;
