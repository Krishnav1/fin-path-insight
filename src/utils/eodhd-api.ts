/**
 * EODHD API Integration Module
 * Provides functions to interact with EODHD API for portfolio data
 */

import { API_ENDPOINTS } from '@/config/api-config';
import { callEdgeFunction } from '@/lib/edge-function-client';
import { supabase } from '@/lib/supabase';

/**
 * Fetches stock data for a given symbol
 * @param symbol Stock symbol (e.g., AAPL, MSFT)
 * @returns Promise with stock data
 */
export const fetchStockData = async (symbol: string) => {
  try {
    // Use callEdgeFunction to handle authentication, error handling, and retries
    const { data, error } = await callEdgeFunction(
      `${API_ENDPOINTS.EODHD_PROXY}/eod/${symbol}?fmt=json`,
      'GET'
    );
    
    if (error) throw new Error(`Failed to fetch stock data: ${error.message}`);
    return data;
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
  try {
    // Use callEdgeFunction to handle authentication, error handling, and retries
    const { data, error } = await callEdgeFunction(
      `${API_ENDPOINTS.EODHD_PROXY}/fundamentals/${symbol}?fmt=json`,
      'GET'
    );
    
    if (error) throw new Error(`Failed to fetch fundamental data: ${error.message}`);
    return data;
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
  try {
    const symbolsStr = symbols.join(',');
    
    // Use callEdgeFunction to handle authentication, error handling, and retries
    const { data, error } = await callEdgeFunction(
      `${API_ENDPOINTS.EODHD_PROXY}/real-time/${symbolsStr}?fmt=json`,
      'GET'
    );
    
    if (error) throw new Error(`Failed to fetch quotes: ${error.message}`);
    return data;
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
  try {
    // Build search parameters
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
    
    // Use callEdgeFunction to handle authentication, error handling, and retries
    const { data, error } = await callEdgeFunction(
      `${API_ENDPOINTS.EODHD_PROXY}/news?${searchParams.toString()}`,
      'GET'
    );
    
    if (error) throw new Error(`Failed to fetch news: ${error.message}`);
    return data;
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
  try {
    // Use callEdgeFunction to handle authentication, error handling, and retries
    const { data, error } = await callEdgeFunction(
      `${API_ENDPOINTS.EODHD_PROXY}/eod/${symbol}?from=${fromDate}&to=${toDate}&fmt=json`,
      'GET'
    );
    
    if (error) throw new Error(`Failed to fetch historical prices: ${error.message}`);
    return data;
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    throw error;
  }
};
