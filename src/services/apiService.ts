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

const enableFallbacks = import.meta.env.VITE_ENABLE_FALLBACK_APIS === 'true';

api.interceptors.request.use(
  (config) => {
    config.headers['X-Environment'] = import.meta.env.MODE;
    config.headers['X-Client-Version'] = import.meta.env.VITE_APP_VERSION || '1.0.0';
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

api.interceptors.response.use(
  (response) => {
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

export async function getStockData(symbol: string) {
  try {
    try {
      const response = await api.get(`/market-data/stock/${symbol}`);
      return response.data;
    } catch (marketDataError: any) {
      console.warn(`Market data route failed: ${marketDataError.message}`);
      try {
        const response = await api.get(`/supabase/stocks/${symbol}`);
        return response.data;
      } catch (supabaseError) {
        if (!enableFallbacks) {
          throw supabaseError;
        }
        // fallback logic or mock
      }
    }
  } catch (error) {
    errorHandler.logError(error, 'getStockData');
    return null;
  }
}

export async function getMarketOverview(market: string = 'global') {
  try {
    const response = await api.get(`/markw/${market}`);
    return response.data;
  } catch (error) {
    errorHandler.logError(error, 'getMarketOverview');
    return null;
  }
}

export async function getStockChart(symbol: string, interval: string = '5min', timespan: string = '1day') {
  try {
    const response = await api.get(`/market-data/chart/${symbol}?interval=${interval}&timespan=${timespan}`);
    return response.data;
  } catch (error) {
    errorHandler.logError(error, 'getStockChart');
    return null;
  }
}

export async function getStockFinancials(symbol: string) {
  try {
    const response = await api.get(`/market-data/financials/${symbol}`);
    return response.data;
  } catch (error) {
    errorHandler.logError(error, 'getStockFinancials');
    return null;
  }
}

export async function getLatestNews(market: string = 'global') {
  try {
    const response = await api.get(`/market-data/news/${market}`);
    return response.data;
  } catch (error) {
    errorHandler.logError(error, 'getLatestNews');
    return [];
  }
}

export async function getCompanyNews(symbol: string) {
  try {
    const response = await api.get(`/market-data/news/company/${symbol}`);
    return response.data;
  } catch (error) {
    errorHandler.logError(error, 'getCompanyNews');
    return [];
  }
}

export async function getPeerComparison(symbol: string, sector: string | null = null) {
  try {
    const response = await api.get(`/market-data/peers/${symbol}${sector ? `?sector=${sector}` : ''}`);
    return response.data;
  } catch (error) {
    errorHandler.logError(error, 'getPeerComparison');
    return [];
  }
}

export async function getAIAnalysis(companyData: any) {
  try {
    const response = await api.post('/market-data/ai-analysis', companyData);
    return response.data;
  } catch (error) {
    errorHandler.logError(error, 'getAIAnalysis');
    return null;
  }
}
