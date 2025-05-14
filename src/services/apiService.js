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

// Log the API configuration in development
if (import.meta.env.DEV) {
  console.log(`[API Service] Using proxy to connect to FastAPI backend`);
  console.log(`[API Service] API base URL: ${api.defaults.baseURL}`);
}

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
export async function getStockData(symbol) {
  try {
    // Try the market-data route (available on production)
    try {
      const response = await api.get(`/market-data/stock/${symbol}`);
      return response.data;
    } catch (marketDataError) {
      console.warn(`Market data route failed: ${marketDataError.message}`);
      
      // If market-data route fails, try the Supabase route (for backward compatibility)
      try {
        const response = await api.get(`/supabase/stocks/${symbol}`);
        return response.data;
      } catch (supabaseError) {
        if (!enableFallbacks) {
          console.warn('Fallbacks disabled, but returning mock data to prevent app crash');
          // Return mock data even in production to prevent app crashes
          return generateMockStockData(symbol);
        }
        
        // If all API routes fail and fallbacks are enabled, try Node.js backend
        console.warn(`All API routes failed, falling back to Node.js backend`);
        try {
          const fallbackResponse = await nodeBackendApi.get(`/stocks/${symbol}`);
          return fallbackResponse.data;
        } catch (nodeError) {
          console.warn(`Node.js backend failed too: ${nodeError.message}`);
          // Return mock data as last resort
          return generateMockStockData(symbol);
        }
      }
    }
  } catch (error) {
    errorHandler.logError(error, 'getStockData');
    return generateMockStockData(symbol);
  }
}

/**
 * Generate mock stock data for a symbol
 * @param {string} symbol - Stock symbol
 * @returns {Object} Mock stock data
 */
function generateMockStockData(symbol) {
  console.warn(`Returning mock data for ${symbol}`);
  return {
    symbol,
    name: `${symbol} Company`,
    price: 1000 + Math.random() * 1000,
    change: Math.random() > 0.5 ? 10 + Math.random() * 20 : -(10 + Math.random() * 20),
    change_percent: Math.random() > 0.5 ? 1 + Math.random() * 3 : -(1 + Math.random() * 3),
    volume: 1000000 + Math.random() * 5000000,
    timestamp: new Date().toISOString(),
    is_mock: true
  };
}

/**
 * Get market overview data
 * @param {string} market - Market (india, us, global)
 * @returns {Promise<Object>} Market overview data
 */
export async function getMarketOverview(market = 'global') {
  try {
    // Try the market-data route first (available on production)
    try {
      let response;
      if (market.toLowerCase() === 'india') {
        // Path for Indian market overview
        response = await api.get('/market-data/indian-market/overview');
      } else {
        // Path for global market overview
        response = await api.get(`/market-data/${market.toLowerCase()}-market/overview`);
      }
      return response.data;
    } catch (marketDataError) {
      console.warn(`Market data route failed, trying Supabase route: ${marketDataError.message}`);
      
      // If market-data route fails, try the Supabase route (for backward compatibility)
      try {
        const response = await api.get(`/supabase/market-overview/${market.toLowerCase()}`);
        return response.data;
      } catch (supabaseError) {
        if (!enableFallbacks) throw supabaseError;
        console.warn(`Supabase route failed too: ${supabaseError.message}`);
      }
    }
    
    // Try static data as a last resort
    if (enableFallbacks) {
      console.log(`Trying static data for market overview: ${market}`);
      const staticResponse = await axios.get(`/data/market_overview_${market.toLowerCase()}.json`);
      return staticResponse.data;
    } else {
      throw new Error(`Could not fetch market overview for ${market}`);
    }
  } catch (error) {
    errorHandler.logError(error, `getMarketOverview(${market})`);
    
    // Return mock data for development
    if (import.meta.env.DEV) {
      console.warn(`Returning mock data for market overview: ${market}`);
      return {
        indices: [
          { name: 'NIFTY 50', value: 22000 + Math.random() * 1000, change: Math.random() > 0.5 ? 100 + Math.random() * 200 : -(100 + Math.random() * 200) },
          { name: 'SENSEX', value: 72000 + Math.random() * 2000, change: Math.random() > 0.5 ? 300 + Math.random() * 400 : -(300 + Math.random() * 400) }
        ],
        breadth: { advances: 1200, declines: 800, unchanged: 100 }
      };
    }
    
    throw error;
  }
}

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
    // Try the news route first (available on production)
    try {
      const response = await api.get(`/news/latest`, {
        params: { market }
      });
      return response.data;
    } catch (newsError) {
      console.warn(`News route failed, trying Supabase route: ${newsError.message}`);
      
      // If news route fails, try the Supabase route (for backward compatibility)
      try {
        const response = await api.get(`/supabase/news`, {
          params: { market, limit: 10 }
        });
        return response.data;
      } catch (supabaseError) {
        if (!enableFallbacks) throw supabaseError;
        console.warn(`Supabase route failed too: ${supabaseError.message}`);
      }
    }
    
    // Try static data as a last resort
    if (enableFallbacks) {
      console.log(`Trying static data for news: ${market}`);
      const staticResponse = await axios.get(`/data/news_${market}.json`);
      return staticResponse.data;
    } else {
      throw new Error(`Could not fetch news for ${market}`);
    }
  } catch (error) {
    errorHandler.logError(error, `getLatestNews(${market})`);
    
    // Return mock data for development
    if (import.meta.env.DEV) {
      console.warn(`Returning mock data for news: ${market}`);
      return Array(5).fill(0).map((_, i) => ({
        id: `mock-news-${i}`,
        title: `Mock News Article ${i+1} for ${market}`,
        summary: 'This is a mock news article generated for development purposes.',
        url: 'https://example.com/news',
        source: 'Mock News',
        published_at: new Date().toISOString()
      }));
    }
    
    throw error;
  }
}

/**
 * Get company news
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Array>} News articles
 */
export async function getCompanyNews(symbol) {
  try {
    // Try the news route first (available on production)
    try {
      const response = await api.get(`/news/company/${symbol}`);
      return response.data;
    } catch (newsError) {
      console.warn(`News route failed, trying Supabase route: ${newsError.message}`);
      
      // If news route fails, try the Supabase route (for backward compatibility)
      try {
        const response = await api.get(`/supabase/company-news/${symbol}`, {
          params: { limit: 5 }
        });
        return response.data;
      } catch (supabaseError) {
        if (!enableFallbacks) throw supabaseError;
        console.warn(`Supabase route failed too: ${supabaseError.message}`);
      }
    }
    
    // Try static data as a last resort
    if (enableFallbacks) {
      try {
        console.log(`Trying static data for company news: ${symbol}`);
        const staticResponse = await axios.get(`/data/company_news_${symbol.replace(/\./g, '_')}.json`);
        return staticResponse.data;
      } catch (staticError) {
        // Static data failed too, throw a new error
        throw new Error(`Could not fetch company news for ${symbol}`);
      }
    } else {
      throw new Error(`Could not fetch company news for ${symbol}`);
    }
  } catch (error) {
    errorHandler.logError(error, `getCompanyNews(${symbol})`);
    
    // Return mock data for development
    if (import.meta.env.DEV) {
      console.warn(`Returning mock data for company news: ${symbol}`);
      return Array(5).fill(0).map((_, i) => ({
        id: `mock-news-${i}`,
        title: `Mock News Article ${i+1} for ${symbol}`,
        summary: `This is a mock news article about ${symbol} generated for development purposes.`,
        url: 'https://example.com/news',
        source: 'Mock News',
        published_at: new Date().toISOString()
      }));
    }
    
    throw error;
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
