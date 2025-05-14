from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
import logging
from ...core.config import settings
import httpx
import json
from datetime import datetime
from app.utils.newsapi_client import fetch_news, search_news_semantic, format_news_for_frontend
from app.utils.supabase_cache import get_cached_data, set_cached_data

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/latest")
async def get_latest_news(topics: Optional[str] = None, market: Optional[str] = None, limit: int = 10):
    """
    Get latest financial news
    
    Parameters:
    - topics: Optional topic to filter news by
    - market: Optional market (e.g., 'india', 'global') to filter news by
    - limit: Maximum number of news items to return
    """
    try:
        # Create cache key
        cache_key = f"news_latest_{topics}_{market}_{limit}"
        
        # Try to get from cache first
        cached_data = await get_cached_data(cache_key)
        if cached_data:
            logger.info(f"Using cached news data for {topics}/{market}")
            return cached_data
        
        # If market is specified, use it as a topic
        search_query = market if market else topics
        category = "business"
        
        # Fetch news from NewsAPI
        news_data = await fetch_news(search_query, category, limit)
        
        # Format response in the structure expected by the frontend
        response = {
            "status": "ok",
            "totalResults": len(news_data),
            "articles": format_news_for_frontend(news_data)
        }
        
        # Cache the response
        await set_cached_data(cache_key, response, 1800)  # Cache for 30 minutes
        
        return response
    except Exception as e:
        logger.error(f"Error fetching latest news: {str(e)}")
        # Return mock data as fallback
        mock_news = get_mock_news(limit, topics if topics else market)
        return {
            "status": "ok",
            "totalResults": len(mock_news),
            "articles": format_news_for_frontend(mock_news)
        }

@router.get("/company/{symbol}")
async def get_company_news(symbol: str, limit: int = 5):
    """
    Get news for a specific company
    """
    try:
        # Create cache key
        cache_key = f"news_company_{symbol}_{limit}"
        
        # Try to get from cache first
        cached_data = await get_cached_data(cache_key)
        if cached_data:
            logger.info(f"Using cached news data for company {symbol}")
            return cached_data
        
        # Get company name for better search results
        company_name = symbol.split('.')[0] if '.' in symbol else symbol
        
        # Fetch news from NewsAPI
        news_data = await fetch_news(company_name, "business", limit)
        
        # Format response in the structure expected by the frontend
        response = {
            "status": "ok",
            "totalResults": len(news_data),
            "articles": format_news_for_frontend(news_data)
        }
        
        # Cache the response
        await set_cached_data(cache_key, response, 1800)  # Cache for 30 minutes
        
        return response
    except Exception as e:
        logger.error(f"Error fetching news for {symbol}: {str(e)}")
        # Return mock data as fallback
        mock_news = get_mock_news(limit, symbol)
        return {
            "status": "ok",
            "totalResults": len(mock_news),
            "articles": format_news_for_frontend(mock_news)
        }

@router.get("/semantic-search")
async def semantic_search_news(query: str, limit: int = 5):
    """
    Search news semantically using Pinecone
    
    Parameters:
    - query: Search query
    - limit: Maximum number of results to return
    """
    try:
        # Create cache key
        cache_key = f"news_semantic_{query}_{limit}"
        
        # Try to get from cache first
        cached_data = await get_cached_data(cache_key)
        if cached_data:
            logger.info(f"Using cached semantic search results for '{query}'")
            return cached_data
        
        # Search news semantically
        news_data = await search_news_semantic(query, limit)
        
        # Format response in the structure expected by the frontend
        response = {
            "status": "ok",
            "totalResults": len(news_data),
            "articles": format_news_for_frontend(news_data)
        }
        
        # Cache the response
        await set_cached_data(cache_key, response, 3600)  # Cache for 1 hour
        
        return response
    except Exception as e:
        logger.error(f"Error performing semantic search for '{query}': {str(e)}")
        # Return mock data as fallback
        mock_news = get_mock_news(limit, query)
        return {
            "status": "ok",
            "totalResults": len(mock_news),
            "articles": format_news_for_frontend(mock_news)
        }

