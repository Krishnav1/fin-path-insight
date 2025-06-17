/**
 * EODHD News Service
 * Handles financial news data from EODHD API
 */

import { EODHDBaseService, ENDPOINTS } from './base-service';
import { CacheService } from './cache-service';

// Types
export interface NewsItem {
  date: string;
  title: string;
  content: string;
  link: string;
  symbols: string[];
  tags: string[];
  source: string;
  image_url?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface NewsParams {
  symbols?: string[];
  limit?: number;
  offset?: number;
  sort?: 'date' | 'title' | 'sentiment';
  order?: 'asc' | 'desc';
  market?: string;
  from?: string;
  to?: string;
  tags?: string[];
}

/**
 * Service for accessing EODHD financial news
 */
export class NewsService extends EODHDBaseService {
  private static instance: NewsService;

  private constructor() {
    super();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  /**
   * Fetch news from the EODHD API
   * @param params Object with parameters (e.g., symbols, limit, etc.)
   * @returns Array of news items
   */
  async getNews(params: NewsParams = {}): Promise<NewsItem[]> {
    // Build search parameters
    const searchParams: Record<string, any> = {};
    
    if (params.limit) searchParams.limit = params.limit;
    if (params.offset) searchParams.offset = params.offset;
    if (params.sort) searchParams.sort = params.sort;
    if (params.order) searchParams.order = params.order;
    if (params.from) searchParams.from = params.from;
    if (params.to) searchParams.to = params.to;
    if (params.market) searchParams.market = params.market;
    
    // Format symbols if provided
    if (params.symbols && params.symbols.length > 0) {
      const formattedSymbols = params.symbols.map(symbol => this.formatSymbol(symbol));
      searchParams.s = formattedSymbols.join(',');
    }
    
    // Format tags if provided
    if (params.tags && params.tags.length > 0) {
      searchParams.tags = params.tags.join(',');
    }
    
    const data = await this.callAPI<NewsItem[]>(
      ENDPOINTS.PROXY,
      '/news',
      searchParams,
      CacheService.NEWS_TTL
    );
    
    return this.normalizeResponse<NewsItem[]>(data);
  }

  /**
   * Fetch news for a specific symbol
   * @param symbol Stock symbol
   * @param limit Max number of news items to return
   * @returns Array of news items
   */
  async getSymbolNews(symbol: string, limit: number = 10): Promise<NewsItem[]> {
    return this.getNews({
      symbols: [symbol],
      limit
    });
  }

  /**
   * Fetch latest market news
   * @param market Market identifier (e.g., 'US', 'IN')
   * @param limit Max number of news items to return
   * @returns Array of news items
   */
  async getMarketNews(market: string, limit: number = 20): Promise<NewsItem[]> {
    return this.getNews({
      market,
      limit
    });
  }

  /**
   * Fetch trending news across all markets
   * @param limit Max number of news items to return
   * @returns Array of news items
   */
  async getTrendingNews(limit: number = 10): Promise<NewsItem[]> {
    return this.getNews({
      limit,
      sort: 'date',
      order: 'desc'
    });
  }
}

// Export singleton instance
export const newsService = NewsService.getInstance();
