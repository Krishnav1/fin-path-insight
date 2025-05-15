import axios from 'axios';
import Crypto from '../models/Crypto.js';
import { getCached, setCached } from './cacheService.js';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const COINGECKO_RATE_LIMIT_DELAY = 6000; // 6s between requests to avoid rate limits on free tier
const MAX_RETRIES = 3;

// Add axiosWithRetry for better reliability
const axiosWithRetry = async (url, config, retries = MAX_RETRIES, delay = 1000) => {
  try {
    return await axios.get(url, config);
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    
    // Check for rate limiting
    if (error.response && error.response.status === 429) {
      console.log(`Rate limited on CoinGecko API, waiting longer before retry`);
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    } else {
      console.log(`Retrying API call to ${url}, ${retries} retries left`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    return axiosWithRetry(url, config, retries - 1, delay * 2);
  }
};

// Validate crypto data
const validateCryptoData = (data) => {
  if (!data) return false;
  
  const requiredFields = ['coinId', 'symbol', 'name', 'price'];
  const hasRequiredFields = requiredFields.every(field => data[field] !== undefined);
  
  const isReasonable = 
    (data.price > 0) && 
    (!data.changePercent24h || Math.abs(data.changePercent24h) < 50); // Crypto is volatile but <50% change is still a reasonable check
    
  return hasRequiredFields && isReasonable;
};

/**
 * Fetches cryptocurrency data from CoinGecko
 * @param {string} coinId - CoinGecko coin ID (e.g., 'bitcoin')
 * @returns {Promise<Object>} - Cryptocurrency data
 */
export const fetchCryptoData = async (coinId) => {
  const cacheKey = `crypto_${coinId}`;
  const cachedData = getCached(cacheKey);
  
  if (cachedData && validateCryptoData(cachedData)) {
    return cachedData;
  }
  
  try {
    const url = `${COINGECKO_API_URL}/coins/${coinId}`;
    const response = await axiosWithRetry(url, {
      params: {
        localization: false,
        tickers: false,
        community_data: false,
        developer_data: false,
      },
      timeout: 15000 // 15s timeout
    });
    
    if (!response.data || !response.data.market_data) {
      throw new Error(`Invalid data received for ${coinId}`);
    }
    
    const data = response.data;
    
    // Process coin data with proper defaults
    const cryptoData = {
      coinId: data.id,
      symbol: (data.symbol || '').toUpperCase(),
      name: data.name || coinId,
      price: data.market_data.current_price?.usd || 0,
      change24h: data.market_data.price_change_24h || 0,
      changePercent24h: data.market_data.price_change_percentage_24h || 0,
      marketCap: data.market_data.market_cap?.usd || 0,
      totalVolume: data.market_data.total_volume?.usd || 0,
      circulatingSupply: data.market_data.circulating_supply || 0,
      maxSupply: data.market_data.max_supply || null,
      ath: data.market_data.ath?.usd || 0,
      athDate: data.market_data.ath_date?.usd ? new Date(data.market_data.ath_date.usd) : new Date(),
      lastUpdated: new Date()
    };
    
    // Validate before caching
    if (validateCryptoData(cryptoData)) {
      setCached(cacheKey, cryptoData);
      return cryptoData;
    } else {
      throw new Error(`Invalid crypto data received for ${coinId}`);
    }
  } catch (error) {
    console.error(`Error fetching crypto data for ${coinId}:`, error);
    
    // If we have cached data, return it even if it's outdated rather than failing
    if (cachedData) {
      console.log(`Returning outdated cached data for ${coinId}`);
      return cachedData;
    }
    
    throw error;
  }
};

/**
 * Fetches historical market data for a cryptocurrency
 * @param {string} coinId - CoinGecko coin ID
 * @param {string} days - Number of days of data to fetch ('1', '7', '30', '365')
 * @returns {Promise<Array>} - Historical market data points
 */
export const fetchCryptoMarketData = async (coinId, days = '365') => {
  const cacheKey = `crypto_market_${coinId}_${days}`;
  const cachedData = getCached(cacheKey);
  
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    return cachedData;
  }
  
  try {
    // Add delay to avoid rate limiting on free tier
    await new Promise(resolve => setTimeout(resolve, COINGECKO_RATE_LIMIT_DELAY));
    
    const url = `${COINGECKO_API_URL}/coins/${coinId}/market_chart`;
    const response = await axiosWithRetry(url, {
      params: {
        vs_currency: 'usd',
        days,
      },
      timeout: 15000
    });
    
    if (!response.data || !response.data.prices || !Array.isArray(response.data.prices)) {
      throw new Error(`Invalid market data for ${coinId}`);
    }
    
    const { prices, total_volumes } = response.data;
    
    // Format market data
    const marketData = prices.map((price, index) => ({
      date: new Date(price[0]),
      price: price[1],
      volume: total_volumes[index] ? total_volumes[index][1] : null
    })).filter(point => point.price > 0); // Filter out any invalid points
    
    if (marketData.length > 0) {
      setCached(cacheKey, marketData);
      return marketData;
    } else {
      throw new Error(`No valid market data points for ${coinId}`);
    }
  } catch (error) {
    console.error(`Error fetching crypto market data for ${coinId}:`, error);
    
    // If we have cached data, return it even if it's outdated
    if (cachedData) {
      return cachedData;
    }
    
    throw error;
  }
};

/**
 * Gets complete crypto data, combining all data sources
 * @param {string} coinId - CoinGecko coin ID
 * @returns {Promise<Object>} - Complete cryptocurrency data
 */
export const getCryptoData = async (coinId) => {
  try {
    // Check if we already have this crypto in DB with recent data
    const existingCrypto = await Crypto.findOne({ coinId });
    const now = new Date();
    
    // If crypto exists and was updated recently (within cache TTL), return it
    if (existingCrypto && 
        existingCrypto.lastUpdated && 
        (now - existingCrypto.lastUpdated) < (parseInt(process.env.CACHE_TTL || '300', 10) * 1000)) {
      return existingCrypto;
    }
    
    try {
      // Fetch all crypto data in parallel
      const [cryptoData, marketData] = await Promise.all([
        fetchCryptoData(coinId),
        fetchCryptoMarketData(coinId)
      ]);
      
      // Combine all data
      const completeData = {
        ...cryptoData,
        marketData,
        lastUpdated: new Date()
      };
      
      // Update or create crypto in database
      if (existingCrypto) {
        await Crypto.findByIdAndUpdate(existingCrypto._id, completeData);
      } else {
        await new Crypto(completeData).save();
      }
      
      return completeData;
    } catch (error) {
      // If data fetching fails but we have existing data, return that
      if (existingCrypto) {
        console.log(`Using existing DB data for ${coinId} due to API errors`);
        return existingCrypto;
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error getting complete crypto data for ${coinId}:`, error);
    throw error;
  }
};

/**
 * Search for cryptocurrencies by name or symbol
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Search results
 */
export const searchCryptos = async (query) => {
  const cacheKey = `crypto_search_${query}`;
  const cachedData = getCached(cacheKey);
  
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    return cachedData;
  }
  
  try {
    const url = `${COINGECKO_API_URL}/search`;
    const response = await axiosWithRetry(url, {
      params: {
        query
      },
      timeout: 10000
    });
    
    if (!response.data || !response.data.coins || !Array.isArray(response.data.coins)) {
      throw new Error(`Invalid search results for query: ${query}`);
    }
    
    const coins = response.data.coins.slice(0, 10).map(coin => ({
      id: coin.id,
      symbol: (coin.symbol || '').toUpperCase(),
      name: coin.name || coin.id,
      thumb: coin.thumb || ''
    }));
    
    setCached(cacheKey, coins);
    return coins;
  } catch (error) {
    console.error(`Error searching cryptocurrencies for "${query}":`, error);
    
    // If we have cached results, return them
    if (cachedData) {
      return cachedData;
    }
    
    // Return empty array as fallback
    return [];
  }
};

// Add a new method to fetch market data for multiple currencies
export const fetchMarketOverview = async (limit = 10) => {
  const cacheKey = `crypto_market_overview_${limit}`;
  const cachedData = getCached(cacheKey);
  
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    return cachedData;
  }
  
  try {
    const url = `${COINGECKO_API_URL}/coins/markets`;
    const response = await axiosWithRetry(url, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: limit,
        page: 1,
        sparkline: false
      },
      timeout: 15000
    });
    
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid market overview data');
    }
    
    const marketData = response.data.map(coin => ({
      coinId: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price || 0,
      change24h: coin.price_change_24h || 0,
      changePercent24h: coin.price_change_percentage_24h || 0,
      marketCap: coin.market_cap || 0,
      lastUpdated: new Date()
    }));
    
    setCached(cacheKey, marketData);
    return marketData;
  } catch (error) {
    console.error('Error fetching crypto market overview:', error);
    
    if (cachedData) {
      return cachedData;
    }
    
    throw error;
  }
};

export default {
  fetchCryptoData,
  fetchCryptoMarketData,
  getCryptoData,
  searchCryptos,
  fetchMarketOverview
}; 