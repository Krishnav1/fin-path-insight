import axios from 'axios';

// Express backend URL that proxies to FastAPI
// We'll use the Express backend URL and the proxy routes we set up
const EXPRESS_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3002';

// Create axios instance for FastAPI through Express proxy
const fastApiClient = axios.create({
  baseURL: EXPRESS_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Market Data API
export const marketDataApi = {
  // Get stock price
  getStockPrice: async (symbol) => {
    try {
      const response = await fastApiClient.get(`/api/fastapi/market-data/stock/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stock price:', error);
      throw error;
    }
  },

  // Get intraday data
  getIntradayData: async (symbol, interval = '5min') => {
    try {
      const response = await fastApiClient.get(`/api/fastapi/market-data/stock/${symbol}/intraday`, {
        params: { interval },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching intraday data:', error);
      throw error;
    }
  },

  // Get daily data
  getDailyData: async (symbol, outputsize = 'compact') => {
    try {
      const response = await fastApiClient.get(`/api/fastapi/market-data/stock/${symbol}/daily`, {
        params: { outputsize },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching daily data:', error);
      throw error;
    }
  },

  // Get company overview
  getCompanyOverview: async (symbol) => {
    try {
      const response = await fastApiClient.get(`/api/fastapi/market-data/stock/${symbol}/overview`);
      return response.data;
    } catch (error) {
      console.error('Error fetching company overview:', error);
      throw error;
    }
  },

  // Get market status
  getMarketStatus: async () => {
    try {
      const response = await fastApiClient.get('/api/fastapi/market-data/market/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching market status:', error);
      throw error;
    }
  },

  // Get Indian market overview
  getIndianMarketOverview: async () => {
    try {
      const response = await fastApiClient.get('/api/fastapi/market-data/indian-market/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching Indian market overview:', error);
      throw error;
    }
  },

  // Get index movers
  getIndexMovers: async (indexSymbol, topN = 5) => {
    try {
      const response = await fastApiClient.get(`/api/fastapi/market-data/indian-market/index-movers/${indexSymbol}`, {
        params: { top_n: topN },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching index movers:', error);
      throw error;
    }
  },
};

// AI Analysis API
export const aiAnalysisApi = {
  // Generate company analysis
  generateCompanyAnalysis: async (companyData) => {
    try {
      const response = await fastApiClient.post('/api/fastapi-ai-analysis/company', {
        companyData,
      });
      return response.data;
    } catch (error) {
      console.error('Error generating company analysis:', error);
      throw error;
    }
  },
};

// Document Processing API
export const documentApi = {
  // Upload document
  uploadDocument: async (file, description = '') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);

      const response = await fastApiClient.post('/api/fastapi/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  // Search documents
  searchDocuments: async (query, topK = 5) => {
    try {
      const response = await fastApiClient.post('/api/fastapi/documents/search', {
        query,
        top_k: topK,
      });
      return response.data;
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  },

  // List documents
  listDocuments: async () => {
    try {
      const response = await fastApiClient.get('/api/fastapi/documents/list');
      return response.data;
    } catch (error) {
      console.error('Error listing documents:', error);
      throw error;
    }
  },

  // Delete document
  deleteDocument: async (documentId) => {
    try {
      const response = await fastApiClient.delete(`/api/fastapi/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },
};

// FinGenie API
export const finGenieApi = {
  // Send chat message
  sendChatMessage: async (userId, message) => {
    try {
      const response = await fastApiClient.post('/api/fastapi-fingenie/chat', {
        userId,
        message,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  },

  // Clear conversation
  clearConversation: async (userId) => {
    try {
      const response = await fastApiClient.delete(`/api/fastapi-fingenie/conversations/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error clearing conversation:', error);
      throw error;
    }
  },
};
