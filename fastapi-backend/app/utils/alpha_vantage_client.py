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
