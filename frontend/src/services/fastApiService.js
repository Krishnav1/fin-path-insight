import axios from 'axios';
import { setupAxiosInterceptors, handleApiError } from '../utils/errorHandler';

// Get API configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || 'https://fin-path-insight-fastapi.onrender.com';
const API_ENVIRONMENT = import.meta.env.VITE_API_ENVIRONMENT || 'development';
const ENABLE_FALLBACK = import.meta.env.VITE_ENABLE_FALLBACK_APIS === 'true';

// Fallback URLs if the main one fails
const FALLBACK_URLS = [
  FASTAPI_URL,
  API_BASE_URL,
  'https://fininsight.onrender.com',
  'https://fin-path-insight-fastapi.onrender.com'
].filter((url, index, self) => url && self.indexOf(url) === index); // Remove duplicates and empty values

console.log(`Using API base URL: ${API_BASE_URL} in ${API_ENVIRONMENT} environment`);
console.log(`FastAPI URL: ${FASTAPI_URL}`);
console.log(`Fallback enabled: ${ENABLE_FALLBACK}`);
console.log(`Available fallbacks: ${FALLBACK_URLS.length}`);

// Map of endpoints to their preferred service
const API_ENDPOINT_MAP = {
  // Market data endpoints - prefer FastAPI
  '/api/market-data/': FASTAPI_URL,
  '/api/market-data/stock/': FASTAPI_URL,
  '/api/market-data/indian-market/overview': FASTAPI_URL,
  
  // AI analysis endpoints - prefer FastAPI
  '/api/ai-analysis/': FASTAPI_URL,
  
  // Document processing endpoints - prefer Node.js backend
  '/api/documents/': API_BASE_URL,
  
  // FinGenie endpoints - try both
  '/api/fingenie/': API_BASE_URL
};

// Get the preferred base URL for a specific endpoint
const getPreferredBaseUrl = (endpoint) => {
  // Find the matching endpoint prefix in our map
  const matchingPrefix = Object.keys(API_ENDPOINT_MAP).find(prefix => 
    endpoint.startsWith(prefix)
  );
  
  // Return the preferred URL if found, otherwise use the default API_BASE_URL
  return matchingPrefix ? API_ENDPOINT_MAP[matchingPrefix] : API_BASE_URL;
};

// Retry logic for failed requests
const retryRequest = async (apiCall, endpoint, maxRetries = 2) => {
  let lastError;
  
  // Determine the preferred base URL for this endpoint
  const preferredUrl = getPreferredBaseUrl(endpoint);
  
  // Try with the preferred URL first
  try {
    // Create a client with the preferred URL
    const preferredClient = axios.create({
      baseURL: preferredUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000 // Increased timeout for potentially slow services
    });
    
    // Setup error handling for this client
    setupAxiosInterceptors(preferredClient);
    
    return await apiCall(preferredClient);
  } catch (error) {
    lastError = error;
    console.warn(`Request to ${preferredUrl}${endpoint} failed:`, error.message);
    
    // If fallbacks are disabled, throw the error immediately
    if (!ENABLE_FALLBACK) {
      throw error;
    }
    
    console.warn('Trying fallback URLs...');
  }
  
  // Generate a list of fallback URLs excluding the one we just tried
  const fallbacks = FALLBACK_URLS.filter(url => url !== preferredUrl);
  
  // Try with fallback URLs if main one fails
  for (let i = 0; i < Math.min(maxRetries, fallbacks.length); i++) {
    try {
      // Create a temporary client with the fallback URL
      const tempClient = axios.create({
        baseURL: fallbacks[i],
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });
      
      // Setup error handling for this client
      setupAxiosInterceptors(tempClient);
      
      console.log(`Trying fallback #${i+1}: ${fallbacks[i]}${endpoint}`);
      return await apiCall(tempClient);
    } catch (error) {
      lastError = error;
      console.warn(`Fallback ${i+1} failed:`, error.message);
    }
  }
  
  // If all attempts fail, throw the last error
  console.error(`All API attempts failed for endpoint: ${endpoint}`);
  throw lastError;
};

// Create axios instance with environment-specific configuration
const fastApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout for better error handling
  timeout: 10000, // 10 seconds
});

// Setup global error handling interceptors
setupAxiosInterceptors(fastApiClient);

