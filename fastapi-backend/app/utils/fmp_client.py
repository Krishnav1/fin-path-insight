import os
import json
import logging
import httpx
import asyncio
import random
import yfinance as yf
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from app.core.config import settings

# Rate limiting configuration
YAHOO_RATE_LIMIT_WINDOW = 60  # 60 seconds window
YAHOO_MAX_REQUESTS = 5  # Maximum 5 requests per window
yahoo_request_timestamps = []  # Track request timestamps

# Batch processing configuration
BATCH_SIZE = 2  # Process indices in batches of 2

logger = logging.getLogger(__name__)

# Base URL for FMP API
BASE_URL = "https://financialmodelingprep.com/api/v3"

# Cache for storing API responses to avoid redundant calls
api_cache = {}

async def check_rate_limit() -> Tuple[bool, float]:
    """
    Check if we're within rate limits for Yahoo Finance API
    
    Returns:
        Tuple of (can_proceed, wait_time)
    """
    global yahoo_request_timestamps
    
    # Clean up old timestamps
    current_time = datetime.now().timestamp()
    yahoo_request_timestamps = [ts for ts in yahoo_request_timestamps 
                               if current_time - ts < YAHOO_RATE_LIMIT_WINDOW]
    
    # Check if we've hit the limit
    if len(yahoo_request_timestamps) >= YAHOO_MAX_REQUESTS:
        oldest_timestamp = min(yahoo_request_timestamps)
        wait_time = YAHOO_RATE_LIMIT_WINDOW - (current_time - oldest_timestamp)
        return False, max(0, wait_time)
    
    return True, 0.0

async def perform_yahoo_request(func, *args, **kwargs):
    """
    Perform a Yahoo Finance request with rate limiting and exponential backoff
    
    Args:
        func: The Yahoo Finance function to call
        *args: Arguments to pass to the function
        **kwargs: Keyword arguments to pass to the function
        
    Returns:
        The result of the function call
    """
    max_retries = 5
    base_delay = 2  # Base delay in seconds
    
    for attempt in range(max_retries):
        # Check rate limit
        can_proceed, wait_time = await check_rate_limit()
        
        if not can_proceed:
            logger.warning(f"Rate limit reached, waiting {wait_time:.2f} seconds")
            await asyncio.sleep(wait_time + 0.5)  # Add a small buffer
        
        try:
            # Record this request
            yahoo_request_timestamps.append(datetime.now().timestamp())
            
            # Execute the function
            result = func(*args, **kwargs)
            return result
        
        except Exception as e:
            # If it's a rate limit error (429)
            if "429" in str(e) or "Too Many Requests" in str(e):
                # Calculate backoff with jitter
                delay = (base_delay * (2 ** attempt)) + (random.random() * 0.5)
                logger.warning(f"Yahoo Finance rate limit hit, retrying in {delay:.2f} seconds (attempt {attempt+1}/{max_retries})")
                await asyncio.sleep(delay)
            else:
                # For other errors, retry with a small delay
                if attempt < max_retries - 1:  # Don't log on the last attempt
                    logger.warning(f"Error in Yahoo Finance request: {str(e)}, retrying in 1 second (attempt {attempt+1}/{max_retries})")
                    await asyncio.sleep(1)
                else:
                    # Last attempt failed
                    logger.error(f"Failed after {max_retries} attempts: {str(e)}")
                    raise
    
    # If we get here, all retries failed
    raise Exception(f"Failed after {max_retries} attempts due to rate limiting")

async def batch_process(items, process_func, batch_size=BATCH_SIZE):
    """
    Process items in batches with delays between batches
    
    Args:
        items: List of items to process
        process_func: Async function to process each item
        batch_size: Number of items to process in each batch
        
    Returns:
        List of results
    """
    results = []
    
    # Process in batches
    for i in range(0, len(items), batch_size):
        batch = items[i:i+batch_size]
        batch_results = await asyncio.gather(*[process_func(item) for item in batch])
        results.extend(batch_results)
        
        # Add delay between batches to avoid rate limiting
        if i + batch_size < len(items):
            await asyncio.sleep(2)  # 2 second delay between batches
    
    return results

