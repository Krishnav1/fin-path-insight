import os
import logging
import httpx
from typing import Dict, Any, List, Optional
import json
from datetime import datetime, timedelta
from ..core.config import settings

logger = logging.getLogger(__name__)

# Base URL for Alpha Vantage API
BASE_URL = "https://www.alphavantage.co/query"

# Cache for storing API responses to avoid redundant calls
api_cache = {}

async def fetch_stock_data(symbol: str) -> Dict[str, Any]:
    """
    Fetch stock data from Alpha Vantage API
    
    Args:
        symbol: Stock symbol (e.g., RELIANCE.BSE)
        
    Returns:
        Dictionary with stock data
    """
    cache_key = f"stock_{symbol}"
    
    # Check if data is in cache and not expired (1 hour)
    if cache_key in api_cache:
        cache_time, cache_data = api_cache[cache_key]
        if datetime.now() - cache_time < timedelta(hours=1):
            logger.info(f"Using cached data for {symbol}")
            return cache_data
    
    try:
        # Prepare request parameters
        params = {
            "function": "GLOBAL_QUOTE",
            "symbol": symbol,
            "apikey": settings.ALPHA_VANTAGE_API_KEY
        }
        
        # Make API request
        async with httpx.AsyncClient() as client:
            response = await client.get(BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
        
        # Check for error messages
        if "Error Message" in data:
            logger.error(f"Alpha Vantage API error: {data['Error Message']}")
            return {}
        
        # Process the response
        if "Global Quote" in data and data["Global Quote"]:
            quote = data["Global Quote"]
            result = {
                "symbol": symbol,
                "price": float(quote.get("05. price", 0)),
                "change": float(quote.get("09. change", 0)),
                "change_percent": float(quote.get("10. change percent", "0%").replace("%", "")),
                "volume": int(quote.get("06. volume", 0)),
                "timestamp": datetime.now()
            }
            
            # Cache the result
            api_cache[cache_key] = (datetime.now(), result)
            
            return result
        else:
            logger.warning(f"No quote data found for {symbol}")
            return {}
    except Exception as e:
        logger.error(f"Error fetching stock data for {symbol}: {str(e)}")
        return {}

async def fetch_intraday_data(symbol: str, interval: str = "5min") -> List[Dict[str, Any]]:
    """
    Fetch intraday data from Alpha Vantage API
    
    Args:
        symbol: Stock symbol (e.g., RELIANCE.BSE)
        interval: Time interval (1min, 5min, 15min, 30min, 60min)
        
    Returns:
        List of dictionaries with intraday data
    """
    cache_key = f"intraday_{symbol}_{interval}"
    
    # Check if data is in cache and not expired (15 minutes)
    if cache_key in api_cache:
        cache_time, cache_data = api_cache[cache_key]
        if datetime.now() - cache_time < timedelta(minutes=15):
            logger.info(f"Using cached intraday data for {symbol}")
            return cache_data
    
    try:
        # Prepare request parameters
        params = {
            "function": "TIME_SERIES_INTRADAY",
            "symbol": symbol,
            "interval": interval,
            "outputsize": "compact",
            "apikey": settings.ALPHA_VANTAGE_API_KEY
        }
        
        # Make API request
        async with httpx.AsyncClient() as client:
            response = await client.get(BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
        
        # Check for error messages
        if "Error Message" in data:
            logger.error(f"Alpha Vantage API error: {data['Error Message']}")
            return []
        
        # Process the response
        time_series_key = f"Time Series ({interval})"
        if time_series_key in data and data[time_series_key]:
            result = []
            for timestamp, values in data[time_series_key].items():
                result.append({
                    "timestamp": timestamp,
                    "open": float(values.get("1. open", 0)),
                    "high": float(values.get("2. high", 0)),
                    "low": float(values.get("3. low", 0)),
                    "close": float(values.get("4. close", 0)),
                    "volume": int(values.get("5. volume", 0))
                })
            
            # Sort by timestamp (newest first)
            result.sort(key=lambda x: x["timestamp"], reverse=True)
            
            # Cache the result
            api_cache[cache_key] = (datetime.now(), result)
            
            return result
        else:
            logger.warning(f"No intraday data found for {symbol}")
            return []
    except Exception as e:
        logger.error(f"Error fetching intraday data for {symbol}: {str(e)}")
        return []

async def fetch_daily_data(symbol: str, outputsize: str = "compact") -> List[Dict[str, Any]]:
    """
    Fetch daily data from Alpha Vantage API
    
    Args:
        symbol: Stock symbol (e.g., RELIANCE.BSE)
        outputsize: Output size (compact = 100 latest data points, full = all data points)
        
    Returns:
        List of dictionaries with daily data
    """
    cache_key = f"daily_{symbol}_{outputsize}"
    
    # Check if data is in cache and not expired (1 day)
    if cache_key in api_cache:
        cache_time, cache_data = api_cache[cache_key]
        if datetime.now() - cache_time < timedelta(days=1):
            logger.info(f"Using cached daily data for {symbol}")
            return cache_data
    
    try:
        # Prepare request parameters
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": symbol,
            "outputsize": outputsize,
            "apikey": settings.ALPHA_VANTAGE_API_KEY
        }
        
        # Make API request
        async with httpx.AsyncClient() as client:
            response = await client.get(BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
        
        # Check for error messages
        if "Error Message" in data:
            logger.error(f"Alpha Vantage API error: {data['Error Message']}")
            return []
        
        # Process the response
        if "Time Series (Daily)" in data and data["Time Series (Daily)"]:
            result = []
            for date, values in data["Time Series (Daily)"].items():
                result.append({
                    "date": date,
                    "open": float(values.get("1. open", 0)),
                    "high": float(values.get("2. high", 0)),
                    "low": float(values.get("3. low", 0)),
                    "close": float(values.get("4. close", 0)),
                    "volume": int(values.get("5. volume", 0))
                })
            
            # Sort by date (newest first)
            result.sort(key=lambda x: x["date"], reverse=True)
            
            # Cache the result
            api_cache[cache_key] = (datetime.now(), result)
            
            return result
        else:
            logger.warning(f"No daily data found for {symbol}")
            return []
    except Exception as e:
        logger.error(f"Error fetching daily data for {symbol}: {str(e)}")
        return []

async def fetch_company_overview(symbol: str) -> Dict[str, Any]:
    """
    Fetch company overview from Alpha Vantage API
    
    Args:
        symbol: Stock symbol (e.g., RELIANCE.BSE)
        
    Returns:
        Dictionary with company overview data
    """
    cache_key = f"overview_{symbol}"
    
    # Check if data is in cache and not expired (1 week)
    if cache_key in api_cache:
        cache_time, cache_data = api_cache[cache_key]
        if datetime.now() - cache_time < timedelta(days=7):
            logger.info(f"Using cached company overview for {symbol}")
            return cache_data
    
    try:
        # Prepare request parameters
        params = {
            "function": "OVERVIEW",
            "symbol": symbol,
            "apikey": settings.ALPHA_VANTAGE_API_KEY
        }
        
        # Make API request
        async with httpx.AsyncClient() as client:
            response = await client.get(BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
        
        # Check for error messages
        if "Error Message" in data:
            logger.error(f"Alpha Vantage API error: {data['Error Message']}")
            return {}
        
        # Check if response is empty
        if not data or len(data) <= 1:
            logger.warning(f"No company overview found for {symbol}")
            return {}
        
        # Cache the result
        api_cache[cache_key] = (datetime.now(), data)
        
        return data
    except Exception as e:
        logger.error(f"Error fetching company overview for {symbol}: {str(e)}")
        return {}

async def fetch_market_status() -> Dict[str, Any]:
    """
    Fetch market status (mock implementation as Alpha Vantage doesn't provide this directly)
    
    Returns:
        Dictionary with market status data
    """
    # This is a mock implementation since Alpha Vantage doesn't provide market status directly
    # In a production environment, you would use a different API or service for this
    
    # Check if it's a weekend
    today = datetime.now()
    is_weekend = today.weekday() >= 5  # 5 = Saturday, 6 = Sunday
    
    # Check if it's outside market hours (9:15 AM to 3:30 PM IST)
    current_hour = today.hour
    current_minute = today.minute
    before_market = current_hour < 9 or (current_hour == 9 and current_minute < 15)
    after_market = current_hour > 15 or (current_hour == 15 and current_minute > 30)
    
    if is_weekend:
        market_status = "closed"
        reason = "Weekend"
    elif before_market:
        market_status = "pre-market"
        reason = "Before market hours"
    elif after_market:
        market_status = "after-hours"
        reason = "After market hours"
    else:
        market_status = "open"
        reason = "Market hours"
    
    return {
        "status": market_status,
        "reason": reason,
        "next_open": get_next_market_open(),
        "next_close": get_next_market_close()
    }

def get_next_market_open() -> str:
    """Get the next market open time"""
    today = datetime.now()
    
    # If it's before market open today
    if today.hour < 9 or (today.hour == 9 and today.minute < 15):
        next_open = today.replace(hour=9, minute=15, second=0, microsecond=0)
        return next_open.strftime("%Y-%m-%d %H:%M:%S")
    
    # If it's weekend or after market hours, find next weekday
    days_to_add = 1
    if today.weekday() == 4 and today.hour >= 15:  # Friday after market close
        days_to_add = 3
    elif today.weekday() == 5:  # Saturday
        days_to_add = 2
    elif today.weekday() == 6:  # Sunday
        days_to_add = 1
    
    next_open = (today + timedelta(days=days_to_add)).replace(hour=9, minute=15, second=0, microsecond=0)
    return next_open.strftime("%Y-%m-%d %H:%M:%S")

def get_next_market_close() -> str:
    """Get the next market close time"""
    today = datetime.now()
    
    # If market is open today and hasn't closed yet
    if today.weekday() < 5 and (today.hour < 15 or (today.hour == 15 and today.minute <= 30)):
        next_close = today.replace(hour=15, minute=30, second=0, microsecond=0)
        return next_close.strftime("%Y-%m-%d %H:%M:%S")
    
    # Find next weekday
    days_to_add = 1
    if today.weekday() == 4 and today.hour > 15:  # Friday after market close
        days_to_add = 3
    elif today.weekday() == 5:  # Saturday
        days_to_add = 2
    elif today.weekday() == 6:  # Sunday
        days_to_add = 1
    
    next_close = (today + timedelta(days=days_to_add)).replace(hour=15, minute=30, second=0, microsecond=0)
    return next_close.strftime("%Y-%m-%d %H:%M:%S")


async def fetch_news(topics: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Fetch news from Alpha Vantage API
    
    Args:
        topics: Topics to filter news by (comma-separated)
        limit: Maximum number of news items to return
        
    Returns:
        List of dictionaries with news data
    """
    cache_key = f"news_{topics}_{limit}"
    
    # Check cache first
    if cache_key in api_cache and (datetime.now() - api_cache[cache_key]["timestamp"]).seconds < 3600:  # Cache for 1 hour
        logger.info(f"Using cached news data for {topics}")
        return api_cache[cache_key]["data"]
    
    params = {
        "function": "NEWS_SENTIMENT",
        "apikey": settings.ALPHA_VANTAGE_API_KEY,
    }
    
    if topics:
        params["topics"] = topics
        
    if limit:
        params["limit"] = str(limit)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(BASE_URL, params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                if "feed" in data:
                    news_items = data["feed"]
                    
                    # Format the news items
                    formatted_news = []
                    for item in news_items:
                        formatted_item = {
                            "title": item.get("title", ""),
                            "url": item.get("url", ""),
                            "time_published": item.get("time_published", ""),
                            "summary": item.get("summary", ""),
                            "source": item.get("source", ""),
                            "category": item.get("category", ""),
                            "topics": item.get("topics", []),
                            "banner_image": item.get("banner_image", "")
                        }
                        formatted_news.append(formatted_item)
                    
                    # Cache the result
                    api_cache[cache_key] = {
                        "data": formatted_news,
                        "timestamp": datetime.now()
                    }
                    
                    return formatted_news
                else:
                    logger.warning(f"No news data in Alpha Vantage response: {data}")
                    return get_mock_news(limit, topics)
            else:
                logger.error(f"Error fetching news from Alpha Vantage: {response.status_code} {response.text}")
                return get_mock_news(limit, topics)
    except Exception as e:
        logger.error(f"Exception fetching news from Alpha Vantage: {str(e)}")
        return get_mock_news(limit, topics)

def get_mock_news(limit: int = 10, topics: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Generate mock news data for fallback
    
    Args:
        limit: Maximum number of news items to return
        topics: Topics to filter news by
        
    Returns:
        List of dictionaries with mock news data
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
            "category": "Market News",
            "topics": ["market", "indices"],
            "banner_image": "https://placehold.co/600x400/png?text=Market+Update"
        },
        {
            "title": "RBI Announces New Monetary Policy Measures",
            "url": "https://example.com/rbi-policy",
            "time_published": today,
            "summary": "The Reserve Bank of India announced new monetary policy measures aimed at controlling inflation.",
            "source": "Economic Times",
            "category": "Economy",
            "topics": ["rbi", "monetary policy", "inflation"],
            "banner_image": "https://placehold.co/600x400/png?text=RBI+Policy"
        },
        {
            "title": "Tech Stocks Rally on Strong Earnings Reports",
            "url": "https://example.com/tech-rally",
            "time_published": today,
            "summary": "Technology stocks rallied today following better-than-expected earnings reports from major companies.",
            "source": "Bloomberg",
            "category": "Stocks",
            "topics": ["technology", "earnings", "stocks"],
            "banner_image": "https://placehold.co/600x400/png?text=Tech+Stocks"
        },
        {
            "title": "Oil Prices Surge Amid Supply Concerns",
            "url": "https://example.com/oil-prices",
            "time_published": today,
            "summary": "Oil prices surged today amid concerns about global supply disruptions.",
            "source": "Reuters",
            "category": "Commodities",
            "topics": ["oil", "commodities", "energy"],
            "banner_image": "https://placehold.co/600x400/png?text=Oil+Prices"
        },
        {
            "title": "Global Markets React to US Federal Reserve Decision",
            "url": "https://example.com/fed-decision",
            "time_published": today,
            "summary": "Global markets reacted strongly to the latest US Federal Reserve interest rate decision.",
            "source": "CNBC",
            "category": "Economy",
            "topics": ["federal reserve", "interest rates", "global markets"],
            "banner_image": "https://placehold.co/600x400/png?text=Fed+Decision"
        },
        {
            "title": "Indian Rupee Strengthens Against US Dollar",
            "url": "https://example.com/rupee-dollar",
            "time_published": today,
            "summary": "The Indian Rupee strengthened against the US Dollar following positive economic data.",
            "source": "Mint",
            "category": "Forex",
            "topics": ["rupee", "dollar", "forex"],
            "banner_image": "https://placehold.co/600x400/png?text=Rupee+Dollar"
        },
        {
            "title": "Government Announces New Economic Stimulus Package",
            "url": "https://example.com/stimulus-package",
            "time_published": today,
            "summary": "The government announced a new economic stimulus package to boost growth and create jobs.",
            "source": "Business Standard",
            "category": "Economy",
            "topics": ["stimulus", "economy", "government"],
            "banner_image": "https://placehold.co/600x400/png?text=Stimulus+Package"
        },
        {
            "title": "Banking Sector Faces New Regulatory Challenges",
            "url": "https://example.com/banking-regulations",
            "time_published": today,
            "summary": "The banking sector is facing new regulatory challenges as authorities tighten oversight.",
            "source": "Financial Express",
            "category": "Banking",
            "topics": ["banking", "regulations", "finance"],
            "banner_image": "https://placehold.co/600x400/png?text=Banking+Regulations"
        },
        {
            "title": "Cryptocurrency Market Sees Significant Volatility",
            "url": "https://example.com/crypto-volatility",
            "time_published": today,
            "summary": "The cryptocurrency market experienced significant volatility as Bitcoin and other major coins fluctuated widely.",
            "source": "CoinDesk",
            "category": "Cryptocurrency",
            "topics": ["cryptocurrency", "bitcoin", "blockchain"],
            "banner_image": "https://placehold.co/600x400/png?text=Crypto+Volatility"
        },
        {
            "title": "Real Estate Sector Shows Signs of Recovery",
            "url": "https://example.com/real-estate-recovery",
            "time_published": today,
            "summary": "The real estate sector is showing signs of recovery with increased sales and stable prices.",
            "source": "Property Times",
            "category": "Real Estate",
            "topics": ["real estate", "property", "housing"],
            "banner_image": "https://placehold.co/600x400/png?text=Real+Estate+Recovery"
        }
    ]
    
    # Filter by topics if provided
    if topics:
        topic_list = [t.strip().lower() for t in topics.split(',')]
        filtered_items = []
        for item in news_items:
            item_topics = [t.lower() for t in item.get("topics", [])]
            if any(topic in item_topics for topic in topic_list):
                filtered_items.append(item)
        news_items = filtered_items if filtered_items else news_items  # Use all items if no matches
    
    return news_items[:limit]
