import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

// Import cron scheduler
import { initializeCronJobs } from './utils/cronScheduler.js';

// Config
dotenv.config({ path: '../.env' }); // Ensure this path is correct for your .env file location

// Debug: Check if MONGODB_URI is loaded from .env
// console.log('Attempting to load MONGODB_URI from .env file specified in path.');
// console.log('Loaded MONGODB_URI:', process.env.MONGODB_URI);
// console.log('Loaded JWT_SECRET:', process.env.JWT_SECRET); // Also check JWT_SECRET

const app = express();
const PORT = process.env.PORT || 3002;

// Get MongoDB URI from environment variables with fallback
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fin-path-insight';

// Log which environment we're in
console.log(`Running in ${process.env.NODE_ENV || 'development'} mode`);
console.log('Attempting to connect to MongoDB...');

// Middleware
// For development, disable Helmet's Content Security Policy completely
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP completely for development
    xContentTypeOptions: false, // Disable X-Content-Type-Options for development
  })
);

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

// Connect to MongoDB and start server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    
    // Initialize cron jobs
    initializeCronJobs();
    console.log('Cron jobs initialized');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    console.log('Connection details (without credentials):');
    // Log connection details without exposing credentials
    const redactedURI = MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log(`- URI: ${redactedURI}`);
    console.log('- Error code:', err.code);
    console.log('- Error name:', err.name);
    
    if (err.message && err.message.includes('IP whitelist')) {
      console.log('\nPOSSIBLE SOLUTION: Add your IP address to MongoDB Atlas whitelist');
      console.log('1. Go to MongoDB Atlas > Security > Network Access');
      console.log('2. Click "+ ADD IP ADDRESS"');
      console.log('3. Click "ALLOW ACCESS FROM ANYWHERE" for testing');
      console.log('4. Wait for the change to be applied (1-2 minutes)');
      console.log('5. Restart this server');
    }
  });

export default app; 