async def fetch_stock_data(symbol: str) -> Dict[str, Any]:
    """
    Fetch stock data from FMP API with yfinance as fallback
    
    Args:
        symbol: Stock symbol (e.g., RELIANCE.NS, AAPL)
        
    Returns:
        Dictionary with stock data
    """
    cache_key = f"stock_{symbol}"
    
    # Check if data is in cache and not expired (15 minutes)
    if cache_key in api_cache:
        cache_time, cache_data = api_cache[cache_key]
        if datetime.now() - cache_time < timedelta(minutes=15):
            logger.info(f"Using cached data for {symbol}")
            return cache_data
    
    try:
        # Try FMP API first
        params = {
            "apikey": settings.FMP_API_KEY
        }
        
        # Make API request to FMP
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/quote/{symbol}", params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                if data and len(data) > 0:
                    quote = data[0]
                    result = {
                        "symbol": symbol,
                        "price": float(quote.get("price", 0)),
                        "change": float(quote.get("change", 0)),
                        "change_percent": float(quote.get("changesPercentage", 0)),
                        "volume": int(quote.get("volume", 0)),
                        "timestamp": datetime.now()
                    }
                    
                    # Cache the result
                    api_cache[cache_key] = (datetime.now(), result)
                    
                    return result
        
        # If FMP fails, try yfinance as fallback
        logger.info(f"Falling back to yfinance for {symbol}")
        ticker = yf.Ticker(symbol)
        ticker_info = ticker.info
        
        result = {
            "symbol": symbol,
            "price": ticker_info.get("currentPrice", ticker_info.get("regularMarketPrice", 0)),
            "change": ticker_info.get("regularMarketChange", 0),
            "change_percent": ticker_info.get("regularMarketChangePercent", 0),
            "volume": ticker_info.get("regularMarketVolume", 0),
            "timestamp": datetime.now()
        }
        
        # Cache the result
        api_cache[cache_key] = (datetime.now(), result)
        
        return result
    except Exception as e:
        logger.error(f"Error fetching stock data for {symbol}: {str(e)}")
        return {}

async def fetch_technical_indicators(symbol: str, indicator: str, period: int = 14) -> List[Dict[str, Any]]:
    """
    Fetch technical indicators from FMP API with yfinance as fallback
    
    Args:
        symbol: Stock symbol
        indicator: Technical indicator (e.g., rsi, macd, sma)
        period: Period for the indicator
        
    Returns:
        List of dictionaries with indicator data
    """
    cache_key = f"{indicator}_{symbol}_{period}"
    
    # Check if data is in cache and not expired (1 hour)
    if cache_key in api_cache:
        cache_time, cache_data = api_cache[cache_key]
        if datetime.now() - cache_time < timedelta(hours=1):
            logger.info(f"Using cached {indicator} data for {symbol}")
            return cache_data
    
    try:
        # Try FMP API first
        params = {
            "apikey": settings.FMP_API_KEY,
            "period": period
        }
        
        # Make API request to FMP
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/technical_indicator/{indicator}/{symbol}", params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                if data and len(data) > 0:
                    # Cache the result
                    api_cache[cache_key] = (datetime.now(), data)
                    return data
        
        # If FMP fails, try yfinance as fallback
        logger.info(f"Falling back to yfinance for {indicator} on {symbol}")
        ticker = yf.Ticker(symbol)
        
        # Get historical data
        hist = ticker.history(period="1y")
        
        # Calculate indicators using pandas_ta (you'll need to install this)
        result = []
        
        if indicator.lower() == "rsi":
            import pandas_ta as ta
            rsi = ta.rsi(hist['Close'], length=period)
            for date, value in rsi.items():
                result.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "rsi": value
                })
        elif indicator.lower() == "macd":
            import pandas_ta as ta
            macd = ta.macd(hist['Close'])
            for date, row in macd.iterrows():
                result.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "macd": row["MACD_12_26_9"],
                    "signal": row["MACDs_12_26_9"],
                    "histogram": row["MACDh_12_26_9"]
                })
        
        # Cache the result
        api_cache[cache_key] = (datetime.now(), result)
        
        return result
    except Exception as e:
        logger.error(f"Error fetching {indicator} for {symbol}: {str(e)}")
        return []

