# FinPath Insight FastAPI Backend

This is the FastAPI backend for FinPath Insight, providing AI analysis, market data, document processing, and FinGenie chatbot functionality.

## Features

- **AI Analysis**: Generate professional-grade company analysis reports using Google Gemini AI
- **Market Data**: Fetch real-time market data using Alpha Vantage API
- **Document Processing**: Upload and process PDF/CSV files for knowledge base
- **FinGenie Integration**: Enhanced chatbot with document search and market data

## Setup

### Prerequisites

- Python 3.8+
- Pip package manager
- API keys for:
  - Google Gemini AI
  - Pinecone Vector Database
  - Alpha Vantage

### Installation

1. Clone the repository
2. Navigate to the fastapi-backend directory
3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file with the following variables:

```
# API Keys
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=fingenie-finance-vectors
PINECONE_CLOUD=aws
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
NEWS_API_KEY=your_news_api_key

# Server Configuration
PORT=8000
```

### Running the Server

```bash
cd fastapi-backend
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access the API documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Deployment on Vercel

This FastAPI backend is configured for deployment on Vercel's Hobby plan:

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to the fastapi-backend directory
3. Run `vercel` and follow the prompts
4. Set environment variables in the Vercel dashboard

## Weekly Knowledge Base Updates

A weekly task is configured to update the knowledge base with new documents. This ensures that the AI analysis and FinGenie chatbot have access to the latest information.

## Integration with Frontend

The frontend connects to this FastAPI backend for:
- AI Analysis tab on the Company Analysis page
- Market data dashboard
- Document uploads (admin)
- FinGenie chatbot
