import axios from 'axios';
import { setupAxiosInterceptors, handleApiError } from '../utils/errorHandler';

// Get API configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://fininsight.onrender.com';
const API_ENVIRONMENT = import.meta.env.VITE_API_ENVIRONMENT || 'production';
const ENABLE_ERROR_MONITORING = import.meta.env.VITE_ENABLE_ERROR_MONITORING === 'true';

console.log(`Using API base URL: ${API_BASE_URL} in ${API_ENVIRONMENT} environment`);
console.log(`Error monitoring enabled: ${ENABLE_ERROR_MONITORING}`);

// Create axios instance with environment-specific configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout for better error handling
  timeout: 15000, // 15 seconds
});

// Setup global error handling interceptors
setupAxiosInterceptors(apiClient);

// Simple request function with error handling
const makeRequest = async (method, endpoint, data = null, params = null) => {
  try {
    const config = {
      method,
      url: endpoint,
    };
    
    if (params) {
      config.params = params;
    }
    
    if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
      config.data = data;
    }
    
    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    const processedError = handleApiError(error, `Error in ${method.toUpperCase()} request to ${endpoint}`);
    throw processedError;
  }
};

// Market Data API
export const marketDataApi = {
  // Get stock price
  getStockPrice: async (symbol) => {
    const endpoint = `/api/market-data/stock/${symbol}`;
    return makeRequest('get', endpoint);
  },

  // Get intraday data
  getIntradayData: async (symbol, interval = '5min') => {
    const endpoint = `/api/market-data/stock/${symbol}/intraday`;
    return makeRequest('get', endpoint, null, { interval });
  },

  // Get daily data
  getDailyData: async (symbol, outputsize = 'compact') => {
    const endpoint = `/api/market-data/stock/${symbol}/daily`;
    return makeRequest('get', endpoint, null, { outputsize });
  },

  // Get company overview
  getCompanyOverview: async (symbol) => {
    const endpoint = `/api/market-data/stock/${symbol}/overview`;
    return makeRequest('get', endpoint);
  },

  // Get market status
  getMarketStatus: async () => {
    const endpoint = '/api/market-data/market/status';
    return makeRequest('get', endpoint);
  },

  // Get Indian market overview
  getIndianMarketOverview: async () => {
    const endpoint = '/api/market-data/indian-market/overview';
    return makeRequest('get', endpoint);
  },

  // Get index movers
  getIndexMovers: async (indexSymbol, topN = 5) => {
    const endpoint = `/api/market-data/index/${indexSymbol}/movers`;
    return makeRequest('get', endpoint, null, { limit: topN });
  },

  // Get stock peers
  getStockPeers: async (symbol, limit = 5) => {
    const endpoint = `/api/stocks/${symbol}/peers`;
    return makeRequest('get', endpoint, null, { limit });
  },
};

// AI Analysis API
export const aiAnalysisApi = {
  // Generate company analysis
  generateCompanyAnalysis: async (companyData) => {
    const endpoint = '/api/ai-analysis/company';
    return makeRequest('post', endpoint, companyData);
  },
};

// Document Processing API
export const documentApi = {
  // Upload document
  uploadDocument: async (file, description = '') => {
    const endpoint = '/api/documents/upload';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    
    // Special case for file uploads with FormData
    try {
      const response = await apiClient.post(endpoint, formData);
      return response.data;
    } catch (error) {
      const processedError = handleApiError(error, 'Error uploading document');
      throw processedError;
    }
  },

  // Search documents
  searchDocuments: async (query, topK = 5) => {
    const endpoint = '/api/documents/search';
    return makeRequest('post', endpoint, { query, top_k: topK });
  },

  // List documents
  listDocuments: async () => {
    const endpoint = '/api/documents/list';
    return makeRequest('get', endpoint);
  },

  // Delete document
  deleteDocument: async (documentId) => {
    const endpoint = `/api/documents/${documentId}`;
    return makeRequest('delete', endpoint);
  },
};

// FinGenie API
export const finGenieApi = {
  // Send chat message
  sendChatMessage: async (userId, message) => {
    const endpoint = '/api/fingenie/chat';
    return makeRequest('post', endpoint, { user_id: userId, message });
  },

  // Clear conversation
  clearConversation: async (userId) => {
    const endpoint = `/api/fingenie/conversations/${userId}`;
    return makeRequest('delete', endpoint);
  },
};
