import axios from 'axios';
import errorHandler from '../utils/errorHandler';

// Create a single axios instance for all API calls
const api = axios.create({
  baseURL: '/api',  // All requests now go through the /api proxy
  timeout: 30000,   // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// For backward compatibility, keep these references
const nodeBackendApi = api;
const fastApiBackend = api;

// Flag for feature toggling (kept for backward compatibility)
const enableFallbacks = import.meta.env.VITE_ENABLE_FALLBACK_APIS === 'true';

// Add request interceptor for logging and headers
api.interceptors.request.use(
  (config) => {
    // Add environment info to requests
    config.headers['X-Environment'] = import.meta.env.MODE;
    config.headers['X-Client-Version'] = import.meta.env.VITE_APP_VERSION || '1.0.0';
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    errorHandler.logError(error, 'API Request Interceptor');
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
    }
    
    return response;
  },
  (error) => {
    errorHandler.logError(error, 'API Response');
    return Promise.reject(error);
  }
);

/**
 * Get stock data from the API
 * @param {string} symbol - Stock symbol
 * @param {string} market - Market (india, us, etc.)
 * @returns {Promise<Object>} Stock data
 */
export async function getStockData(symbol, market = 'india') {
  try {
    const response = await api.get(`/market-data/stock/${symbol}`, {
      params: { market }
    });
    
    return response.data;
  } catch (error) {
    errorHandler.logError(error, `getStockData(${symbol}, ${market})`);
    
    // Try static data as a last resort
    if (enableFallbacks) {
      try {
        console.log(`Trying static data for stock: ${symbol}`);
        const staticResponse = await axios.get(`/data/stock_${symbol.replace(/\./g, '_')}.json`);
        return staticResponse.data;
      } catch (staticError) {
        // Static data failed too, throw the original error
        throw error;
      }
    } else {
      throw error;
    }
  }
}

/**
 * Get market overview data
 * @param {string} market - Market (india, us, global)
 * @returns {Promise<Object>} Market overview data
 */
export async function getMarketOverview(market = 'india') {
  try {
    const response = await api.get(`/market-data/overview`, {
      params: { market }
    });
    
    return response.data;
  } catch (error) {
    errorHandler.logError(error, `getMarketOverview(${market})`);
    
    // Try static data as a last resort
    if (enableFallbacks) {
      try {
        console.log(`Trying static data for market overview: ${market}`);
        const staticResponse = await axios.get(`/data/market_${market}.json`);
        return staticResponse.data;
      } catch (staticError) {
        // Static data failed too, throw the original error
        throw error;
      }
    } else {
      throw error;
    }
  }
}

/**
 * Get stock chart data
 * @param {string} symbol - Stock symbol
 * @param {string} interval - Chart interval (1d, 1w, 1m, etc.)
 * @param {string} range - Chart range (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max)
 * @param {string} market - Market (india, us, etc.)
 * @returns {Promise<Object>} Chart data
 */
export async function getStockChart(symbol, interval = '1d', range = '1y', market = 'india') {
  try {
    const response = await api.get(`/market-data/chart/${symbol}`, {
      params: { interval, range, market }
    });
    
    return response.data;
  } catch (error) {
    errorHandler.logError(error, `getStockChart(${symbol}, ${interval}, ${range}, ${market})`);
    
    // Try static data as a last resort
    if (enableFallbacks) {
      try {
        console.log(`Trying static data for chart: ${symbol}`);
        const staticResponse = await axios.get(`/data/chart_${symbol.replace(/\./g, '_')}_${interval}_${range}.json`);
        return staticResponse.data;
      } catch (staticError) {
        // Static data failed too, throw the original error
        throw error;
      }
    } else {
      throw error;
    }
  }
}

/**
 * Get stock financials
 * @param {string} symbol - Stock symbol
 * @param {string} market - Market (india, us, etc.)
 * @returns {Promise<Object>} Financial data
 */
export async function getStockFinancials(symbol, market = 'india') {
  try {
    const response = await api.get(`/market-data/financials/${symbol}`, {
      params: { market }
    });
    
    return response.data;
  } catch (error) {
    errorHandler.logError(error, `getStockFinancials(${symbol}, ${market})`);
    
    // Try static data as a last resort
    if (enableFallbacks) {
      try {
        console.log(`Trying static data for financials: ${symbol}`);
        const staticResponse = await axios.get(`/data/financials_${symbol.replace(/\./g, '_')}.json`);
        return staticResponse.data;
      } catch (staticError) {
        // Static data failed too, throw the original error
        throw error;
      }
    } else {
      throw error;
    }
  }
}

/**
 * Get latest news
 * @param {string} market - Market (india, us, global)
 * @returns {Promise<Array>} News articles
 */
export async function getLatestNews(market = 'global') {
  try {
    const response = await api.get(`/news/latest`, {
      params: { market }
    });
    
    return response.data;
  } catch (error) {
    errorHandler.logError(error, `getLatestNews(${market})`);
    
    // Try static data as a last resort
    if (enableFallbacks) {
      try {
        console.log(`Trying static data for news: ${market}`);
        const staticResponse = await axios.get(`/data/news_${market}.json`);
        return staticResponse.data;
      } catch (staticError) {
        // Static data failed too, throw the original error
        throw error;
      }
    } else {
      throw error;
    }
  }
}

/**
 * Get company news
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Array>} News articles
 */
export async function getCompanyNews(symbol) {
  try {
    const response = await api.get(`/news/company/${symbol}`);
    
    return response.data;
  } catch (error) {
    errorHandler.logError(error, `getCompanyNews(${symbol})`);
    
    // Try static data as a last resort
    if (enableFallbacks) {
      try {
        console.log(`Trying static data for company news: ${symbol}`);
        const staticResponse = await axios.get(`/data/company_news_${symbol.replace(/\./g, '_')}.json`);
        return staticResponse.data;
      } catch (staticError) {
        // Static data failed too, throw the original error
        throw error;
      }
    } else {
      throw error;
    }
  }
}

/**
 * Get peer comparison data
 * @param {string} symbol - Stock symbol
 * @param {string} sector - Optional sector
 * @returns {Promise<Array>} Peer comparison data
 */
export async function getPeerComparison(symbol, sector = null) {
  try {
    const response = await api.get(`/market-data/peers/${symbol}`, {
      params: { sector: sector || undefined } // Send sector only if it's not null
    });
    
    return response.data;
  } catch (error) {
    errorHandler.logError(error, `getPeerComparison(${symbol}, ${sector})`);
    
    // Try static data as a last resort
    if (enableFallbacks) {
      try {
        console.log(`Trying static data for peers: ${symbol}`);
        const staticResponse = await axios.get(`/data/peers_${symbol.replace(/\./g, '_')}.json`);
        return staticResponse.data;
      } catch (staticError) {
        // Static data failed too, throw the original error
        throw error;
      }
    } else {
      throw error;
    }
  }
}

// Export all functions
export default {
  getStockData,
  getMarketOverview,
  getStockChart,
  getStockFinancials,
  getLatestNews,
  getCompanyNews,
  getPeerComparison
};
