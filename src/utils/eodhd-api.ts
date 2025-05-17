/**
 * EODHD API Integration Module
 * Provides functions to interact with EODHD API for portfolio data
 */

// This is a placeholder API key - should be replaced with environment variable
// In production, this should be stored in environment variables
const EODHD_API_KEY = process.env.EODHD_API_KEY || 'your-api-key';
const EODHD_BASE_URL = 'https://eodhd.com/api';

/**
 * Fetches stock data for a given symbol
 * @param symbol Stock symbol (e.g., AAPL, MSFT)
 * @returns Promise with stock data
 */
export const fetchStockData = async (symbol: string) => {
  try {
    const response = await fetch(
      `${EODHD_BASE_URL}/eod/${symbol}?api_token=${EODHD_API_KEY}&fmt=json`
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
  try {
    const response = await fetch(
      `${EODHD_BASE_URL}/fundamentals/${symbol}?api_token=${EODHD_API_KEY}&fmt=json`
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
  try {
    const symbolsStr = symbols.join(',');
    const response = await fetch(
      `${EODHD_BASE_URL}/real-time/${symbolsStr}?api_token=${EODHD_API_KEY}&fmt=json`
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
 * Fetches historical prices for a symbol within a date range
 * @param symbol Stock symbol
 * @param fromDate Start date in format 'YYYY-MM-DD'
 * @param toDate End date in format 'YYYY-MM-DD'
 * @returns Promise with historical price data
 */
export const fetchHistoricalPrices = async (symbol: string, fromDate: string, toDate: string) => {
  try {
    const response = await fetch(
      `${EODHD_BASE_URL}/eod/${symbol}?from=${fromDate}&to=${toDate}&api_token=${EODHD_API_KEY}&fmt=json`
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
