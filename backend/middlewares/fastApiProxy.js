// backend/middlewares/fastApiProxy.js
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

// FastAPI backend URL from environment variables
const FASTAPI_URL = process.env.FASTAPI_URL || 'https://fin-path-insight-fastapi.onrender.com';

// Log the FastAPI URL being used
console.log(`Using FastAPI backend URL: ${FASTAPI_URL}`);

// Create proxy middleware for FastAPI
export const fastApiProxy = createProxyMiddleware({
  target: FASTAPI_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/fastapi': '/api', // Rewrite path to match FastAPI routes
  },
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  onError: (err, req, res) => {
    console.error(`Proxy error: ${err.message}`);
    res.status(502).json({
      status: 'error',
      message: 'FastAPI service unavailable',
      error: err.message
    });
  }
});

// Routes to be handled by FastAPI
export const fastApiRoutes = [
  '/api/fastapi/market-data',
  '/api/fastapi/ai-analysis',
  '/api/fastapi/documents',
  '/api/fastapi/fingenie',
  '/api/market-data',
  '/api/ai-analysis',
  '/api/documents',
  '/api/fingenie',
  '/api/indian-market/overview',
  '/api/market-data/stock',
  '/api/market-data/indian-market/overview'
];
