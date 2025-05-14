# FinPath Insight

A comprehensive financial market analysis platform with FastAPI backend, React frontend, and Supabase database integration. Enhanced with Financial Modeling Prep (FMP) data, NewsAPI integration, and AI-powered analysis using Google Gemini.

## Features

1. **Market Data**: Real-time and historical stock data for Indian and global markets using FMP and yfinance
2. **AI Analysis**: Professional-grade company analysis reports using Google Gemini with structured insights
3. **FinGenie Chatbot**: AI-powered financial assistant for answering investment questions with enhanced capabilities
4. **News Integration**: Real-time financial news from NewsAPI with semantic search capabilities
5. **Interactive Charts**: Visualizations including KLINE charts, valuation comparisons, and sentiment analysis
6. **Document Processing**: Extract and analyze data from financial documents
7. **User Authentication**: Secure login and personalized watchlists

## Tech Stack

1. **Frontend**: React with TypeScript, Tailwind CSS, and shadcn/ui components
2. **Backend**: FastAPI with Python for AI and data processing
3. **Database**: Supabase for structured data storage and caching
4. **AI Integration**: Google Gemini Pro for analysis and chat
5. **Data Sources**: Financial Modeling Prep (FMP), yfinance, and NewsAPI
6. **Vector Database**: Pinecone for semantic search capabilities
7. **Visualization**: Plotly for interactive financial charts
8. **Deployment**: Netlify (frontend) and Render (backend)

## Project Structure

```
fin-path-insight/
├── src/                  # Frontend React application
├── fastapi-backend/      # FastAPI backend
│   ├── app/              # Main application code
│   │   ├── api/          # API routes
│   │   ├── core/         # Core functionality
│   │   ├── db/           # Database connections
│   │   ├── models/       # Data models
│   │   └── utils/        # Utility functions
│   ├── requirements.txt  # Python dependencies
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

   Required API keys:
   - GEMINI_API_KEY (Google AI Studio)
   - PINECONE_API_KEY (Pinecone)
   - FMP_API_KEY (Financial Modeling Prep)
   - NEWS_API_KEY (NewsAPI)

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

Run the test script to verify all API endpoints are working correctly:

```bash
cd fastapi-backend
python test_api.py
```

Key endpoints to test:

1. Stock Data: `/api/market-data/stock/RELIANCE.NS`
2. Market Overview: `/api/market-data/indian-market/overview`
3. News: `/api/news/latest?market=india`
4. Company News: `/api/news/company/RELIANCE.NS`
5. Semantic News Search: `/api/news/semantic-search?query=technology`
6. Financial Analysis: `/api/analysis/stock/RELIANCE.NS`
7. Technical Analysis: `/api/analysis/technical/RELIANCE.NS`
8. Charts: `/api/analysis/charts/RELIANCE.NS`
9. FinGenie Chat: `/api/fingenie/chat` (POST)

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
5. Add environment variables in Render dashboard

## Best Practices

1. **Environment Configuration**:
   - Keep a single `.env` file in the root directory
   - Use `.env.example` for documentation
   - Never commit sensitive keys to version control

2. **API Service Organization**:
   - Group related API calls together
   - Use consistent error handling
   - Implement graceful fallbacks

3. **FastAPI + Supabase Integration**:
   - Use async/await for all database operations
   - Keep database logic separate from route handlers
   - Add proper error handling and logging

4. **Testing and Monitoring**:
   - Implement health check endpoints
   - Add logging for critical operations
   - Use try/catch blocks consistently

## License

MIT
