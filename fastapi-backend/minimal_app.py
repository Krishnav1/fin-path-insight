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

MOCK_NEWS = [
    {
        "title": "Reliance Industries Reports Strong Q4 Earnings",
        "description": "Reliance Industries Limited (RIL) reported a 15% increase in quarterly profits, beating market expectations.",
        "url": "https://example.com/news/reliance-q4-earnings",
        "source": "Financial Times",
        "date": "2023-05-05T10:30:00Z"
    },
    {
        "title": "HDFC Bank Completes Merger with HDFC Ltd",
        "description": "HDFC Bank has completed its merger with HDFC Ltd, creating one of the largest banks in India by market capitalization.",
        "url": "https://example.com/news/hdfc-merger-complete",
        "source": "Economic Times",
        "date": "2023-05-04T14:45:00Z"
    },
    {
        "title": "Indian Markets Hit New All-Time High",
        "description": "Indian stock markets reached a new all-time high today, driven by strong foreign institutional investor inflows.",
        "url": "https://example.com/news/markets-all-time-high",
        "source": "Business Standard",
        "date": "2023-05-03T09:15:00Z"
    }
]

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

# Company news endpoint
@app.get("/api/news/company/{symbol}")
async def get_company_news(symbol: str) -> List[Dict[str, Any]]:
    """Get news for a specific company"""
    return MOCK_NEWS

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

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("minimal_app:app", host="0.0.0.0", port=port, log_level="info")
