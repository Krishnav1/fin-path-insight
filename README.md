# FinPath Insight

A production-ready financial market analysis platform with FastAPI backend, React frontend, and Supabase database integration. Enhanced with Financial Modeling Prep (FMP) data, NewsAPI integration, and AI-powered analysis using Google Gemini.

## Features

1. **Market Data**: Real-time and historical stock data for Indian and global markets using FMP and yfinance with robust error handling and rate limiting
2. **AI Analysis**: Professional-grade company analysis reports using Google Gemini with structured insights
3. **FinGenie Chatbot**: AI-powered financial assistant for answering investment questions with enhanced capabilities
4. **News Integration**: Real-time financial news from NewsAPI with semantic search capabilities
5. **Interactive Charts**: Visualizations including KLINE charts, valuation comparisons, and sentiment analysis
6. **Supabase Caching**: Efficient data caching to reduce API calls and improve performance
7. **Health Monitoring**: Comprehensive health check endpoints for monitoring system status
8. **Request Validation**: Robust request validation to prevent 422 Unprocessable Entity errors

## Tech Stack

1. **Frontend**: React with TypeScript, Tailwind CSS, and shadcn/ui components
2. **Backend**: FastAPI with Python for AI and data processing
3. **Database**: Supabase for structured data storage and caching
4. **AI Integration**: Google Gemini Pro for analysis and chat
5. **Data Sources**: Financial Modeling Prep (FMP), yfinance, and NewsAPI with fallback mechanisms
6. **Vector Database**: Pinecone for semantic search capabilities
7. **Visualization**: Plotly for interactive financial charts
8. **Deployment**: Netlify (frontend) and Render (backend)
9. **Middleware**: Custom middleware for request timeouts and response formatting

## Project Structure

```
fin-path-insight/
├── src/                  # Frontend React application
├── fastapi-backend/      # FastAPI backend
│   ├── app/              # Main application code
│   │   ├── api/          # API routes
│   │   │   ├── routes/   # API route handlers
│   │   │   └── deps.py   # Dependency injection
│   │   ├── core/         # Core functionality
│   │   │   └── config.py # Application settings
│   │   ├── db/           # Database connections
│   │   ├── middleware/   # Custom middleware
│   │   ├── models/       # Data models
│   │   │   ├── schemas.py # Pydantic models
│   │   │   └── validators.py # Request validators
│   │   ├── scripts/      # Utility scripts
│   │   │   └── update_database.py # Database setup
│   │   └── utils/        # Utility functions
│   │       ├── fmp_client.py # Financial data client
│   │       └── supabase_cache.py # Caching utilities
│   ├── setup_database.sql # Database schema
│   ├── requirements.txt  # Python dependencies
│   ├── test_api.py       # API testing script
│   └── .env              # Backend environment variables
├── public/               # Static assets
└── .env                  # Root environment variables
```

## Setup Instructions

### Prerequisites

1. Node.js (v16+) and npm
2. Python 3.9+
3. Supabase account

### Environment Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd fin-path-insight
   ```

2. Set up environment variables:
   ```bash
   # For backend
   cd fastapi-backend
   cp .env.template .env
   # Edit .env with your API keys and configuration
   ```

   Required environment variables:
   - SUPABASE_URL (Supabase project URL)
   - SUPABASE_ANON_KEY (Supabase anonymous key)
   - SUPABASE_TTL_CACHE (Cache time-to-live in seconds, e.g., 3600)
   - FMP_API_KEY (Financial Modeling Prep)
   - NEWS_API_KEY (NewsAPI)
   - GEMINI_API_KEY (Google AI Studio)
   - PINECONE_API_KEY (Pinecone)
   - PORT (Server port, default: 8000)
   - NODE_ENV (Environment: development/production)

3. Install frontend dependencies:
   ```bash
   npm install
   ```

4. Install backend dependencies:
   ```bash
   cd fastapi-backend
   pip install -r requirements.txt
   ```

### Running the Application

1. Start the FastAPI backend:
   ```bash
   cd fastapi-backend
   python -m uvicorn app.main:app --reload --port 8000
   ```

2. In a separate terminal, start the frontend:
   ```bash
   npm run dev
   ```

3. Access the application:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## API Testing

Run the test script to verify all API endpoints are working correctly. This script will also set up the necessary database tables in Supabase:

```bash
cd fastapi-backend
python test_api.py
```

The script automatically:
1. Sets up the required database tables if they don't exist
2. Starts the FastAPI server if it's not running
3. Tests all API endpoints and provides a summary report

Key endpoints to test:

1. Health Checks: 
   - `/api/health` - Overall health
   - `/api/health/ready` - Readiness check
   - `/api/health/live` - Liveness check

2. Market Data:
   - `/api/market-data/stock/RELIANCE.NS` - Stock data
   - `/api/market-data/indian-market/overview` - Market overview
   - `/api/market-data/indian-market/index-movers/NIFTY50` - Index movers

3. Supabase Data:
   - `/api/supabase/health` - Supabase connection check
   - `/api/supabase/stocks/RELIANCE.NS` - Cached stock data
   - `/api/supabase/market-overview/india` - Cached market overview

4. News:
   - `/api/news/latest` - Latest news
   - `/api/news/company/RELIANCE.NS` - Company news
   - `/api/news/semantic-search?query=market` - Semantic search

5. Analysis:
   - `/api/analysis/stock/RELIANCE.NS` - Stock analysis
   - `/api/analysis/technical/RELIANCE.NS` - Technical analysis
   - `/api/analysis/charts/RELIANCE.NS` - Charts

6. AI:
   - `/api/fingenie/chat` (POST) - FinGenie chat

## Deployment

### Frontend (Netlify)

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Backend (Render)

1. Create a new Web Service in Render
2. Connect to your GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all required environment variables in Render dashboard
6. Set the following advanced options:
   - Auto-Deploy: Yes
   - Health Check Path: `/api/health/live`
   - Request Timeout: 60s (to handle longer API requests)
   - Initial Instance Count: 1 (can scale as needed)

**Important:** After deployment, run the database setup by making a request to `/api/health/ready` which will check and create the necessary tables.

## Best Practices

1. **Environment Configuration**:
   - Keep a single `.env` file in the root directory
   - Use `.env.example` for documentation
   - Never commit sensitive keys to version control

2. **API Service Organization**:
   - Group related API calls together
   - Use consistent error handling
   - Implement graceful fallbacks with retries and timeouts

3. **FastAPI + Supabase Integration**:
   - Use async/await for all database operations
   - Keep database logic separate from route handlers
   - Add proper error handling and structured logging
   - Implement efficient caching to reduce API calls

4. **Testing and Monitoring**:
   - Use comprehensive health check endpoints for different components
   - Implement structured logging with context information
   - Use try/catch blocks consistently with proper error messages
   - Add request validation to prevent 422 errors

5. **Performance Optimization**:
   - Implement caching for frequently accessed data
   - Use connection pooling for database operations
   - Add request timeouts to prevent hanging requests
   - Batch API requests to avoid rate limiting

6. **Deployment Considerations**:
   - Set appropriate timeouts for long-running operations
   - Configure health checks for automatic recovery
   - Use environment-specific configurations
   - Implement graceful startup and shutdown procedures

## License

MIT
