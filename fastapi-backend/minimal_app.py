"""
Minimal FastAPI application that can be used as a fallback
when the main application fails to start due to configuration issues.
"""
import os
import json
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Create a minimal FastAPI app
app = FastAPI(
    title="FinPath Insight API (Minimal)",
    description="Minimal version of the FinPath Insight API for emergency fallback",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Print environment info for debugging
print("Starting minimal FastAPI application")
print(f"Python version: {os.sys.version}")
print(f"Environment variables: {list(os.environ.keys())}")

# Mock data for fallback responses
MOCK_STOCK_DATA = {
    "symbol": "RELIANCE",
    "price": 2876.45,
    "change": 23.75,
    "percentChange": 0.83,
    "volume": 4235678,
    "marketCap": "19.45T",
    "pe": 22.34,
    "dividend": 1.2,
    "historical": [
        {"date": "2023-05-01", "price": 2750.25},
        {"date": "2023-05-02", "price": 2765.50},
        {"date": "2023-05-03", "price": 2780.75},
        {"date": "2023-05-04", "price": 2800.10},
        {"date": "2023-05-05", "price": 2876.45}
    ]
}

MOCK_MARKET_OVERVIEW = {
    "indices": [
        {"name": "NIFTY 50", "value": 22345.30, "change": 123.45, "percentChange": 0.55},
        {"name": "SENSEX", "value": 73456.78, "change": 345.67, "percentChange": 0.47},
        {"name": "NIFTY BANK", "value": 48765.43, "change": -56.78, "percentChange": -0.12}
    ],
    "topGainers": [
        {"symbol": "TATAMOTORS", "price": 876.50, "change": 34.25, "percentChange": 4.07},
        {"symbol": "HDFCBANK", "price": 1654.30, "change": 45.60, "percentChange": 2.83},
        {"symbol": "RELIANCE", "price": 2876.45, "change": 65.30, "percentChange": 2.32}
    ],
    "topLosers": [
        {"symbol": "INFY", "price": 1432.75, "change": -45.60, "percentChange": -3.08},
        {"symbol": "TCS", "price": 3567.80, "change": -78.90, "percentChange": -2.16},
        {"symbol": "WIPRO", "price": 432.65, "change": -8.75, "percentChange": -1.98}
    ],
    "marketBreadth": {
        "advancers": 32,
        "decliners": 18,
        "unchanged": 0
    }
}

# News articles in the format expected by the frontend
MOCK_NEWS_ARTICLES = [
    {
        "title": "Reliance Industries Reports Strong Q4 Earnings",
        "description": "Reliance Industries Limited (RIL) reported a 15% increase in quarterly profits, beating market expectations.",
        "url": "https://example.com/news/reliance-q4-earnings",
        "urlToImage": "https://via.placeholder.com/300x200?text=Reliance+Q4",
        "publishedAt": "2023-05-05T10:30:00Z",
        "source": {
            "id": "financial-times",
            "name": "Financial Times"
        },
        "content": "Reliance Industries Limited (RIL) reported a 15% increase in quarterly profits, beating market expectations. The company's retail and digital services segments showed strong growth..."
    },
    {
        "title": "HDFC Bank Completes Merger with HDFC Ltd",
        "description": "HDFC Bank has completed its merger with HDFC Ltd, creating one of the largest banks in India by market capitalization.",
        "url": "https://example.com/news/hdfc-merger-complete",
        "urlToImage": "https://via.placeholder.com/300x200?text=HDFC+Merger",
        "publishedAt": "2023-05-04T14:45:00Z",
        "source": {
            "id": "economic-times",
            "name": "Economic Times"
        },
        "content": "HDFC Bank has completed its merger with HDFC Ltd, creating one of the largest banks in India by market capitalization. The merger is expected to enhance the bank's competitive position..."
    },
    {
        "title": "Indian Markets Hit New All-Time High",
        "description": "Indian stock markets reached a new all-time high today, driven by strong foreign institutional investor inflows.",
        "url": "https://example.com/news/markets-all-time-high",
        "urlToImage": "https://via.placeholder.com/300x200?text=Market+High",
        "publishedAt": "2023-05-03T09:15:00Z",
        "source": {
            "id": "business-standard",
            "name": "Business Standard"
        },
        "content": "Indian stock markets reached a new all-time high today, driven by strong foreign institutional investor inflows. Both the Sensex and Nifty indices closed at record levels..."
    }
]

# News response format with articles property
MOCK_NEWS_RESPONSE = {
    "status": "ok",
    "totalResults": 3,
    "articles": MOCK_NEWS_ARTICLES
}

# Simplified format for backward compatibility
MOCK_NEWS = MOCK_NEWS_ARTICLES

# Root endpoint
@app.get("/")
async def root() -> Dict[str, Any]:
    """Root endpoint that returns API information"""
    return {
        "name": "FinPath Insight API",
        "version": "1.0.0",
        "status": "running",
        "mode": "minimal fallback",
        "documentation": "/docs",
        "environment": os.environ.get("NODE_ENV", "development")
    }

# Health check endpoint
@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint to verify API is running"""
    return {
        "status": "ok",
        "message": "Minimal FastAPI application is running",
        "environment": os.environ.get("NODE_ENV", "development"),
        "supabase_configured": bool(os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_ANON_KEY"))
    }

# Stock data endpoint
@app.get("/api/market-data/stock/{symbol}")
async def get_stock_data(symbol: str) -> Dict[str, Any]:
    """Get stock data for a specific symbol"""
    mock_data = MOCK_STOCK_DATA.copy()
    mock_data["symbol"] = symbol.upper()
    return mock_data

# Market overview endpoint
@app.get("/api/market-data/indian-market/overview")
async def get_market_overview() -> Dict[str, Any]:
    """Get Indian market overview data"""
    return MOCK_MARKET_OVERVIEW

# News endpoints
@app.get("/api/news/company/{symbol}")
async def get_company_news(symbol: str) -> List[Dict[str, Any]]:
    """Get news for a specific company"""
    return MOCK_NEWS

@app.get("/api/news/latest")
async def get_latest_news(market: str = "india") -> List[Dict[str, Any]]:
    """Get latest news for a specific market"""
    return MOCK_NEWS

# AI Analysis endpoints
@app.post("/api/ai-analysis/company")
async def analyze_company(request: dict) -> Dict[str, Any]:
    """Analyze company data"""
    return {
        "analysis": "This is a mock company analysis generated by the minimal app.",
        "sentiment": "positive",
        "recommendation": "buy",
        "riskLevel": "moderate",
        "keyPoints": [
            "Strong financial performance",
            "Growing market share",
            "Innovative product pipeline"
        ]
    }

# Stock peers endpoint
@app.get("/api/stocks/peers")
async def get_stock_peers(symbol: str, sector: str = None) -> List[Dict[str, Any]]:
    """Get peer stocks for a given symbol and sector"""
    return [
        {"symbol": "INFY", "name": "Infosys Ltd", "price": 1432.75, "change": -45.60, "percentChange": -3.08},
        {"symbol": "TCS", "name": "Tata Consultancy Services", "price": 3567.80, "change": -78.90, "percentChange": -2.16},
        {"symbol": "WIPRO", "name": "Wipro Ltd", "price": 432.65, "change": -8.75, "percentChange": -1.98},
        {"symbol": "HCLTECH", "name": "HCL Technologies", "price": 1245.30, "change": 15.40, "percentChange": 1.25},
        {"symbol": "TECHM", "name": "Tech Mahindra", "price": 1156.45, "change": 23.50, "percentChange": 2.07}
    ]

# Supabase data endpoints (mock)
@app.get("/api/supabase/stock/{symbol}")
async def get_supabase_stock_data(symbol: str) -> Dict[str, Any]:
    """Get stock data from Supabase (mock)"""
    return get_stock_data(symbol)

@app.get("/api/supabase/market/overview")
async def get_supabase_market_overview() -> Dict[str, Any]:
    """Get market overview from Supabase (mock)"""
    return MOCK_MARKET_OVERVIEW

@app.get("/api/supabase/news/{symbol}")
async def get_supabase_news(symbol: str) -> List[Dict[str, Any]]:
    """Get news from Supabase (mock)"""
    return MOCK_NEWS

@app.get("/api/supabase/news")
async def get_supabase_market_news(market: str = "india", limit: int = 10) -> List[Dict[str, Any]]:
    """Get market news from Supabase (mock)"""
    return MOCK_NEWS[:limit]

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("minimal_app:app", host="0.0.0.0", port=port, log_level="info")