// Market Data API
export const marketDataApi = {
  // Get stock price
  getStockPrice: async (symbol) => {
    const endpoint = `/api/market-data/stock/${symbol}`;
    try {
      const response = await retryRequest(async (client) => {
        return await client.get(endpoint);
      }, endpoint);
      return response.data;
    } catch (error) {
      const processedError = handleApiError(error, 'Error fetching stock price');
      throw processedError;
    }
  },

  // Get intraday data
  getIntradayData: async (symbol, interval = '5min') => {
    const endpoint = `/api/market-data/stock/${symbol}/intraday`;
    try {
      const response = await retryRequest(async (client) => {
        return await client.get(endpoint, {
          params: { interval },
        });
      }, endpoint);
      return response.data;
    } catch (error) {
      const processedError = handleApiError(error, 'Error fetching intraday data');
      throw processedError;
    }
  },

  // Get daily data
  getDailyData: async (symbol, outputsize = 'compact') => {
    const endpoint = `/api/market-data/stock/${symbol}/daily`;
    try {
      const response = await retryRequest(async (client) => {
        return await client.get(endpoint, {
          params: { outputsize },
        });
      }, endpoint);
      return response.data;
    } catch (error) {
      const processedError = handleApiError(error, 'Error fetching daily data');
      throw processedError;
    }
  },

  // Get company overview
  getCompanyOverview: async (symbol) => {
    const endpoint = `/api/market-data/stock/${symbol}/overview`;
    try {
      const response = await retryRequest(async (client) => {
        return await client.get(endpoint);
      }, endpoint);
      return response.data;
    } catch (error) {
      const processedError = handleApiError(error, 'Error fetching company overview');
      throw processedError;
    }
  },

  // Get market status
  getMarketStatus: async () => {
    const endpoint = '/api/market-data/market/status';
    try {
      const response = await retryRequest(async (client) => {
        return await client.get(endpoint);
      }, endpoint);
      return response.data;
    } catch (error) {
      const processedError = handleApiError(error, 'Error fetching market status');
      throw processedError;
    }
  },

  // Get Indian market overview
  getIndianMarketOverview: async () => {
    const endpoint = '/api/market-data/indian-market/overview';
    try {
      const response = await retryRequest(async (client) => {
        return await client.get(endpoint);
      }, endpoint);
      return response.data;
    } catch (error) {
      const processedError = handleApiError(error, 'Error fetching Indian market overview');
      throw processedError;
    }
  },

  // Get index movers
  getIndexMovers: async (indexSymbol, topN = 5) => {
    const endpoint = `/api/market-data/index/${indexSymbol}/movers`;
    try {
      const response = await retryRequest(async (client) => {
        return await client.get(endpoint, {
          params: { top_n: topN },
        });
      }, endpoint);
      return response.data;
    } catch (error) {
      const processedError = handleApiError(error, 'Error fetching index movers');
      throw processedError;
    }
  },
};

// AI Analysis API
export const aiAnalysisApi = {
  // Generate company analysis
  generateCompanyAnalysis: async (companyData) => {
    const endpoint = '/api/ai-analysis/company';
    try {
      const response = await retryRequest(async (client) => {
        return await client.post(endpoint, {
          companyData
        });
      }, endpoint);
      return response.data;
    } catch (error) {
      const processedError = handleApiError(error, 'Error generating company analysis');
      throw processedError;
    }
  },
};

// Document Processing API
export const documentApi = {
  // Upload document
  uploadDocument: async (file, description = '') => {
    const endpoint = '/api/documents/upload';
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);
      
      const response = await retryRequest(async (client) => {
        return await client.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }, endpoint);
      return response.data;
    } catch (error) {
      const processedError = handleApiError(error, 'Error uploading document');
      throw processedError;
    }
  },

  // Search documents
  searchDocuments: async (query, topK = 5) => {
    const endpoint = '/api/documents/search';
    try {
      const response = await retryRequest(async (client) => {
        return await client.post(endpoint, {
          query,
          top_k: topK
        });
      }, endpoint);
      return response.data;
    } catch (error) {
      const processedError = handleApiError(error, 'Error searching documents');
      throw processedError;
    }
  },

  // List documents
  listDocuments: async () => {
    const endpoint = '/api/documents/list';
    try {
      const response = await retryRequest(async (client) => {
        return await client.get(endpoint);
      }, endpoint);
      return response.data;
    } catch (error) {
      const processedError = handleApiError(error, 'Error listing documents');
      throw processedError;
    }
  },

  // Delete document
  deleteDocument: async (documentId) => {
    const endpoint = `/api/documents/${documentId}`;
    try {
      const response = await retryRequest(async (client) => {
        return await client.delete(endpoint);
      }, endpoint);
      return response.data;
    } catch (error) {
      const processedError = handleApiError(error, 'Error deleting document');
      throw processedError;
    }
  },
};

// FinGenie API
export const finGenieApi = {
  // Send chat message
  sendChatMessage: async (userId, message) => {
    const endpoint = '/api/fingenie/chat';
    try {
      const response = await retryRequest(async (client) => {
        return await client.post(endpoint, {
          user_id: userId,
          message
        });
      }, endpoint);
      return response.data;
    } catch (error) {
      const processedError = handleApiError(error, 'Error communicating with FinGenie API');
      throw processedError;
    }
  },

  // Clear conversation
  clearConversation: async (userId) => {
    const endpoint = `/api/fingenie/conversations/${userId}`;
    try {
      const response = await retryRequest(async (client) => {
        return await client.delete(endpoint);
      }, endpoint);
      return response.data;
    } catch (error) {
      const processedError = handleApiError(error, 'Error clearing conversation');
      throw processedError;
    }
  },
};
