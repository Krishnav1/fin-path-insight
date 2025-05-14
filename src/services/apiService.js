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
 * @returns {Promise<Object>} Stock data
 */
export const getStockData = async (symbol) => {
  if (!symbol) {
    console.error('getStockData: Symbol is required');
    throw new Error('Symbol is required');
  }
  try {
    const response = await api.get(`/market-data/stock/${symbol}`);
    return response.data;
  } catch (error) {
    errorHandler.logError(error, `getStockData(${symbol})`);
    
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
};

/**
 * Get market overview data
 * @param {string} market - Market (india, us, global)
 * @returns {Promise<Object>} Market overview data
 */
export const getMarketOverview = async (market = 'global') => {
  try {
    let response;
    if (market.toLowerCase() === 'india') {
      // Path for Indian market overview
      response = await api.get('/market-data/indian-market/overview');
    } else {
      // Path for global market overview (assuming this exists or will be created)
      // For now, this might still 404 if not defined in backend, but the path structure is consistent.
      response = await api.get('/market-data/overview', { params: { market: 'global' } });
    }
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching market overview for ${market}:`, error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Get stock chart data
 * @param {string} symbol - Stock symbol
 * @param {string} interval - Chart interval (5min, 15min, 30min, 60min, 90min, 1h, 1d, 5d, 1wk, 1mo, 3mo)
 * @param {string} timespan - Chart timespan (1day, 5day, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
 * @returns {Promise<Object>} Chart data
 */
export const getStockChart = async (symbol, interval = '5min', timespan = '1day') => {
  if (!symbol) {
    console.error('getStockChart: Symbol is required');
    throw new Error('Symbol is required');
  }
  try {
    // Assuming 'intraday' is the primary source for charts. 'timespan' might influence 'outputsize' for daily or other intervals if needed.
    // The backend /intraday endpoint takes 'interval'. 'outputsize' is for /daily.
    const response = await api.get(`/market-data/stock/${symbol}/intraday`, { 
      params: { interval }
    });
    return response.data;
  } catch (error) {
    errorHandler.logError(error, `getStockChart(${symbol}, ${interval}, ${timespan})`);
    
    // Try static data as a last resort
    if (enableFallbacks) {
      try {
        console.log(`Trying static data for chart: ${symbol}`);
        const staticResponse = await axios.get(`/data/chart_${symbol.replace(/\./g, '_')}_${interval}_${timespan}.json`);
        return staticResponse.data;
      } catch (staticError) {
        // Static data failed too, throw the original error
        throw error;
      }
    } else {
      throw error;
    }
  }
};

/**
 * Get stock financials
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Financial data
 */
export const getStockFinancials = async (symbol) => {
  if (!symbol) {
    console.error('getStockFinancials: Symbol is required');
    throw new Error('Symbol is required');
  }
  try {
    // Mapping to company overview endpoint in FastAPI
    const response = await api.get(`/market-data/stock/${symbol}/overview`);
    return response.data;
  } catch (error) {
    errorHandler.logError(error, `getStockFinancials(${symbol})`);
    
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
};

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

/**
 * Get AI analysis for a company
 * @param {Object} companyData - Company data
 * @returns {Promise<Object>} AI analysis data
 */
export const getAIAnalysis = async (companyData) => {
  if (!companyData || !companyData.symbol) {
    console.error('getAIAnalysis: companyData with symbol is required');
    throw new Error('companyData with symbol is required');
  }
  try {
    // Wrap companyData to match the CompanyAnalysisRequest schema
    const requestBody = { companyData: companyData };
    const response = await api.post('/ai-analysis/company', requestBody);
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching AI analysis for ${companyData.symbol}:`, error.response ? error.response.data : error.message);
    // Return a placeholder or error structure if AI analysis fails
    return {
      analysis: `Could not generate AI analysis for ${companyData.symbol}. Error: ${error.message}`,
      error: error.message
    };
  }
};

// Fetch FinGenie chat response
// ... rest of the code remains the same ...

// Export all functions
export default {
  getStockData,
  getMarketOverview,
  getStockChart,
  getStockFinancials,
  getLatestNews,
  getCompanyNews,
  getPeerComparison,
  getAIAnalysis
};