def format_news_for_frontend(news_items):
    """
    Format news data in the structure expected by the frontend
    
    Parameters:
    - news_items: List of news items from Alpha Vantage or mock data
    
    Returns:
    - List of news articles formatted for the frontend
    """
    formatted_articles = []
    
    for item in news_items:
        # Check if the item is already in the expected format
        if "urlToImage" in item and "source" in item and isinstance(item["source"], dict):
            formatted_articles.append(item)
            continue
            
        # Format from Alpha Vantage structure
        article = {
            "title": item.get("title", ""),
            "description": item.get("summary", ""),
            "url": item.get("url", ""),
            "urlToImage": item.get("banner_image", "https://via.placeholder.com/300x200?text=Financial+News"),
            "publishedAt": item.get("time_published", datetime.now().isoformat()),
            "source": {
                "id": item.get("source_domain", "").replace(".", "-") if "source_domain" in item else "",
                "name": item.get("source", "Financial News")
            },
            "content": item.get("summary", "")
        }
        formatted_articles.append(article)
    
    return formatted_articles

def get_mock_news(limit: int = 10, topics: Optional[str] = None):
    """
    Generate mock news data for fallback
    
    Parameters:
    - limit: Maximum number of news items to return
    - topics: Optional topic or market to filter news by
    """
    today = datetime.now().strftime("%Y%m%dT%H%M%S")
    
    # Market-specific news
    market_news = {
        "india": [
            {
                "title": "Sensex Climbs 500 Points as IT Stocks Rally",
                "url": "https://example.com/sensex-rally",
                "time_published": today,
                "summary": "The BSE Sensex climbed over 500 points today led by strong performance in IT and banking stocks.",
                "source": "Economic Times",
                "banner_image": "https://placehold.co/600x400/png?text=Sensex+Rally"
            },
            {
                "title": "RBI Holds Key Interest Rates Steady",
                "url": "https://example.com/rbi-rates",
                "time_published": today,
                "summary": "The Reserve Bank of India maintained key interest rates in its latest monetary policy meeting.",
                "source": "Business Standard",
                "banner_image": "https://placehold.co/600x400/png?text=RBI+Rates"
            },
            {
                "title": "Indian Rupee Strengthens Against US Dollar",
                "url": "https://example.com/rupee-dollar",
                "time_published": today,
                "summary": "The Indian Rupee gained strength against the US Dollar in today's trading session.",
                "source": "Mint",
                "banner_image": "https://placehold.co/600x400/png?text=Rupee+Dollar"
            }
        ],
        "global": [
            {
                "title": "Wall Street Rallies on Tech Earnings",
                "url": "https://example.com/wall-street",
                "time_published": today,
                "summary": "Wall Street indices closed higher following strong earnings reports from major tech companies.",
                "source": "Bloomberg",
                "banner_image": "https://placehold.co/600x400/png?text=Wall+Street"
            },
            {
                "title": "Fed Signals Potential Rate Cut",
                "url": "https://example.com/fed-rates",
                "time_published": today,
                "summary": "The Federal Reserve has signaled a potential interest rate cut in the coming months.",
                "source": "CNBC",
                "banner_image": "https://placehold.co/600x400/png?text=Fed+Rates"
            },
            {
                "title": "Oil Prices Drop on Supply Concerns",
                "url": "https://example.com/oil-prices",
                "time_published": today,
                "summary": "Global oil prices dropped amid concerns about oversupply in the market.",
                "source": "Reuters",
                "banner_image": "https://placehold.co/600x400/png?text=Oil+Prices"
            }
        ]
    }
    
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
    
    # If a specific market is requested, prioritize its news
    if topics:
        key = topics.lower()
        if key in market_news:
            result = market_news[key] + news_items
        elif key in company_news:
            result = company_news[key] + news_items
        else:
            result = news_items
    # If a specific company is requested, prioritize its news
    elif topics and topics in company_news:
        result = company_news[topics] + news_items
    else:
        result = news_items
        
    return result[:limit]
