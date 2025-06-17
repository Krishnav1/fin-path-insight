/**
 * EODHD Services Index
 * Centralizes exports from all EODHD service modules
 */

// Import all service instances
import { cacheService, CacheService } from './cache-service';
import { marketDataService } from './market-data-service';
import { fundamentalsService } from './fundamentals-service';
import { newsService } from './news-service';

// Export the services
export { cacheService, CacheService };
export { marketDataService };
export { fundamentalsService };
export { newsService };

// Export types from services
export type { CachedItem } from './cache-service';
export type { 
  IntradayPrice,
  HistoricalPrice,
  RealTimeQuote
} from './market-data-service';
export type {
  CompanyProfile,
  FinancialHighlights, 
  BalanceSheetItem,
  IncomeStatementItem,
  CashFlowItem,
  EarningsItem,
  DividendItem,
  InsiderTransaction
} from './fundamentals-service';
export type {
  NewsItem,
  NewsParams
} from './news-service';

// Export the base service for extension if needed
export { EODHDBaseService, ENDPOINTS } from './base-service';

/**
 * EODHD Services Class
 * Provides a simplified interface to all EODHD services
 */
export class EODHDService {
  private static instance: EODHDService;
  
  // Services
  readonly market = marketDataService;
  readonly fundamentals = fundamentalsService;
  readonly news = newsService;
  readonly cache = cacheService;
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): EODHDService {
    if (!EODHDService.instance) {
      EODHDService.instance = new EODHDService();
    }
    return EODHDService.instance;
  }
  
  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.cache.clear();
  }
}

// Export the main service
export const eodhd = EODHDService.getInstance();
