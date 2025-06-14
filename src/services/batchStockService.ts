/**
 * Batch Stock Service
 * Optimizes API calls by batching multiple stock requests
 */

import axios from 'axios';
import { getCacheItem, setCacheItem } from './cacheService';

// Interface for stock data returned by API
export interface BatchStockData {
  symbol: string;        // Stock symbol without exchange suffix
  originalSymbol: string; // Original symbol with exchange suffix
  code: string;          // Code returned by API
  name?: string;         // Stock name if available
  price: number;         // Current price
  change: number;        // Price change
  changePercent: number; // Price change percent
  marketCap?: number;    // Market cap if available
  sector?: string;       // Sector if available
  timestamp: number;     // Timestamp of data
}

// Cache keys
const BATCH_CACHE_KEY = 'eodhd_batch_';

/**
 * Fetch batch stock data optimizing API calls (max 15-20 symbols per request)
 * @param symbols Array of stock symbols (with or without exchange suffix)
 * @param forceRefresh Force API call ignoring cache
 */
export async function getBatchStockData(
  symbols: string[], 
  forceRefresh: boolean = false
): Promise<Record<string, BatchStockData>> {
  if (!symbols || symbols.length === 0) {
    return {};
  }
  
  try {
    // Generate a cache key based on symbols
    const cacheKey = `${BATCH_CACHE_KEY}${symbols.sort().join('_')}`;
    
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = getCacheItem<Record<string, BatchStockData>>(cacheKey);
      if (cachedData) {
        console.log('Using cached batch data for', symbols.length, 'symbols');
        return cachedData;
      }
    }
    
    // Format symbols to ensure they have .NSE suffix
    const formattedSymbols = symbols.map(symbol => 
      symbol.includes('.') ? symbol : `${symbol}.NSE`
    );
    
    // Import API endpoints
    const { API_ENDPOINTS } = await import('@/config/api-config');
    
    // Split into batches of 15 symbols (recommended by EODHD)
    const batches = [];
    for (let i = 0; i < formattedSymbols.length; i += 15) {
      batches.push(formattedSymbols.slice(i, i + 15));
    }
    
    // Process each batch
    const results: Record<string, BatchStockData> = {};
    
    await Promise.all(batches.map(async (batchSymbols) => {
      try {
        // Use the first symbol as the main one and the rest as additional symbols
        const mainSymbol = batchSymbols[0];
        const additionalSymbols = batchSymbols.slice(1);
        
        const url = additionalSymbols.length > 0
          ? `${API_ENDPOINTS.EODHD_PROXY}/real-time/${mainSymbol}?s=${additionalSymbols.join(',')}&fmt=json`
          : `${API_ENDPOINTS.EODHD_PROXY}/real-time/${mainSymbol}?fmt=json`;
          
        console.log('Fetching batch data:', url);
        const response = await axios.get(url);
        
        // Process the response
        if (Array.isArray(response.data)) {
          // Batch response
          response.data.forEach((item: any) => {
            const rawSymbol = item.code;
            const baseSymbol = rawSymbol.split('.')[0];
            
            results[baseSymbol] = {
              symbol: baseSymbol,
              originalSymbol: rawSymbol,
              code: item.code,
              price: item.close || 0,
              change: item.change || 0,
              changePercent: item.change_p || 0,
              timestamp: item.timestamp || Date.now(),
              // These fields might not be available from real-time API
              marketCap: item.marketCap,
              sector: item.sector
            };
          });
        } else {
          // Single item response
          const item = response.data;
          const rawSymbol = item.code;
          const baseSymbol = rawSymbol.split('.')[0];
          
          results[baseSymbol] = {
            symbol: baseSymbol,
            originalSymbol: rawSymbol,
            code: item.code,
            price: item.close || 0,
            change: item.change || 0,
            changePercent: item.change_p || 0,
            timestamp: item.timestamp || Date.now(),
            // These fields might not be available from real-time API
            marketCap: item.marketCap,
            sector: item.sector
          };
        }
      } catch (error) {
        console.error('Error fetching batch:', error);
      }
    }));
    
    // Cache the results
    setCacheItem(cacheKey, results);
    
    return results;
  } catch (error) {
    console.error('Error in getBatchStockData:', error);
    return {};
  }
}

/**
 * Get additional data for stocks that might not be available in real-time API
 * like sector, company name, etc.
 * This can be merged with the batch data for more complete information
 */
export async function getEnhancedStockData(symbols: string[]): Promise<Record<string, any>> {
  if (!symbols || symbols.length === 0) {
    return {};
  }
  
  // This would call another endpoint that provides more detailed info
  // For now we'll return a mock implementation
  const mockData: Record<string, any> = {};
  
  // Map of common Indian stock sectors
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
  
  // Map of company names
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
  
  // Generate mock data for each symbol
  symbols.forEach(rawSymbol => {
    const symbol = rawSymbol.includes('.') ? rawSymbol.split('.')[0] : rawSymbol;
    mockData[symbol] = {
      sector: sectorMap[symbol] || 'Miscellaneous',
      name: nameMap[symbol] || symbol,
      marketCap: Math.random() * 1000000 // Random mock market cap
    };
  });
  
  return mockData;
}
