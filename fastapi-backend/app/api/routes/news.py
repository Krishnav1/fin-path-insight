from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
import logging
from ...core.config import settings
import httpx
import json
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/latest")
async def get_latest_news(topics: Optional[str] = None, limit: int = 10):
    """
    Get latest financial news
    """
    try:
        news_data = await fetch_news(topics, limit)
        return {"news": news_data}
    except Exception as e:
        logger.error(f"Error fetching latest news: {str(e)}")
        # Return mock data as fallback
        return {"news": get_mock_news(limit)}

@router.get("/company/{symbol}")
async def get_company_news(symbol: str, limit: int = 5):
    """
    Get news for a specific company
    """
    try:
        news_data = await fetch_news(f"{symbol}", limit)
        return {"news": news_data}
    except Exception as e:
        logger.error(f"Error fetching news for {symbol}: {str(e)}")
        # Return mock data as fallback
        return {"news": get_mock_news(limit, symbol)}

async def fetch_news(topics: Optional[str] = None, limit: int = 10):
    """
    Fetch news from Alpha Vantage API
    """
    url = f"https://www.alphavantage.co/query"
    params = {
        "function": "NEWS_SENTIMENT",
        "apikey": settings.ALPHA_VANTAGE_API_KEY,
        "limit": limit
    }
    
    if topics:
        params["topics"] = topics
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                if "feed" in data:
                    return data.get("feed", [])
                else:
                    # API limit reached or other issue, return mock data
                    return get_mock_news(limit, topics)
            else:
                # Return mock data if API fails
                return get_mock_news(limit, topics)
    except Exception as e:
        logger.error(f"Error fetching news from Alpha Vantage: {str(e)}")
        return get_mock_news(limit, topics)

def get_mock_news(limit: int = 10, topics: Optional[str] = None):
    """
    Generate mock news data for fallback
    """
    today = datetime.now().strftime("%Y%m%dT%H%M%S")
    
    # Base news items
    news_items = [
        {
            "title": "Market Update: Major Indices Show Mixed Results",
            "url": "https://example.com/market-update",
            "time_published": today,
            "summary": "Major indices showed mixed results today as investors weighed economic data.",
            "source": "Financial Times",
            "banner_image": "https://placehold.co/600x400/png?text=Market+Update"
        },
        {
            "title": "RBI Announces New Monetary Policy Measures",
            "url": "https://example.com/rbi-policy",
            "time_published": today,
            "summary": "The Reserve Bank of India announced new monetary policy measures aimed at controlling inflation.",
            "source": "Economic Times",
            "banner_image": "https://placehold.co/600x400/png?text=RBI+Policy"
        },
        {
            "title": "Tech Stocks Rally on Strong Earnings Reports",
            "url": "https://example.com/tech-rally",
            "time_published": today,
            "summary": "Technology stocks rallied today following better-than-expected earnings reports from major companies.",
            "source": "Bloomberg",
            "banner_image": "https://placehold.co/600x400/png?text=Tech+Stocks"
        },
        {
            "title": "Oil Prices Surge Amid Supply Concerns",
            "url": "https://example.com/oil-prices",
            "time_published": today,
            "summary": "Oil prices surged today amid concerns about global supply disruptions.",
            "source": "Reuters",
            "banner_image": "https://placehold.co/600x400/png?text=Oil+Prices"
        },
        {
            "title": "Global Markets React to US Federal Reserve Decision",
            "url": "https://example.com/fed-decision",
            "time_published": today,
            "summary": "Global markets reacted strongly to the latest US Federal Reserve interest rate decision.",
            "source": "CNBC",
            "banner_image": "https://placehold.co/600x400/png?text=Fed+Decision"
        }
    ]
    
    # Company-specific mock news
    company_news = {
        "RELIANCE.NS": [
            {
                "title": "Reliance Industries Announces New Green Energy Initiative",
                "url": "https://example.com/reliance-green",
                "time_published": today,
                "summary": "Reliance Industries has announced a major new green energy initiative with significant investments.",
                "source": "Economic Times",
                "banner_image": "https://placehold.co/600x400/png?text=Reliance+Green+Energy"
            },
            {
                "title": "Reliance Retail Expands E-commerce Operations",
                "url": "https://example.com/reliance-retail",
                "time_published": today,
                "summary": "Reliance Retail is expanding its e-commerce operations to compete with established players.",
                "source": "Business Standard",
                "banner_image": "https://placehold.co/600x400/png?text=Reliance+Retail"
            }
        ],
        "TCS.NS": [
            {
                "title": "TCS Reports Strong Quarterly Results",
                "url": "https://example.com/tcs-results",
                "time_published": today,
                "summary": "Tata Consultancy Services has reported strong quarterly results, exceeding analyst expectations.",
                "source": "Mint",
                "banner_image": "https://placehold.co/600x400/png?text=TCS+Results"
            },
            {
                "title": "TCS Announces New AI Partnership",
                "url": "https://example.com/tcs-ai",
                "time_published": today,
                "summary": "TCS has announced a new partnership to enhance its artificial intelligence capabilities.",
                "source": "Business Today",
                "banner_image": "https://placehold.co/600x400/png?text=TCS+AI"
            }
        ],
        "HDFCBANK.NS": [
            {
                "title": "HDFC Bank Launches New Digital Banking Platform",
                "url": "https://example.com/hdfc-digital",
                "time_published": today,
                "summary": "HDFC Bank has launched a new digital banking platform with enhanced features for customers.",
                "source": "Financial Express",
                "banner_image": "https://placehold.co/600x400/png?text=HDFC+Digital"
            },
            {
                "title": "HDFC Bank Reports Record Profit Growth",
                "url": "https://example.com/hdfc-profit",
                "time_published": today,
                "summary": "HDFC Bank has reported record profit growth in its latest quarterly results.",
                "source": "Economic Times",
                "banner_image": "https://placehold.co/600x400/png?text=HDFC+Profit"
            }
        ]
    }
    
    # If a specific company is requested, prioritize its news
    if topic and topic in company_news:
        result = company_news[topic] + news_items
    else:
        result = news_items
        
    return result[:limit]
