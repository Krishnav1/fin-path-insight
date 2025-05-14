import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fastApiProxy, fastApiRoutes } from './middlewares/fastApiProxy.js';

// Routes
import stockRoutes from './routes/stockRoutes.js';
import cryptoRoutes from './routes/cryptoRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import indianStockRoutes from './routes/indianStockRoutes.js';
import indianMarketRoutes from './routes/indianMarketRoutes.js';
import fingenieRoutes from './routes/fingenieRoutes.js';
import knowledgeBaseRoutes from './routes/knowledgeBaseRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiAnalysisRoutes from './routes/aiAnalysisRoutes.js';
import supabaseRoutes from './routes/supabaseRoutes.js';

// Import cron scheduler
import { initializeCronJobs } from './utils/cronScheduler.js';

// Config
dotenv.config({ path: '../.env' }); // Ensure this path is correct for your .env file location

// Check if Supabase environment variables are loaded
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables not found. Using default values.');
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://ydakwyplcqoshxcdllah.supabase.co';
  process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYWt3eXBsY3Fvc2h4Y2RsbGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTAwNTMsImV4cCI6MjA2Mjc4NjA1M30.J0c0YqSsR9XbtbYLVOq6oqQwYQ3G7j65Q0stEtS4W2s';
}

const app = express();
const PORT = process.env.PORT || 3002;

// Log which environment we're in
console.log(`Running in ${process.env.NODE_ENV || 'development'} mode`);
console.log(`Supabase URL: ${process.env.SUPABASE_URL}`);

// Middleware
// For development, disable Helmet's Content Security Policy completely
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP completely for development
    xContentTypeOptions: false, // Disable X-Content-Type-Options for development
  })
);

// Add FastAPI URL to environment variables
process.env.FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
console.log(`FastAPI backend URL: ${process.env.FASTAPI_URL}`);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use('/data', express.static(join(__dirname, 'public/data')));
app.use('/assets', express.static(join(__dirname, 'public/assets'))); // Serve assets from public/assets
app.use(express.static(join(__dirname, 'public'))); // Serve files directly from public directory

// API Routes
app.use('/api/stocks', stockRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/indian-stocks', indianStockRoutes);
app.use('/api/indian-market', indianMarketRoutes);

// Use FinGenie routes
app.use('/api/fingenie', fingenieRoutes);

// Use Knowledge Base routes
app.use('/api/knowledge-base', knowledgeBaseRoutes);
console.log('Knowledge base routes enabled');

// Use Admin routes
app.use('/api/admin', adminRoutes);
console.log('Admin routes enabled');

// Use AI Analysis routes
app.use('/api/ai-analysis', aiAnalysisRoutes);
console.log('AI Analysis routes enabled');

// Use Supabase routes
app.use('/api/supabase', supabaseRoutes);
console.log('Supabase routes enabled');

// FastAPI proxy routes
// Apply the proxy middleware to each FastAPI route
fastApiRoutes.forEach(route => {
  app.use(route, fastApiProxy);
  console.log(`FastAPI proxy route enabled: ${route}`);
});

// Special route for the new AI Analysis using FastAPI
app.use('/api/fastapi-ai-analysis', createProxyMiddleware({
  target: process.env.FASTAPI_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/fastapi-ai-analysis': '/api/ai-analysis',
  },
}));
console.log('FastAPI AI Analysis route enabled');

// Special route for the new FinGenie using FastAPI
app.use('/api/fastapi-fingenie', createProxyMiddleware({
  target: process.env.FASTAPI_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/fastapi-fingenie': '/api/fingenie',
  },
}));
console.log('FastAPI FinGenie route enabled');

// Fallback middleware for missing assets
app.use('/assets/*', (req, res) => {
  console.log(`Asset not found: ${req.originalUrl}`);
  // Return a 1x1 transparent GIF for images or empty response for other assets
  if (req.originalUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.type('image/gif').send(transparentGif);
  } else if (req.originalUrl.match(/\.(woff|woff2|ttf|eot|otf)$/i)) {
    // For fonts, return an empty response with the correct content type
    res.type(req.originalUrl.match(/\.([^.]+)$/)[1]).send('');
  } else {
    res.type('text/plain').send('');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message,
  });
});

// Check Supabase connection on startup
const checkSupabaseConnection = async () => {
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/health_check?select=*&limit=1`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Connected to Supabase successfully');
      return true;
    } else {
      console.error('❌ Failed to connect to Supabase:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
};

// Function to start the server
const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
    
    // Initialize cron jobs after server starts
    if (process.env.NODE_ENV === 'production') {
      initializeCronJobs();
      console.log('Cron jobs initialized for production environment');
    } else {
      console.log('Cron jobs not initialized in development environment');
    }
  });
};

// Check Supabase connection and start server
checkSupabaseConnection()
  .then(connected => {
    if (!connected) {
      console.warn('Starting server without Supabase connection. Some features may not work.');
    }
    startServer();
  })
  .catch(err => {
    console.error('Unhandled error in server startup:', err);
    startServer();
  });

export default app;