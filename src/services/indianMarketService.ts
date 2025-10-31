/**
 * Indian Market Service - REWRITTEN FOR INDIAN API
 * Uses indian-market-data edge function with caching
 * NO MORE EODHD!
 */

import { callEdgeFunction } from '@/lib/edge-function-client';
import { supabase } from '@/lib/supabase';

const INDIAN_MARKET_DATA_ENDPOINT = '/indian-market-data';

// Interfaces
export interface MarketOverview {
  nifty50: {
    price: number;
    change: number;
    changePercent: number;
    timestamp: number;
    status: string;
  };
  sensex: {
    price: number;
    change: number;
    changePercent: number;
    timestamp: number;
    status: string;
  };
  marketCap: {
    totalInCrores: string;
    totalInUSD: string;
    timestamp: number;
  };
  marketSegments: Array<{
    name: string;
    status: string;
    message: string;
    timestamp: number;
    index?: string;
    value?: number;
    change?: number;
  }>;
  lastUpdated: string;
}

export interface StockData {
  symbol: string;
  exchange: string;
  fullSymbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  sector: string;
  timestamp: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export interface CompanyFundamentals {
  symbol: string;
  company_name: string;
  sector: string;
  industry: string;
  market_cap: number;
  pe_ratio: number;
  pb_ratio: number;
  roe: number;
  debt_to_equity: number;
  dividend_yield: number;
  revenue: number;
  profit: number;
  eps: number;
  book_value: number;
  last_updated: string;
}

export interface StockHistory {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  title: string;
  description: string;
  url: string;
  source: string;
  image_url?: string;
  published_at: string;
  category?: string;
  symbols?: string[];
}

/**
 * Get Indian market overview with indices
 */
export async function getIndianMarketOverview(forceRefresh = false): Promise<MarketOverview | null> {
  try {
    const result = await callEdgeFunction(`${INDIAN_MARKET_DATA_ENDPOINT}/market/indices`, 'GET');
    
    if (result.error) {
      console.error('Error fetching market overview:', result.error);
      return null;
    }

    const data = result.data;
    const nowDate = new Date();
    const marketHours = nowDate.getHours();
    const isMarketOpen = marketHours >= 9 && marketHours < 16 && nowDate.getDay() > 0 && nowDate.getDay() < 6;

    // Find NIFTY 50 and SENSEX from indices
    const nifty = data.indices?.find((idx: any) => idx.name === 'NIFTY 50') || {};
    const sensex = data.indices?.find((idx: any) => idx.name === 'SENSEX') || {};

    return {
      nifty50: {
        price: nifty.value || 0,
        change: nifty.change || 0,
        changePercent: nifty.change_percent || 0,
        timestamp: Date.now(),
        status: isMarketOpen ? 'Open' : 'Closed'
      },
      sensex: {
        price: sensex.value || 0,
        change: sensex.change || 0,
        changePercent: sensex.change_percent || 0,
        timestamp: Date.now(),
        status: isMarketOpen ? 'Open' : 'Closed'
      },
      marketCap: {
        totalInCrores: '300+',
        totalInUSD: '3.5+',
        timestamp: Date.now()
      },
      marketSegments: [
        {
          name: 'NSE',
          status: isMarketOpen ? 'Open' : 'Closed',
          message: isMarketOpen ? 'Trading in Progress' : 'Market Closed for the Day',
          timestamp: Date.now(),
          index: 'NIFTY 50',
          value: nifty.value || 0,
          change: nifty.change_percent || 0
        },
        {
          name: 'BSE',
          status: isMarketOpen ? 'Open' : 'Closed',
          message: isMarketOpen ? 'Trading in Progress' : 'Market Closed for the Day',
          timestamp: Date.now(),
          index: 'SENSEX',
          value: sensex.value || 0,
          change: sensex.change_percent || 0
        }
      ],
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getIndianMarketOverview:', error);
    return null;
  }
}

/**
 * Get real-time stock price
 */
export async function getStockPrice(symbol: string): Promise<StockData | null> {
  try {
    const result = await callEdgeFunction(`${INDIAN_MARKET_DATA_ENDPOINT}/stock/realtime/${symbol}`, 'GET');
    
    if (result.error) {
      console.error(`Error fetching price for ${symbol}:`, result.error);
      return null;
    }

    const data = result.data;
    return {
      symbol,
      exchange: 'NSE',
      fullSymbol: `${symbol}.NSE`,
      name: data.company_name || symbol,
      price: data.price || data.close || 0,
      change: data.change || 0,
      changePercent: data.change_percent || data.pChange || 0,
      marketCap: data.market_cap || 0,
      sector: data.sector || 'Unknown',
      timestamp: Date.now(),
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume
    };
  } catch (error) {
    console.error(`Error in getStockPrice for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get stock data for multiple symbols
 */
export async function getIndianStocksBatch(symbols: string[], forceRefresh = false): Promise<Record<string, StockData>> {
  if (!symbols || symbols.length === 0) {
    return {};
  }

  try {
    const results: Record<string, StockData> = {};
    
    // Fetch prices in parallel (max 5 at a time to avoid rate limits)
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(symbol => getStockPrice(symbol));
      const batchResults = await Promise.all(promises);
      
      batchResults.forEach((data, index) => {
        if (data) {
          results[batch[index]] = data;
        }
      });
      
      // Small delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return results;
  } catch (error) {
    console.error('Error in getIndianStocksBatch:', error);
    return {};
  }
}

/**
 * Get company fundamentals
 */
export async function getCompanyFundamentals(symbol: string): Promise<CompanyFundamentals | null> {
  try {
    const result = await callEdgeFunction(`${INDIAN_MARKET_DATA_ENDPOINT}/stock/fundamentals/${symbol}`, 'GET');
    
    if (result.error) {
      console.error(`Error fetching fundamentals for ${symbol}:`, result.error);
      return null;
    }

    return result.data as CompanyFundamentals;
  } catch (error) {
    console.error(`Error in getCompanyFundamentals for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get stock historical data
 */
export async function getStockHistory(symbol: string, period: string = '1M'): Promise<StockHistory[]> {
  try {
    const result = await callEdgeFunction(
      `${INDIAN_MARKET_DATA_ENDPOINT}/stock/history/${symbol}?period=${period}`,
      'GET'
    );
    
    if (result.error) {
      console.error(`Error fetching history for ${symbol}:`, result.error);
      return [];
    }

    return result.data.history || [];
  } catch (error) {
    console.error(`Error in getStockHistory for ${symbol}:`, error);
    return [];
  }
}

/**
 * Get market news
 */
export async function getMarketNews(symbol?: string, limit: number = 10): Promise<NewsItem[]> {
  try {
    const endpoint = symbol
      ? `${INDIAN_MARKET_DATA_ENDPOINT}/market/news?symbol=${symbol}&limit=${limit}`
      : `${INDIAN_MARKET_DATA_ENDPOINT}/market/news?limit=${limit}`;
    
    const result = await callEdgeFunction(endpoint, 'GET');
    
    if (result.error) {
      console.error('Error fetching news:', result.error);
      return [];
    }

    return result.data.news || [];
  } catch (error) {
    console.error('Error in getMarketNews:', error);
    return [];
  }
}

/**
 * Get top gainers
 */
export async function getTopGainers(): Promise<StockData[]> {
  try {
    const result = await callEdgeFunction(`${INDIAN_MARKET_DATA_ENDPOINT}/market/top-gainers`, 'GET');
    
    if (result.error) {
      console.error('Error fetching top gainers:', result.error);
      return [];
    }

    return result.data.stocks || [];
  } catch (error) {
    console.error('Error in getTopGainers:', error);
    return [];
  }
}

/**
 * Get top losers
 */
export async function getTopLosers(): Promise<StockData[]> {
  try {
    const result = await callEdgeFunction(`${INDIAN_MARKET_DATA_ENDPOINT}/market/top-losers`, 'GET');
    
    if (result.error) {
      console.error('Error fetching top losers:', result.error);
      return [];
    }

    return result.data.stocks || [];
  } catch (error) {
    console.error('Error in getTopLosers:', error);
    return [];
  }
}

/**
 * Search for Indian stocks
 */
export async function searchIndianStocks(query: string): Promise<StockData[]> {
  // Common Indian stocks for search
  const commonStocks = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR',
    'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK',
    'LT', 'AXISBANK', 'BAJFINANCE', 'HCLTECH', 'ASIANPAINT',
    'MARUTI', 'TITAN', 'SUNPHARMA', 'ULTRACEMCO', 'NESTLEIND'
  ];
  
  if (!query || query.trim() === '') {
    return [];
  }

  const normalizedQuery = query.toUpperCase().trim();
  const matchingSymbols = commonStocks.filter(symbol => symbol.includes(normalizedQuery));

  if (matchingSymbols.length > 0) {
    const stocksData = await getIndianStocksBatch(matchingSymbols.slice(0, 10));
    return Object.values(stocksData);
  }

  return [];
}

// Export for backward compatibility
export const STOCK_DATA_TTL = 60000; // 1 minute
