// backend/middlewares/fastApiProxy.js
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

// FastAPI backend URL from environment variables
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

// Log the FastAPI URL being used
console.log(`Using FastAPI backend URL: ${FASTAPI_URL}`);

// Create proxy middleware for FastAPI
export const fastApiProxy = createProxyMiddleware({
  target: FASTAPI_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/fastapi': '', // Remove /api/fastapi prefix when forwarding
  },
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
});

// Routes to be handled by FastAPI
export const fastApiRoutes = [
  '/api/fastapi/market-data',
  '/api/fastapi/ai-analysis',
  '/api/fastapi/documents',
  '/api/fastapi/fingenie'
];
