import { SupabaseClient } from '@supabase/supabase-js';

export interface StockData {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  change_percent: number;
  volume?: number;
  market_cap?: number;
  timestamp?: string;
  market?: string;
  [key: string]: any;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  market: string;
  importance: number;
  timestamp?: string;
}

export interface MarketStatus {
  market: string;
  status: string;
  next_open?: string;
  next_close?: string;
  timestamp: string;
}

export interface MarketOverview {
  indices: MarketIndex[];
  topGainers: StockData[];
  topLosers: StockData[];
  mostActive: StockData[];
  marketStatus: MarketStatus;
  timestamp: string;
}

export interface NewsItem {
  id?: string;
  title: string;
  summary?: string;
  url: string;
  source?: string;
  published_at: string;
  image_url?: string;
  market?: string;
  tags?: string[];
}

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface Watchlist {
  user_id: string;
  stocks: string[];
  created_at?: string;
  updated_at?: string;
}

export interface FinancialData {
  symbol: string;
  income_statement?: any[];
  balance_sheet?: any[];
  cash_flow?: any[];
  ratios?: Record<string, any>;
  timestamp?: string;
}

export interface ChartData {
  symbol: string;
  interval: string;
  range: string;
  prices: Array<{
    date: string;
    open?: number;
    high?: number;
    low?: number;
    close: number;
    volume?: number;
  }>;
  timestamp: string;
}

export const supabase: SupabaseClient;

export const stocksService: {
  getStockData(symbol: string): Promise<StockData | null>;
  getMarketOverview(market?: string): Promise<MarketOverview | null>;
  saveStockData(stockData: StockData): Promise<StockData | null>;
  updateStocks(stocksData: StockData[]): Promise<StockData[]>;
};

export const userService: {
  getProfile(): Promise<UserProfile | null>;
  updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile | null>;
  getWatchlist(): Promise<string[]>;
  updateWatchlist(symbols: string[]): Promise<string[]>;
};

export const newsService: {
  getLatestNews(market?: string, limit?: number): Promise<NewsItem[]>;
  getCompanyNews(symbol: string, limit?: number): Promise<NewsItem[]>;
  saveNewsItem(newsItem: NewsItem): Promise<NewsItem | null>;
};

export const financialDataService: {
  getStockFinancials(symbol: string): Promise<FinancialData | null>;
  getStockChart(symbol: string, interval?: string, range?: string): Promise<ChartData | null>;
  saveStockChart(chartData: ChartData): Promise<ChartData | null>;
};

export const authService: {
  signUp(email: string, password: string): Promise<any>;
  signIn(email: string, password: string): Promise<any>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<any | null>;
  resetPassword(email: string): Promise<void>;
};

declare const supabaseService: {
  supabase: SupabaseClient;
  stocks: typeof stocksService;
  users: typeof userService;
  news: typeof newsService;
  financials: typeof financialDataService;
  auth: typeof authService;
};

export default supabaseService;
