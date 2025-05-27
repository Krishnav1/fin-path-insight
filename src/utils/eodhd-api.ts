/**
 * EODHD API Integration Module
 * Provides functions to interact with EODHD API for portfolio data
 */

import { API_ENDPOINTS } from '@/config/api-config';


/**
 * Fetches stock data for a given symbol
 * @param symbol Stock symbol (e.g., AAPL, MSFT)
 * @returns Promise with stock data
 */
import { supabase } from '@/lib/supabase';

export const fetchStockData = async (symbol: string) => {
  // Get Supabase access token
  let accessToken: string | null = null;
  if (supabase.auth && typeof supabase.auth.getSession === 'function') {
    const { data } = await supabase.auth.getSession();
    accessToken = data?.session?.access_token || null;
  }
  // Log the token and headers
  const headers = {
    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
  };
  console.log('[fetchStockData] accessToken:', accessToken);
  console.log('[fetchStockData] headers:', headers);
  try {
    const response = await fetch(
      `${API_ENDPOINTS.EODHD_PROXY}/eod/${symbol}?fmt=json`,
      {
        headers: {
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stock data: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw error;
  }
};

/**
 * Fetches fundamental data for a given symbol
 * @param symbol Stock symbol (e.g., AAPL, MSFT)
 * @returns Promise with fundamental data
 */
export const fetchFundamentalData = async (symbol: string) => {
  let accessToken: string | null = null;
  if (supabase.auth && typeof supabase.auth.getSession === 'function') {
    const { data } = await supabase.auth.getSession();
    accessToken = data?.session?.access_token || null;
  }
  const headers = {
    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
  };
  console.log('[fetchFundamentalData] accessToken:', accessToken);
  console.log('[fetchFundamentalData] headers:', headers);
  try {
    const response = await fetch(
      `${API_ENDPOINTS.EODHD_PROXY}/fundamentals/${symbol}?fmt=json`,
      {
        headers: {
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch fundamental data: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching fundamental data:', error);
    throw error;
  }
};

/**
 * Calculates portfolio metrics based on holdings
 * @param holdings Array of portfolio holdings
 * @returns Portfolio metrics
 */
export const calculatePortfolioMetrics = (holdings: any[]) => {
  // This is a placeholder function that would be populated with actual calculation logic
  // when the EODHD API is integrated
  return {
    totalValue: 0,
    totalReturn: 0,
    totalReturnPercentage: 0,
    cagr: 0,
    volatility: 0,
    beta: 0
  };
};

/**
 * Fetches real-time quotes for multiple symbols
 * @param symbols Array of stock symbols
 * @returns Promise with real-time quotes
 */
export const fetchBulkQuotes = async (symbols: string[]) => {
  let accessToken: string | null = null;
  if (supabase.auth && typeof supabase.auth.getSession === 'function') {
    const { data } = await supabase.auth.getSession();
    accessToken = data?.session?.access_token || null;
  }
  const headers = {
    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
  };
  console.log('[fetchBulkQuotes] accessToken:', accessToken);
  console.log('[fetchBulkQuotes] headers:', headers);
  try {
    const symbolsStr = symbols.join(',');
    const response = await fetch(
      `${API_ENDPOINTS.EODHD_PROXY}/real-time/${symbolsStr}?fmt=json`,
      {
        headers: {
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch quotes: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching bulk quotes:', error);
    throw error;
  }
};

/**
 * Fetches news from the EODHD API via the proxy
 * @param params Object with parameters (e.g., symbols, limit, etc.)
 * @returns Promise with news data array
 */
export const fetchNews = async (params: { symbols?: string[]; limit?: number; offset?: number; sort?: string; order?: string; market?: string; }) => {
  let accessToken: string | null = null;
  if (supabase.auth && typeof supabase.auth.getSession === 'function') {
    const { data } = await supabase.auth.getSession();
    accessToken = data?.session?.access_token || null;
  }
  const headers = {
    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
  };
  
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset) searchParams.append('offset', params.offset.toString());
  if (params.sort) searchParams.append('sort', params.sort);
  if (params.order) searchParams.append('order', params.order);
  searchParams.append('fmt', 'json');
  // Add symbols for specific markets if provided
  if (params.symbols && params.symbols.length > 0) {
    searchParams.append('s', params.symbols.join(','));
  }
  // Optionally add market-specific logic here if needed
  try {
    const response = await fetch(
      `${API_ENDPOINTS.EODHD_PROXY}/news?${searchParams.toString()}`,
      { headers }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
};

/**
 * Fetches historical prices for a symbol within a date range
 * @param symbol Stock symbol
 * @param fromDate Start date in format 'YYYY-MM-DD'
 * @param toDate End date in format 'YYYY-MM-DD'
 * @returns Promise with historical price data
 */
export const fetchHistoricalPrices = async (symbol: string, fromDate: string, toDate: string) => {
  let accessToken: string | null = null;
  if (supabase.auth && typeof supabase.auth.getSession === 'function') {
    const { data } = await supabase.auth.getSession();
    accessToken = data?.session?.access_token || null;
  }
  const headers = {
    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
  };
  console.log('[fetchHistoricalPrices] accessToken:', accessToken);
  console.log('[fetchHistoricalPrices] headers:', headers);
  try {
    const response = await fetch(
      `${API_ENDPOINTS.EODHD_PROXY}/eod/${symbol}?from=${fromDate}&to=${toDate}&fmt=json`,
      {
        headers: {
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch historical prices: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    throw error;
  }
};
