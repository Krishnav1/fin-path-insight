/**
 * Simple cache service to reduce API calls
 * This service provides methods to store and retrieve stock data from localStorage
 */

const CACHE_PREFIX = 'fin-path-insight';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CacheItem<T> {
  value: T;
  timestamp: number;
}

/**
 * Set an item in cache with expiration
 */
export function setCacheItem<T>(key: string, value: T): void {
  try {
    const cacheKey = `${CACHE_PREFIX}_${key}`;
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(item));
  } catch (error) {
    console.error('Error setting cache item:', error);
    // Fail silently - cache is a performance optimization
  }
}

/**
 * Get an item from cache if it's still valid
 */
export function getCacheItem<T>(key: string): T | null {
  try {
    const cacheKey = `${CACHE_PREFIX}_${key}`;
    const itemStr = localStorage.getItem(cacheKey);
    
    if (!itemStr) return null;
    
    const item: CacheItem<T> = JSON.parse(itemStr);
    const now = Date.now();
    
    // Check if the item has expired
    if (now - item.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return item.value;
  } catch (error) {
    console.error('Error getting cache item:', error);
    return null;
  }
}

/**
 * Remove an item from cache
 */
export function removeCacheItem(key: string): void {
  try {
    const cacheKey = `${CACHE_PREFIX}_${key}`;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Error removing cache item:', error);
  }
}

/**
 * Clear all cached items
 */
export function clearCache(): void {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}