async def fetch_company_fundamentals(symbol: str) -> Dict[str, Any]:
    """
    Fetch company fundamentals from FMP API with yfinance as fallback
    
    Args:
        symbol: Stock symbol
        
    Returns:
        Dictionary with company fundamentals
    """
    cache_key = f"fundamentals_{symbol}"
    
    # Check if data is in cache and not expired (1 day)
    if cache_key in api_cache:
        cache_time, cache_data = api_cache[cache_key]
        if datetime.now() - cache_time < timedelta(days=1):
            logger.info(f"Using cached fundamentals data for {symbol}")
            return cache_data
    
    try:
        # Try FMP API first
        params = {
            "apikey": settings.FMP_API_KEY
        }
        
        # Make API request to FMP
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/company/profile/{symbol}", params=params)
            
            if response.status_code == 200:
                profile_data = response.json()
                
                # Get ratios
                ratios_response = await client.get(f"{BASE_URL}/ratios/{symbol}", params=params)
                ratios_data = ratios_response.json() if ratios_response.status_code == 200 else []
                
                # Get key metrics
                metrics_response = await client.get(f"{BASE_URL}/key-metrics/{symbol}", params=params)
                metrics_data = metrics_response.json() if metrics_response.status_code == 200 else []
                
                # Combine data
                result = {
                    "profile": profile_data.get("profile", {}),
                    "ratios": ratios_data[0] if ratios_data and len(ratios_data) > 0 else {},
                    "metrics": metrics_data[0] if metrics_data and len(metrics_data) > 0 else {}
                }
                
                # Cache the result
                api_cache[cache_key] = (datetime.now(), result)
                
                return result
        
        # If FMP fails, try yfinance as fallback
        logger.info(f"Falling back to yfinance for fundamentals on {symbol}")
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Format yfinance data to match FMP structure
        result = {
            "profile": {
                "symbol": symbol,
                "companyName": info.get("longName", ""),
                "exchange": info.get("exchange", ""),
                "industry": info.get("industry", ""),
                "sector": info.get("sector", ""),
                "description": info.get("longBusinessSummary", ""),
                "website": info.get("website", ""),
                "marketCap": info.get("marketCap", 0),
                "beta": info.get("beta", 0)
            },
            "ratios": {
                "peRatio": info.get("trailingPE", 0),
                "priceToSalesRatio": info.get("priceToSalesTrailing12Months", 0),
                "priceToBookRatio": info.get("priceToBook", 0),
                "enterpriseValueToEBITDA": info.get("enterpriseToEbitda", 0),
                "dividendYield": info.get("dividendYield", 0) * 100 if info.get("dividendYield") else 0,
                "debtToEquity": info.get("debtToEquity", 0)
            },
            "metrics": {
                "revenuePerShare": info.get("revenuePerShare", 0),
                "netIncomePerShare": info.get("netIncomeToCommon", 0) / info.get("sharesOutstanding", 1) if info.get("sharesOutstanding") else 0,
                "operatingCashFlowPerShare": info.get("operatingCashflow", 0) / info.get("sharesOutstanding", 1) if info.get("sharesOutstanding") else 0,
                "freeCashFlowPerShare": info.get("freeCashflow", 0) / info.get("sharesOutstanding", 1) if info.get("sharesOutstanding") else 0,
                "cashPerShare": info.get("totalCash", 0) / info.get("sharesOutstanding", 1) if info.get("sharesOutstanding") else 0,
                "bookValuePerShare": info.get("bookValue", 0),
                "tangibleBookValuePerShare": info.get("bookValue", 0)
            }
        }
        
        # Cache the result
        api_cache[cache_key] = (datetime.now(), result)
        
        return result
    except Exception as e:
        logger.error(f"Error fetching fundamentals for {symbol}: {str(e)}")
        return {}

