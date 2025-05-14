# FinPath Insight - Financial Market Analysis Platform

## Project Overview

FinPath Insight is a comprehensive financial market analysis platform with AI-powered insights, real-time market data, and an intelligent financial assistant (FinGenie).

## Architecture

The project consists of three main components:

1. **Express Backend**: Handles authentication, basic API routes, and proxies specific requests to the FastAPI backend
2. **FastAPI Backend**: Handles AI analysis, market data, document processing, and FinGenie chatbot functionality
3. **React Frontend**: Provides the user interface for market data visualization, company analysis, and FinGenie interaction

### Database

The application uses **Supabase** as the primary database and authentication provider. Supabase provides:
- PostgreSQL database for storing stock data, user profiles, and application state
- Authentication services with JWT tokens
- Row-level security for data protection
- Real-time subscriptions for live updates

### Key Features

- **AI Analysis**: Professional-grade company analysis reports using Google Gemini
- **Market Data**: Real-time market data from Alpha Vantage with Supabase caching
- **Document Processing**: Upload and process PDF/CSV files for knowledge base
- **FinGenie Chatbot**: AI-powered financial assistant with document search and market data integration
- **Error Handling**: Comprehensive error handling with fallback mechanisms

## Setup Instructions

### Prerequisites

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Python 3.8+ - [download from python.org](https://www.python.org/downloads/)
- Supabase account - [sign up at supabase.com](https://supabase.com)
- API keys for:
  - Google Gemini AI
  - Pinecone Vector Database
  - Alpha Vantage

## Deployment

The application is deployed using the following services:

- **Frontend**: Netlify
- **Node.js Backend**: Render.com
- **FastAPI Backend**: Render.com
- **Database**: Supabase

### Deployment Scripts

We've provided several scripts to simplify the deployment process:

- `test-api-connections.bat` - Test API connections before deployment
- `test-build.bat` - Build and preview the application locally
- `deploy.bat` - Deploy the frontend to Netlify

For detailed deployment instructions, see [PRODUCTION-DEPLOYMENT.md](./PRODUCTION-DEPLOYMENT.md).

For Supabase database setup instructions, see [SUPABASE-SETUP.md](./SUPABASE-SETUP.md).

## Error Handling System

The application includes a comprehensive error handling system that:

- Categorizes errors by type (network, server, timeout, etc.)
- Provides user-friendly error messages
- Supports automatic retries with fallback endpoints
- Includes a reusable error display component

For more information about the error handling system, see [ERROR_HANDLING.md](./frontend/src/utils/ERROR_HANDLING.md).
  - News API

### Backend Setup

#### Express Backend Setup

```sh
# Navigate to the Express backend directory
cd backend

# Install dependencies
npm install

# Create a .env file with the necessary environment variables
# Make sure to include:
# FASTAPI_URL=http://localhost:8000
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_supabase_anon_key

# Start the Express server
npm start
```

The Express backend will be available at http://localhost:3002

#### FastAPI Backend Setup

```sh
# Navigate to the FastAPI backend directory
cd fastapi-backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python start.py
# or
uvicorn app.main:app --reload --port 8000
```

The FastAPI backend will be available at http://localhost:8000 with API documentation at http://localhost:8000/docs

### Frontend Setup

```sh
# Navigate to the project root directory

# Install dependencies
npm install

# Create a .env.local file with the necessary environment variables
echo "VITE_API_BASE_URL=http://localhost:3002" > .env.local
echo "VITE_SUPABASE_URL=your_supabase_url" >> .env.local
echo "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key" >> .env.local

# Start the development server
npm run dev
```

The frontend will be available at http://localhost:5173

## Deployment

### Backend Deployment

#### Express Backend Deployment on Railway or Render

1. Create a new project on Railway or Render
2. Connect your GitHub repository
3. Set the build command: `npm install`
4. Set the start command: `npm start`
5. Set environment variables in the dashboard:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `SUPABASE_SERVICE_KEY` - Your Supabase service role key
   - `JWT_SECRET` - A secure secret for JWT token generation
   - `FASTAPI_URL` - Your Vercel deployment URL for FastAPI (e.g., https://fin-path-insight-fastapi.vercel.app)
   - `GEMINI_API_KEY` - Your Google Gemini API key
   - `PINECONE_API_KEY` - Your Pinecone API key
   - `PINECONE_INDEX_NAME` - Your Pinecone index name (fingenie-finance-vectors)
   - `ALPHA_VANTAGE_API_KEY` - Your Alpha Vantage API key
   - `NEWS_API_KEY` - Your News API key
   - `NODE_ENV` - Set to "production"

#### FastAPI Backend Deployment on Vercel

The FastAPI backend is configured for deployment on Vercel's Hobby plan:

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to the fastapi-backend directory: `cd fastapi-backend`
3. Run `vercel` and follow the prompts
4. Set environment variables in the Vercel dashboard:
   - `GEMINI_API_KEY`
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX_NAME`
   - `ALPHA_VANTAGE_API_KEY`
   - `NEWS_API_KEY`

### Frontend Deployment on Netlify

1. Create a production build: `npm run build`
2. Deploy to Netlify using their CLI or GitHub integration
3. Set environment variables in the Netlify dashboard:
   - `VITE_API_BASE_URL` - Your Express backend deployment URL
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `VITE_USE_FALLBACK_DATA` - Set to "true" if you want to use fallback data when API calls fail

## Weekly Stock Data Updates

A GitHub Actions workflow is configured to update the stock data in Supabase weekly. This ensures that the application has access to the latest market information.

To manually run the stock data update:

```sh
# Navigate to the backend directory
cd backend

# Run the update script
node scripts/updateStockData.js
```

## Weekly Knowledge Base Updates

A weekly task is configured to update the knowledge base with new documents. This ensures that the AI analysis and FinGenie chatbot have access to the latest information.

To manually run the knowledge base update:

```sh
# Navigate to the FastAPI backend directory
cd fastapi-backend

# Activate the virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Run the update script
python -m app.scripts.update_knowledge_base
```

## Cost Considerations

This setup is designed to keep costs at zero for up to 500 users by utilizing free tiers:

- **Netlify Free Plan**: Free for personal projects
- **Supabase Free Tier**: Up to 500MB database storage and 2GB bandwidth
- **Pinecone Free Tier**: 1 index, 100K vectors
- **Google Gemini Free Tier**: Limited monthly usage
- **Alpha Vantage Free Tier**: 5 API calls per minute

For higher usage, consider upgrading to paid plans which would cost approximately $50-70/month for all services combined.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ae5f5194-4a99-4780-96f7-75f74585287d) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
