/**
 * EODHD Cache Service
 * Provides caching functionality for EODHD API calls
 */

export type CachedItem<T> = {
  data: T;
  timestamp: number;
};

export class CacheService {
  private cache: Record<string, CachedItem<any>> = {};
  private static instance: CacheService;

  // Default cache TTLs
  public static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  public static readonly REALTIME_TTL = 60 * 1000;    // 1 minute for real-time data
  public static readonly PORTFOLIO_TTL = 15 * 60 * 1000; // 15 minutes for portfolio data
  public static readonly NEWS_TTL = 30 * 60 * 1000;   // 30 minutes for news
  public static readonly FUNDAMENTALS_TTL = 24 * 60 * 60 * 1000; // 24 hours for fundamentals

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get an item from cache
   * @param key Cache key
   * @param ttl Time-to-live in milliseconds
   * @returns The cached item or null if not found or expired
   */
  public get<T>(key: string, ttl: number): T | null {
    const cachedItem = this.cache[key];
    
    if (!cachedItem) {
      return null;
    }

    const now = Date.now();
    if (now - cachedItem.timestamp > ttl) {
      // Cache expired, remove it
      delete this.cache[key];
      return null;
    }

    return cachedItem.data as T;
  }

  /**
   * Set an item in cache
   * @param key Cache key
   * @param data Data to cache
   */
  public set<T>(key: string, data: T): void {
    this.cache[key] = {
      data,
      timestamp: Date.now()
    };
  }

  /**
   * Clear the entire cache or a specific key
   * @param key Optional key to clear
   */
  public clear(key?: string): void {
    if (key) {
      delete this.cache[key];
    } else {
      this.cache = {};
    }
  }

  /**
   * Get current cache size (number of keys)
   */
  public size(): number {
    return Object.keys(this.cache).length;
  }

  /**
   * Remove all expired items from cache
   * @param ttl Default TTL to apply when checking expiration
   */
  public cleanup(ttl: number = CacheService.DEFAULT_TTL): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(key => {
      if (now - this.cache[key].timestamp > ttl) {
        delete this.cache[key];
      }
    });
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();