async def fetch_analyst_ratings(symbol: str) -> List[Dict[str, Any]]:
    """
    Fetch analyst ratings from FMP API
    
    Args:
        symbol: Stock symbol
        
    Returns:
        List of dictionaries with analyst ratings
    """
    cache_key = f"ratings_{symbol}"
    
    # Check if data is in cache and not expired (1 day)
    if cache_key in api_cache:
        cache_time, cache_data = api_cache[cache_key]
        if datetime.now() - cache_time < timedelta(days=1):
            logger.info(f"Using cached analyst ratings for {symbol}")
            return cache_data
    
    try:
        # Try FMP API
        params = {
            "apikey": settings.FMP_API_KEY
        }
        
        # Make API request to FMP
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/analyst-stock-recommendations/{symbol}", params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                # Cache the result
                api_cache[cache_key] = (datetime.now(), data)
                
                return data
        
        # If FMP fails, return empty list (yfinance doesn't provide this data easily)
        return []
    except Exception as e:
        logger.error(f"Error fetching analyst ratings for {symbol}: {str(e)}")
        return []

async def fetch_historical_data(symbol: str, timeframe: str = "daily") -> List[Dict[str, Any]]:
    """
    Fetch historical price data from FMP API with yfinance as fallback
    
    Args:
        symbol: Stock symbol
        timeframe: Timeframe (daily, weekly, monthly)
        
    Returns:
        List of dictionaries with historical price data
    """
    cache_key = f"history_{symbol}_{timeframe}"
    
    # Check if data is in cache and not expired (1 day)
    if cache_key in api_cache:
        cache_time, cache_data = api_cache[cache_key]
        if datetime.now() - cache_time < timedelta(days=1):
            logger.info(f"Using cached historical data for {symbol}")
            return cache_data
    
    try:
        # Try FMP API first
        params = {
            "apikey": settings.FMP_API_KEY
        }
        
        # Determine endpoint based on timeframe
        endpoint = "historical-price-full"
        if timeframe == "weekly":
            endpoint = "historical-price-full/weekly"
        elif timeframe == "monthly":
            endpoint = "historical-price-full/monthly"
        
        # Make API request to FMP
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/{endpoint}/{symbol}", params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                if "historical" in data:
                    # Cache the result
                    api_cache[cache_key] = (datetime.now(), data["historical"])
                    return data["historical"]
        
        # If FMP fails, try yfinance as fallback
        logger.info(f"Falling back to yfinance for historical data on {symbol}")
        ticker = yf.Ticker(symbol)
        
        # Get historical data
        period = "1y"
        interval = "1d"
        
        if timeframe == "weekly":
            interval = "1wk"
        elif timeframe == "monthly":
            interval = "1mo"
        
        hist = ticker.history(period=period, interval=interval)
        
        # Convert to list of dictionaries
        result = []
        for date, row in hist.iterrows():
            result.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": row["Open"],
                "high": row["High"],
                "low": row["Low"],
                "close": row["Close"],
                "volume": row["Volume"]
            })
        
        # Cache the result
        api_cache[cache_key] = (datetime.now(), result)
        
        return result
    except Exception as e:
        logger.error(f"Error fetching historical data for {symbol}: {str(e)}")
        return []

