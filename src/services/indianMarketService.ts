/**
 * Indian Market Service
 * Provides optimized functions for fetching Indian market data
 */

import axios from 'axios';
import { getCacheItem, setCacheItem } from './cacheService';
import { API_ENDPOINTS } from '@/config/api-config';
import { callEdgeFunction } from '@/lib/edge-function-client';
import * as eodhd from '@/utils/eodhd-api';

// Cache TTL values
const MARKET_DATA_TTL = 5 * 60 * 1000; // 5 minutes for market data
const STOCK_DATA_TTL = 5 * 60 * 1000;  // 5 minutes for stock data

// Cache keys
const MARKET_OVERVIEW_CACHE_KEY = 'indian_market_overview';
const STOCK_BATCH_CACHE_PREFIX = 'indian_stocks_batch_';

// Define interfaces for type safety
export interface MarketOverview {
  nifty50: {
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
  symbol: string;          // Stock symbol (RELIANCE)
  exchange: string;        // Exchange (NSE)
  fullSymbol: string;      // Full symbol (RELIANCE.NSE)
  name: string;            // Full name (Reliance Industries Ltd)
  price: number;           // Current price
  change: number;          // Price change
  changePercent: number;   // Price change percent
  marketCap: number;       // Market cap in crores
  sector: string;          // Sector
  timestamp: number;       // Data timestamp
}

/**
 * Get Indian market overview data including indices
 */
export async function getIndianMarketOverview(forceRefresh = false): Promise<MarketOverview | null> {
  try {
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = getCacheItem<MarketOverview>(MARKET_OVERVIEW_CACHE_KEY);
      if (cachedData) {
        return cachedData;
      }
    }

    // Fetch NIFTY 50 data
    const niftyResponse = await axios.get(`${API_ENDPOINTS.EODHD_PROXY}/real-time/NIFTY50.INDX?fmt=json`)
      .then(response => response.data)
      .catch(err => {
        console.error('Error fetching NIFTY50 data:', err);
        return null;
      });

    // If we couldn't get NIFTY data, return null
    if (!niftyResponse) {
      return null;
    }

    // Create market overview data
    const nowDate = new Date();
    const marketHours = nowDate.getHours();
    const isMarketOpen = marketHours >= 9 && marketHours < 16 && nowDate.getDay() > 0 && nowDate.getDay() < 6;

    const marketOverview: MarketOverview = {
      nifty50: {
        price: niftyResponse.close || 0,
        change: niftyResponse.change || 0, 
        changePercent: niftyResponse.change_p || 0,
        timestamp: niftyResponse.timestamp || Date.now(),
        status: isMarketOpen ? 'Open' : 'Closed'
      },
      marketCap: {
        totalInCrores: '300+', // This would ideally be calculated from actual data
        totalInUSD: '3.5+',    // This would ideally be calculated from actual data
        timestamp: Date.now()
      },
      marketSegments: [
        {
          name: 'NSE',
          status: isMarketOpen ? 'Open' : 'Closed',
          message: isMarketOpen ? 'Trading in Progress' : 'Market Closed for the Day',
          timestamp: Date.now(),
          index: 'NIFTY 50',
          value: niftyResponse.close || 0,
          change: niftyResponse.change_p || 0
        },
        {
          name: 'BSE',
          status: isMarketOpen ? 'Open' : 'Closed',
          message: isMarketOpen ? 'Trading in Progress' : 'Market Closed for the Day',
          timestamp: Date.now(),
          index: 'SENSEX',
          value: 0, // Would need another API call for BSE data
          change: 0 // Would need another API call for BSE data
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    // Cache the results
    setCacheItem(MARKET_OVERVIEW_CACHE_KEY, marketOverview, MARKET_DATA_TTL);
    
    return marketOverview;
  } catch (error) {
    console.error('Error fetching Indian market overview:', error);
    return null;
  }
}

/**
 * Get stock data for multiple symbols in an optimized batch
 * @param symbols Array of stock symbols (without exchange suffix)
 */
export async function getIndianStocksBatch(symbols: string[], forceRefresh = false): Promise<Record<string, StockData>> {
  if (!symbols || symbols.length === 0) {
    return {};
  }

  try {
    const sortedSymbols = [...symbols].sort();
    const cacheKey = `${STOCK_BATCH_CACHE_PREFIX}${sortedSymbols.join('_')}`;

    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = getCacheItem<Record<string, StockData>>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Add .NSE suffix to symbols
    const formattedSymbols = sortedSymbols.map(symbol => `${symbol}.NSE`);
    
    // Split into batches of 15 symbols as recommended by EODHD API
    const batches = [];
    for (let i = 0; i < formattedSymbols.length; i += 15) {
      batches.push(formattedSymbols.slice(i, i + 15));
    }

    // Sector mapping for common Indian stocks
    const sectorMap: Record<string, string> = {
      'RELIANCE': 'Energy',
      'TCS': 'Information Technology',
      'HDFCBANK': 'Financial Services',
      'INFY': 'Information Technology',
      'HINDUNILVR': 'Consumer Goods',
      'ICICIBANK': 'Financial Services',
      'SBIN': 'Financial Services',
      'BHARTIARTL': 'Telecommunications',
      'ITC': 'Consumer Goods',
      'KOTAKBANK': 'Financial Services',
      'LT': 'Infrastructure',
      'AXISBANK': 'Financial Services',
      'BAJFINANCE': 'Financial Services',
      'HCLTECH': 'Information Technology',
      'ASIANPAINT': 'Consumer Goods'
    };

    // Company name mapping
    const nameMap: Record<string, string> = {
      'RELIANCE': 'Reliance Industries Ltd.',
      'TCS': 'Tata Consultancy Services Ltd.',
      'HDFCBANK': 'HDFC Bank Ltd.',
      'INFY': 'Infosys Ltd.',
      'HINDUNILVR': 'Hindustan Unilever Ltd.',
      'ICICIBANK': 'ICICI Bank Ltd.',
      'SBIN': 'State Bank of India',
      'BHARTIARTL': 'Bharti Airtel Ltd.',
      'ITC': 'ITC Ltd.',
      'KOTAKBANK': 'Kotak Mahindra Bank Ltd.',
      'LT': 'Larsen & Toubro Ltd.',
      'AXISBANK': 'Axis Bank Ltd.',
      'BAJFINANCE': 'Bajaj Finance Ltd.',
      'HCLTECH': 'HCL Technologies Ltd.',
      'ASIANPAINT': 'Asian Paints Ltd.'
    };

    // Process each batch
    const results: Record<string, StockData> = {};

    await Promise.all(batches.map(async (batchSymbols) => {
      try {
        // Use the existing EODHD utils to fetch bulk quotes
        const batchData = await eodhd.fetchBulkQuotes(batchSymbols);
        
        if (Array.isArray(batchData)) {
          // Process array response
          batchData.forEach((item: any) => {
            const fullSymbol = item.code || '';
            const parts = fullSymbol.split('.');
            const symbol = parts[0];
            const exchange = parts[1] || 'NSE';
            
            results[symbol] = {
              symbol,
              exchange,
              fullSymbol,
              name: nameMap[symbol] || symbol,
              price: item.close || 0,
              change: item.change || 0,
              changePercent: item.change_p || 0,
              marketCap: Math.random() * 1000000, // This would be replaced with actual data
              sector: sectorMap[symbol] || 'Other',
              timestamp: item.timestamp || Date.now()
            };
          });
        } else if (batchData) {
          // Process single item response
          const fullSymbol = batchData.code || '';
          const parts = fullSymbol.split('.');
          const symbol = parts[0];
          const exchange = parts[1] || 'NSE';
          
          results[symbol] = {
            symbol,
            exchange,
            fullSymbol,
            name: nameMap[symbol] || symbol,
            price: batchData.close || 0,
            change: batchData.change || 0,
            changePercent: batchData.change_p || 0,
            marketCap: Math.random() * 1000000, // This would be replaced with actual data
            sector: sectorMap[symbol] || 'Other',
            timestamp: batchData.timestamp || Date.now()
          };
        }
      } catch (error) {
        console.error('Error fetching batch:', error);
      }
    }));

    // Cache the results
    setCacheItem(cacheKey, results, STOCK_DATA_TTL);

    return results;
  } catch (error) {
    console.error('Error in getIndianStocksBatch:', error);
    return {};
  }
}

/**
 * Search for Indian stocks
 * This is a simple implementation that could be enhanced with a proper search API
 * @param query Search query
 */
export async function searchIndianStocks(query: string): Promise<StockData[]> {
  // For simplicity, we're using a hardcoded list of common Indian stocks
  const commonStocks = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR',
    'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK',
    'LT', 'AXISBANK', 'BAJFINANCE', 'HCLTECH', 'ASIANPAINT'
  ];
  
  if (!query || query.trim() === '') {
    return [];
  }

  const normalizedQuery = query.toUpperCase().trim();
  const matchingSymbols = commonStocks.filter(symbol => symbol.includes(normalizedQuery));

  // If we have matches, fetch their data
  if (matchingSymbols.length > 0) {
    const stocksData = await getIndianStocksBatch(matchingSymbols);
    return Object.values(stocksData);
  }

  return [];
}
