/**
 * EODHD Base Service
 * Provides common functionality for all EODHD API services
 */

import { callEdgeFunction } from '@/lib/edge-function-client';
import { API_ENDPOINTS } from '@/config/api-config';
import { cacheService, CacheService } from './cache-service';

// API endpoint constants
export const ENDPOINTS = {
  FUNDAMENTALS: API_ENDPOINTS.EODHD_FUNDAMENTALS,
  PROXY: API_ENDPOINTS.EODHD_PROXY,
  REALTIME: API_ENDPOINTS.EODHD_REALTIME,
};

/**
 * Base service for EODHD API calls
 * Handles caching, formatting, and common error handling
 */
export class EODHDBaseService {
  /**
   * Format a stock symbol for EODHD API
   * @param symbol Original stock symbol
   * @returns Formatted symbol for EODHD API
   */
  protected formatSymbol(symbol: string): string {
    if (!symbol) return '';
    
    // Convert to uppercase
    let formattedSymbol = symbol.toUpperCase();
    
    // Fix Indian stock symbols: convert .NS (Yahoo Finance) to .NSE (EODHD)
    if (formattedSymbol.endsWith('.NS')) {
      return formattedSymbol.replace(/\.NS$/, '.NSE');
    }
    
    // If there's no dot (exchange suffix) and it looks like an Indian symbol,
    // add .NSE suffix
    if (!formattedSymbol.includes('.') && /^[A-Z]+$/.test(formattedSymbol)) {
      return `${formattedSymbol}.NSE`;
    }
    
    return formattedSymbol;
  }

  /**
   * Call EODHD API via Edge Function with caching
   * @param endpoint Edge function endpoint
   * @param path API path
   * @param params Query parameters
   * @param ttl Cache TTL in milliseconds
   * @returns API response
   */
  protected async callAPI<T>(endpoint: string, path: string, params: Record<string, any> = {}, ttl: number = CacheService.DEFAULT_TTL): Promise<T> {
    // Build URL with query parameters
    const queryParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        queryParams.set(key, String(value));
      }
    }
    
    const queryString = queryParams.toString();
    const url = `${endpoint}${path}${queryString ? '?' + queryString : ''}`;
    
    // Create cache key
    const cacheKey = `eodhd:${url}`;
    
    // Check cache first
    const cachedData = cacheService.get<T>(cacheKey, ttl);
    if (cachedData) {
      return cachedData;
    }
    
    // Not in cache, make API call
    try {
      const { data, error } = await callEdgeFunction(url, 'GET');
      
      if (error) {
        throw new Error(`EODHD API error: ${error.message}`);
      }
      
      // Cache the result
      cacheService.set(cacheKey, data);
      
      return data as T;
    } catch (error) {
      console.error('EODHD API call failed:', error);
      throw error instanceof Error 
        ? error 
        : new Error('Unknown error calling EODHD API');
    }
  }

  /**
   * Clean and normalize API response
   * @param data Raw API data
   * @returns Normalized data
   */
  protected normalizeResponse<T>(data: any): T {
    // Handle common EODHD response issues
    if (!data) {
      return {} as T;
    }
    
    // Handle error responses
    if (data.error) {
      throw new Error(`EODHD API error: ${data.error}`);
    }
    
    return data as T;
  }
}
