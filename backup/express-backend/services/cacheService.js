import NodeCache from 'node-cache';
import dotenv from 'dotenv';

dotenv.config();

const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300', 10); // Default 5 minutes

// Create a new cache instance
const cache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: CACHE_TTL * 0.2, // Check for expired keys at 20% of TTL
  useClones: false // For better performance with large objects
});

/**
 * Get cached data by key
 * @param {string} key - Cache key
 * @returns {any|null} - Cached data or null if not found
 */
export const getCached = (key) => {
  return cache.get(key);
};

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} [ttl] - Time to live in seconds (optional)
 * @returns {boolean} - True if successful
 */
export const setCached = (key, data, ttl = CACHE_TTL) => {
  return cache.set(key, data, ttl);
};

/**
 * Delete cached data by key
 * @param {string} key - Cache key
 * @returns {number} - Number of deleted entries
 */
export const deleteCached = (key) => {
  return cache.del(key);
};

/**
 * Flush the entire cache
 * @returns {void}
 */
export const flushCache = () => {
  return cache.flushAll();
};

export default {
  getCached,
  setCached,
  deleteCached,
  flushCache
}; 