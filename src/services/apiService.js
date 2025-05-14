import axios from 'axios';
import errorHandler from '../utils/errorHandler';

// Create axios instances for different backends
const nodeBackendApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://fininsight.onrender.com',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

const fastApiBackend = axios.create({
  baseURL: import.meta.env.VITE_FASTAPI_URL || 'https://fin-path-insight-fastapi.onrender.com',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Flag to enable fallback APIs
const enableFallbacks = import.meta.env.VITE_ENABLE_FALLBACK_APIS === 'true';

// Add request interceptor for logging and headers
nodeBackendApi.interceptors.request.use(
  (config) => {
    // Add environment info to requests
    config.headers['X-Environment'] = import.meta.env.MODE;
    config.headers['X-Client-Version'] = import.meta.env.VITE_APP_VERSION || '1.0.0';
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`[Node API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    errorHandler.logError(error, 'Node API Request Interceptor');
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
nodeBackendApi.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (import.meta.env.DEV) {
      console.log(`[Node API Response] ${response.status} ${response.config.url}`);
    }
    
    return response;
  },
  (error) => {
    errorHandler.logError(error, 'Node API Response');
    return Promise.reject(error);
  }
);

// Similar interceptors for FastAPI
fastApiBackend.interceptors.request.use(
  (config) => {
    config.headers['X-Environment'] = import.meta.env.MODE;
    config.headers['X-Client-Version'] = import.meta.env.VITE_APP_VERSION || '1.0.0';
    
    if (import.meta.env.DEV) {
      console.log(`[FastAPI Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    errorHandler.logError(error, 'FastAPI Request Interceptor');
    return Promise.reject(error);
  }
);

fastApiBackend.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[FastAPI Response] ${response.status} ${response.config.url}`);
    }
    
    return response;
  },
  (error) => {
    errorHandler.logError(error, 'FastAPI Response');
    return Promise.reject(error);
  }
);

/**
 * Get stock data with fallback mechanism
 * @param {string} symbol - Stock symbol
 * @param {string} market - Market (india, us, etc.)
 * @returns {Promise<Object>} Stock data
 */
export async function getStockData(symbol, market = 'india') {
  try {
    // First try Node.js backend
    const response = await nodeBackendApi.get(`/api/stocks/${symbol}`, {
      params: { market }
    });
    
    return response.data;
  } catch (error) {
    errorHandler.logError(error, `getStockData(${symbol}, ${market})`);
    
    // If fallbacks are enabled, try FastAPI
    if (enableFallbacks) {
      try {
        console.log(`Trying fallback API for stock data: ${symbol}`);
        const fallbackResponse = await fastApiBackend.get(`/api/market-data/stock/${symbol}`, {
          params: { market }
        });
        
        return fallbackResponse.data;
      } catch (fallbackError) {
        errorHandler.logError(fallbackError, `getStockData fallback(${symbol}, ${market})`);
        
        // If both APIs fail, try static data
        try {
          const staticResponse = await axios.get(`/data/stock_${symbol.replace(/\./g, '_')}.json`);
          return staticResponse.data;
        } catch (staticError) {
          // All attempts failed, throw the original error
          throw error;
        }
      }
    } else {
      // Fallbacks disabled, throw the original error
      throw error;
    }
  }
}

/**
 * Get market overview with fallback mechanism
 * @param {string} market - Market (india, us, global)
 * @returns {Promise<Object>} Market overview data
 */
export async function getMarketOverview(market = 'india') {
  try {
    // First try Node.js backend
    const response = await nodeBackendApi.get(`/api/stocks/market-overview`, {
      params: { market }
    });
    
    return response.data;
  } catch (error) {
    errorHandler.logError(error, `getMarketOverview(${market})`);
    
    // If fallbacks are enabled, try FastAPI
    if (enableFallbacks) {
      try {
        console.log(`Trying fallback API for market overview: ${market}`);
        const fallbackResponse = await fastApiBackend.get(`/api/market-data/overview`, {
          params: { market }
        });
        
        return fallbackResponse.data;
      } catch (fallbackError) {
        errorHandler.logError(fallbackError, `getMarketOverview fallback(${market})`);
        
        // If both APIs fail, try static data
        try {
          const staticResponse = await axios.get(`/data/market_${market}.json`);
          return staticResponse.data;
        } catch (staticError) {
          // All attempts failed, throw the original error
          throw error;
        }
      }
    } else {
      // Fallbacks disabled, throw the original error
      throw error;
    }
  }
}

/**
 * Get stock chart data with fallback mechanism
 * @param {string} symbol - Stock symbol
 * @param {string} interval - Chart interval (1d, 1w, 1m, etc.)
 * @param {string} range - Chart range (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max)
 * @param {string} market - Market (india, us, etc.)
 * @returns {Promise<Object>} Chart data
 */
export async function getStockChart(symbol, interval = '1d', range = '1y', market = 'india') {
  try {
    // First try Node.js backend
    const response = await nodeBackendApi.get(`/api/stocks/${symbol}/chart`, {
      params: { interval, range, market }
    });
    
    return response.data;
  } catch (error) {
    errorHandler.logError(error, `getStockChart(${symbol}, ${interval}, ${range}, ${market})`);
    
    // If fallbacks are enabled, try FastAPI
    if (enableFallbacks) {
      try {
        console.log(`Trying fallback API for stock chart: ${symbol}`);
        const fallbackResponse = await fastApiBackend.get(`/api/market-data/chart/${symbol}`, {
          params: { interval, range, market }
        });
        
        return fallbackResponse.data;
      } catch (fallbackError) {
        errorHandler.logError(fallbackError, `getStockChart fallback(${symbol}, ${interval}, ${range}, ${market})`);
        
        // If both APIs fail, try static data
        try {
          const staticResponse = await axios.get(`/data/chart_${symbol.replace(/\./g, '_')}_${interval}_${range}.json`);
          return staticResponse.data;
        } catch (staticError) {
          // All attempts failed, throw the original error
          throw error;
        }
      }
    } else {
      // Fallbacks disabled, throw the original error
      throw error;
    }
  }
}

/**
 * Get stock financials with fallback mechanism
 * @param {string} symbol - Stock symbol
 * @param {string} market - Market (india, us, etc.)
 * @returns {Promise<Object>} Financial data
 */
export async function getStockFinancials(symbol, market = 'india') {
  try {
    // First try Node.js backend
    const response = await nodeBackendApi.get(`/api/stocks/${symbol}/financials`, {
      params: { market }
    });
    
    return response.data;
  } catch (error) {
    errorHandler.logError(error, `getStockFinancials(${symbol}, ${market})`);
    
    // If fallbacks are enabled, try FastAPI
    if (enableFallbacks) {
      try {
        console.log(`Trying fallback API for stock financials: ${symbol}`);
        const fallbackResponse = await fastApiBackend.get(`/api/market-data/financials/${symbol}`, {
          params: { market }
        });
        
        return fallbackResponse.data;
      } catch (fallbackError) {
        errorHandler.logError(fallbackError, `getStockFinancials fallback(${symbol}, ${market})`);
        
        // If both APIs fail, try static data
        try {
          const staticResponse = await axios.get(`/data/financials_${symbol.replace(/\./g, '_')}.json`);
          return staticResponse.data;
        } catch (staticError) {
          // All attempts failed, throw the original error
          throw error;
        }
      }
    } else {
      // Fallbacks disabled, throw the original error
      throw error;
    }
  }
}

/**
 * Get latest news with fallback mechanism
 * @param {string} market - Market (india, us, global)
 * @returns {Promise<Array>} News articles
 */
export async function getLatestNews(market = 'global') {
  try {
    // First try Node.js backend
    const response = await nodeBackendApi.get(`/api/news/latest`, {
      params: { market }
    });
    
    return response.data;
  } catch (error) {
    errorHandler.logError(error, `getLatestNews(${market})`);
    
    // If fallbacks are enabled, try FastAPI
    if (enableFallbacks) {
      try {
        console.log(`Trying fallback API for latest news: ${market}`);
        const fallbackResponse = await fastApiBackend.get(`/api/news/latest`, {
          params: { market }
        });
        
        return fallbackResponse.data;
      } catch (fallbackError) {
        errorHandler.logError(fallbackError, `getLatestNews fallback(${market})`);
        
        // If both APIs fail, try static data
        try {
          const staticResponse = await axios.get(`/data/news_${market}.json`);
          return staticResponse.data;
        } catch (staticError) {
          // All attempts failed, throw the original error
          throw error;
        }
      }
    } else {
      // Fallbacks disabled, throw the original error
      throw error;
    }
  }
}

/**
 * Get company news with fallback mechanism
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Array>} News articles
 */
export async function getCompanyNews(symbol) {
  try {
    // First try Node.js backend
    const response = await nodeBackendApi.get(`/api/news/company/${symbol}`);
    
    return response.data;
  } catch (error) {
    errorHandler.logError(error, `getCompanyNews(${symbol})`);
    
    // If fallbacks are enabled, try FastAPI
    if (enableFallbacks) {
      try {
        console.log(`Trying fallback API for company news: ${symbol}`);
        const fallbackResponse = await fastApiBackend.get(`/api/news/company/${symbol}`);
        
        return fallbackResponse.data;
      } catch (fallbackError) {
        errorHandler.logError(fallbackError, `getCompanyNews fallback(${symbol})`);
        
        // If both APIs fail, try static data
        try {
          const staticResponse = await axios.get(`/data/news_company_${symbol.replace(/\./g, '_')}.json`);
          return staticResponse.data;
        } catch (staticError) {
          // All attempts failed, return empty array to avoid breaking the UI
          return [];
        }
      }
    } else {
      // Fallbacks disabled, return empty array to avoid breaking the UI
      return [];
    }
  }
}

/**
 * Get peer comparison data with fallback mechanism
 * @param {string} symbol - Stock symbol
 * @param {string} sector - Optional sector
 * @returns {Promise<Array>} Peer comparison data
 */
export async function getPeerComparison(symbol, sector = null) {
  try {
    // First try Node.js backend
    const response = await nodeBackendApi.get(`/api/stocks/peers`, {
      params: { 
        symbol: encodeURIComponent(symbol),
        sector: sector ? encodeURIComponent(sector) : undefined
      }
    });
    
    return response.data;
  } catch (error) {
    errorHandler.logError(error, `getPeerComparison(${symbol}, ${sector})`);
    
    // If fallbacks are enabled, try FastAPI
    if (enableFallbacks) {
      try {
        console.log(`Trying fallback API for peer comparison: ${symbol}`);
        const fallbackResponse = await fastApiBackend.get(`/api/market-data/peers/${symbol}`, {
          params: { 
            sector: sector ? encodeURIComponent(sector) : undefined
          }
        });
        
        return fallbackResponse.data;
      } catch (fallbackError) {
        errorHandler.logError(fallbackError, `getPeerComparison fallback(${symbol}, ${sector})`);
        
        // If both APIs fail, try static data
        try {
          const staticResponse = await axios.get(`/data/peers_${symbol.replace(/\./g, '_')}.json`);
          return staticResponse.data;
        } catch (staticError) {
          // All attempts failed, return empty array to avoid breaking the UI
          return [];
        }
      }
    } else {
      // Fallbacks disabled, return empty array to avoid breaking the UI
      return [];
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