async def fetch_indian_market_overview() -> Dict[str, Any]:
    """
    Fetch Indian market overview with key indices and market breadth
    
    Returns:
        Dictionary with Indian market indices and breadth data
    
    Raises:
        Exception: If there is an error fetching data after all retries
    """
    # Define the Indian indices to fetch - using standard symbols for better compatibility
    indian_indices = [
        {"symbol": "^NSEI", "name": "NIFTY 50", "fallback_symbol": "NSEI"},
        {"symbol": "^NSEBANK", "name": "NIFTY BANK", "fallback_symbol": "NSEBANK"},
        {"symbol": "^CNXIT", "name": "NIFTY IT", "fallback_symbol": "CNXIT"},
        {"symbol": "^NSMIDCP", "name": "NIFTY MIDCAP", "fallback_symbol": "NSMIDCP"},
        {"symbol": "^INDIAVIX", "name": "INDIA VIX", "fallback_symbol": "INDIAVIX"},
        {"symbol": "^BSESN", "name": "SENSEX", "fallback_symbol": "BSESN"}
    ]
    
    logger.info(f"Fetching data for {len(indian_indices)} Indian market indices")
    
    # Helper function to process a single index with multiple retries and data sources
    async def process_index(index):
        max_retries = 3
        retry_delay = 2  # Initial delay in seconds
        
        for attempt in range(max_retries):
            try:
                # Try different data sources in order of preference
                
                # 1. First try FMP API if API key is available
                if settings.FMP_API_KEY:
                    try:
                        # Map to FMP symbols (remove ^ prefix)
                        fmp_symbol = index["fallback_symbol"]
                        params = {"apikey": settings.FMP_API_KEY}
                        
                        async with httpx.AsyncClient(timeout=10.0) as client:
                            response = await client.get(f"{BASE_URL}/quote/{fmp_symbol}", params=params)
                            
                            if response.status_code == 200:
                                data = response.json()
                                if data and len(data) > 0:
                                    quote = data[0]
                                    logger.info(f"Successfully fetched {index['name']} data from FMP API")
                                    return {
                                        "name": index["name"],
                                        "value": float(quote.get("price", 0)),
                                        "change": float(quote.get("change", 0)),
                                        "change_percent": float(quote.get("changesPercentage", 0)),
                                        "timestamp": datetime.now(timezone.utc).isoformat()
                                    }
                            elif response.status_code == 429:
                                logger.warning(f"Rate limit hit for FMP API, will retry after delay")
                                await asyncio.sleep(retry_delay * (2 ** attempt) + random.random())
                                continue
                    except Exception as fmp_error:
                        logger.warning(f"FMP API failed for {index['name']}, attempt {attempt+1}/{max_retries}: {str(fmp_error)}")
                
                # 2. Try yfinance with rate limiting protection
                try:
                    logger.info(f"Trying yfinance for {index['name']}")
                    
                    # Get ticker info with rate limiting
                    ticker_info = await perform_yahoo_request(lambda: yf.Ticker(index["symbol"]).info)
                    
                    # Get historical data to calculate change
                    hist = await perform_yahoo_request(lambda: yf.Ticker(index["symbol"]).history(period="2d"))
                    
                    # Calculate current value and change
                    if len(hist) >= 2 and "Close" in hist.columns:
                        prev_close = float(hist["Close"].iloc[-2])
                        current = float(hist["Close"].iloc[-1])
                        change = current - prev_close
                        change_percent = (change / prev_close) * 100 if prev_close > 0 else 0
                    else:
                        current = float(ticker_info.get("regularMarketPrice", 0))
                        prev_close = float(ticker_info.get("previousClose", 0))
                        change = current - prev_close
                        change_percent = float(ticker_info.get("regularMarketChangePercent", 0)) * 100
                    
                    logger.info(f"Successfully fetched {index['name']} data from yfinance")
                    return {
                        "name": index["name"],
                        "value": current,
                        "change": change,
                        "change_percent": change_percent,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                except Exception as yf_error:
                    logger.warning(f"yfinance failed for {index['name']}, attempt {attempt+1}/{max_retries}: {str(yf_error)}")
                
                # If we get here, both methods failed, wait and retry
                retry_delay_with_jitter = retry_delay * (2 ** attempt) + random.random()
                logger.warning(f"All data sources failed for {index['name']}, retrying in {retry_delay_with_jitter:.2f}s")
                await asyncio.sleep(retry_delay_with_jitter)
                
            except Exception as e:
                # Unexpected error, log and retry
                logger.error(f"Unexpected error processing {index['name']}, attempt {attempt+1}/{max_retries}: {str(e)}")
                await asyncio.sleep(retry_delay * (2 ** attempt) + random.random())
        
        # If we get here, all retries failed
        logger.error(f"All retries failed for {index['name']}, raising exception")
        raise Exception(f"Failed to fetch data for {index['name']} after {max_retries} attempts")
        
        try:
            # Process indices in batches to avoid rate limiting
            indices_data = await batch_process(indian_indices, process_index, batch_size=2)
            
            # Fetch market breadth data from NSE website
            breadth = await fetch_market_breadth()
            
            result = {
                "indices": indices_data,
                "breadth": breadth
            }
            
            logger.info(f"Successfully fetched Indian market overview with {len(indices_data)} indices")
            return result
            
        except Exception as e:
            logger.error(f"Error in fetch_indian_market_overview: {str(e)}")
            # Re-raise the exception to be handled by the caller
            # This allows the route to use its caching strategy
            raise

async def fetch_market_breadth() -> Dict[str, int]:
    """
    Fetch market breadth data (advances, declines, unchanged)
    
    Returns:
        Dictionary with market breadth data
    """
    try:
        # Try to fetch real market breadth data from NSE website
        async with httpx.AsyncClient(timeout=10.0) as client:
            # NSE API endpoint for market breadth
            response = await client.get("https://www.nseindia.com/api/market-data-pre-open?key=ALL")
            
            if response.status_code == 200:
                data = response.json()
                advances = 0
                declines = 0
                unchanged = 0
                
                # Parse the response to get market breadth
                if "data" in data and isinstance(data["data"], list):
                    for item in data["data"]:
                        if "metadata" in item and "pChange" in item["metadata"]:
                            change = float(item["metadata"]["pChange"])
                            if change > 0:
                                advances += 1
                            elif change < 0:
                                declines += 1
                            else:
                                unchanged += 1
                
                if advances > 0 or declines > 0 or unchanged > 0:
                    logger.info(f"Successfully fetched market breadth: A:{advances}, D:{declines}, U:{unchanged}")
                    return {
                        "advances": advances,
                        "declines": declines,
                        "unchanged": unchanged
                    }
        
        # If NSE website fails, try alternative source (BSE)
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get("https://api.bseindia.com/BseIndiaAPI/api/MktRGainerLoserData/w")
            
            if response.status_code == 200:
                data = response.json()
                if "Table" in data and isinstance(data["Table"], list):
                    advances = sum(1 for item in data["Table"] if item.get("chg", 0) > 0)
                    declines = sum(1 for item in data["Table"] if item.get("chg", 0) < 0)
                    unchanged = sum(1 for item in data["Table"] if item.get("chg", 0) == 0)
                    
                    logger.info(f"Successfully fetched market breadth from BSE: A:{advances}, D:{declines}, U:{unchanged}")
                    return {
                        "advances": advances,
                        "declines": declines,
                        "unchanged": unchanged
                    }
    
    except Exception as e:
        logger.warning(f"Error fetching market breadth: {str(e)}")
    
    # If all attempts fail, use estimated values based on index performance
    # This is better than hardcoded values
    try:
        # Get the NIFTY 50 performance to estimate market breadth
        ticker_info = await perform_yahoo_request(lambda: yf.Ticker("^NSEI").info)
        change_percent = ticker_info.get("regularMarketChangePercent", 0)
        
        # Estimate breadth based on index performance
        if change_percent > 1.5:  # Strong positive day
            advances, declines = 40, 10
        elif change_percent > 0.5:  # Positive day
            advances, declines = 35, 15
        elif change_percent > -0.5:  # Flat day
            advances, declines = 25, 25
        elif change_percent > -1.5:  # Negative day
            advances, declines = 15, 35
        else:  # Strong negative day
            advances, declines = 10, 40
        
        unchanged = 50 - advances - declines
        
        logger.info(f"Using estimated market breadth based on index performance: A:{advances}, D:{declines}, U:{unchanged}")
        return {
            "advances": advances,
            "declines": declines,
            "unchanged": unchanged
        }
    except Exception as e:
        logger.error(f"Error estimating market breadth: {str(e)}")
    
    # Last resort fallback
    return {
        "advances": 25,
        "declines": 20,
        "unchanged": 5
    }
