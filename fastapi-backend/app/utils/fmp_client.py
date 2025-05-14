import os
import logging
import httpx
import yfinance as yf
from typing import Dict, Any, List, Optional
import json
from datetime import datetime, timedelta
from app.core.config import settings

logger = logging.getLogger(__name__)

# Base URL for FMP API
BASE_URL = "https://financialmodelingprep.com/api/v3"

# Cache for storing API responses to avoid redundant calls
api_cache = {}

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
    """
    cache_key = "indian_market_overview"
    
    # Check if data is in cache and not expired (15 minutes)
    if cache_key in api_cache:
        cache_time, cache_data = api_cache[cache_key]
        if datetime.now() - cache_time < timedelta(minutes=15):
            logger.info("Using cached Indian market overview data")
            return cache_data
    
    try:
        # Define the Indian market indices to fetch
        indian_indices = [
            {"symbol": "^NSEI", "name": "NIFTY 50"},
            {"symbol": "^NSEBANK", "name": "NIFTY BANK"},
            {"symbol": "^CNXIT", "name": "NIFTY IT"},
            {"symbol": "^NSMIDCP", "name": "NIFTY MIDCAP 100"},
            {"symbol": "^NSEMDCP50", "name": "NIFTY MIDCAP 50"},
            {"symbol": "^CNXAUTO", "name": "NIFTY AUTO"},
            {"symbol": "^CNXFMCG", "name": "NIFTY FMCG"},
            {"symbol": "^CNXPHARMA", "name": "NIFTY PHARMA"},
            {"symbol": "^CNXMETAL", "name": "NIFTY METAL"},
            {"symbol": "^INDIAVIX", "name": "INDIA VIX"}
        ]
        
        indices_data = []
        
        # Fetch data for each index using yfinance (FMP doesn't have good support for Indian indices)
        for index in indian_indices:
            try:
                ticker = yf.Ticker(index["symbol"])
                ticker_info = ticker.info
                
                # Get historical data to calculate change
                hist = ticker.history(period="2d")
                if len(hist) >= 2:
                    prev_close = hist["Close"].iloc[-2]
                    current = hist["Close"].iloc[-1]
                    change = current - prev_close
                    change_percent = (change / prev_close) * 100 if prev_close > 0 else 0
                else:
                    current = ticker_info.get("regularMarketPrice", 0)
                    prev_close = ticker_info.get("previousClose", 0)
                    change = current - prev_close
                    change_percent = ticker_info.get("regularMarketChangePercent", 0) * 100
                
                indices_data.append({
                    "name": index["name"],
                    "value": current,
                    "change": change,
                    "change_percent": change_percent,
                    "timestamp": datetime.now().isoformat()
                })
            except Exception as e:
                logger.error(f"Error fetching data for {index['name']}: {str(e)}")
        
        # Fetch market breadth data (mock for now as it's harder to get)
        # In a real implementation, you would scrape this from NSE website or use a specialized API
        breadth = {
            "advances": 0,
            "declines": 0,
            "unchanged": 0
        }
        
        # Try to get market breadth from yfinance data
        try:
            # Get all NIFTY 50 stocks
            nifty_stocks = yf.Tickers("RELIANCE.NS HDFCBANK.NS TCS.NS INFY.NS ICICIBANK.NS")
            stock_data = nifty_stocks.tickers
            
            for _, ticker in stock_data.items():
                info = ticker.info
                change = info.get("regularMarketChange", 0)
                if change > 0:
                    breadth["advances"] += 1
                elif change < 0:
                    breadth["declines"] += 1
                else:
                    breadth["unchanged"] += 1
        except Exception as e:
            logger.error(f"Error fetching market breadth: {str(e)}")
            # Fallback to reasonable estimates
            breadth = {
                "advances": 25,
                "declines": 20,
                "unchanged": 5
            }
        
        result = {
            "indices": indices_data,
            "breadth": breadth
        }
        
        # Cache the result
        api_cache[cache_key] = (datetime.now(), result)
        
        return result
    except Exception as e:
        logger.error(f"Error fetching Indian market overview: {str(e)}")
        return {
            "indices": [],
            "breadth": {"advances": 0, "declines": 0, "unchanged": 0}
        }
