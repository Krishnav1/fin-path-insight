from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
import json

from app.utils.fmp_client import (
    fetch_stock_data,
    fetch_technical_indicators,
    fetch_company_fundamentals,
    fetch_analyst_ratings,
    fetch_historical_data
)
from app.utils.newsapi_client import fetch_news
from app.utils.gemini_client import generate_financial_analysis
from app.utils.chart_generator import (
    generate_kline_chart,
    generate_valuation_chart,
    generate_analyst_ratings_chart,
    generate_sentiment_chart
)
from app.utils.supabase_cache import get_cached_data, set_cached_data

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/stock/{symbol}")
async def get_stock_analysis(
    symbol: str,
    include_charts: bool = True,
    include_news: bool = True,
    include_fundamentals: bool = True,
    include_technicals: bool = True
):
    """
    Get comprehensive stock analysis using FMP data and Gemini AI
    
    Parameters:
    - symbol: Stock symbol (e.g., AAPL, RELIANCE.NS)
    - include_charts: Whether to include chart data
    - include_news: Whether to include news data
    - include_fundamentals: Whether to include fundamental data
    - include_technicals: Whether to include technical indicators
    """
    try:
        # Create cache key
        cache_key = f"analysis_{symbol}_{include_charts}_{include_news}_{include_fundamentals}_{include_technicals}"
        
        # Try to get from cache first
        cached_data = await get_cached_data(cache_key)
        if cached_data:
            logger.info(f"Using cached analysis for {symbol}")
            return cached_data
        
        # Fetch stock data
        stock_data = await fetch_stock_data(symbol)
        
        # Prepare financial data object
        financial_data = {
            "symbol": symbol,
            "price": stock_data.get("price", 0),
            "change": stock_data.get("change", 0),
            "change_percent": stock_data.get("change_percent", 0),
            "volume": stock_data.get("volume", 0),
            "timestamp": datetime.now().isoformat()
        }
        
        # Fetch technical indicators if requested
        if include_technicals:
            # Get RSI
            rsi_data = await fetch_technical_indicators(symbol, "rsi", 14)
            if rsi_data and len(rsi_data) > 0:
                financial_data["technical"] = {
                    "rsi": rsi_data[0].get("rsi", 0) if isinstance(rsi_data[0].get("rsi"), (int, float)) else 0
                }
            
            # Get MACD
            macd_data = await fetch_technical_indicators(symbol, "macd", 26)
            if macd_data and len(macd_data) > 0:
                if "technical" not in financial_data:
                    financial_data["technical"] = {}
                financial_data["technical"]["macd"] = macd_data[0].get("macd", 0) if isinstance(macd_data[0].get("macd"), (int, float)) else 0
                financial_data["technical"]["signal"] = macd_data[0].get("signal", 0) if isinstance(macd_data[0].get("signal"), (int, float)) else 0
        
        # Fetch fundamental data if requested
        if include_fundamentals:
            fundamentals = await fetch_company_fundamentals(symbol)
            financial_data["fundamentals"] = fundamentals
            
            # Fetch analyst ratings
            ratings = await fetch_analyst_ratings(symbol)
            financial_data["ratings"] = ratings
        
        # Fetch news if requested
        news_data = []
        if include_news:
            # Get company name for better search results
            company_name = symbol.split('.')[0] if '.' in symbol else symbol
            news_data = await fetch_news(company_name, "business", 5)
        
        # Generate AI analysis
        analysis = await generate_financial_analysis(symbol, financial_data, news_data)
        
        # Prepare response
        response = {
            "symbol": symbol,
            "price": financial_data.get("price", 0),
            "change": financial_data.get("change", 0),
            "change_percent": financial_data.get("change_percent", 0),
            "analysis": analysis,
            "timestamp": datetime.now().isoformat()
        }
        
        # Add charts if requested
        if include_charts:
            # Fetch historical data for KLINE chart
            historical_data = await fetch_historical_data(symbol, "daily")
            
            # Generate charts
            charts = {}
            
            # KLINE chart
            kline_chart = generate_kline_chart(historical_data, f"{symbol} Price History")
            charts["kline"] = json.loads(kline_chart)
            
            # Valuation chart if fundamentals are included
            if include_fundamentals and "fundamentals" in financial_data:
                valuation_chart = generate_valuation_chart(financial_data["fundamentals"])
                charts["valuation"] = json.loads(valuation_chart)
            
            # Analyst ratings chart if ratings are included
            if include_fundamentals and "ratings" in financial_data and financial_data["ratings"]:
                ratings_chart = generate_analyst_ratings_chart(financial_data["ratings"])
                charts["ratings"] = json.loads(ratings_chart)
            
            # Sentiment chart based on AI analysis
            sentiment_data = {
                "technical": 0.5,  # Default neutral
                "fundamental": 0.5,
                "news": 0.5,
                "overall": 0.5
            }
            
            # Extract sentiment from analysis if available
            if "technical" in analysis and analysis["technical"]:
                if "bullish" in analysis["technical"].lower():
                    sentiment_data["technical"] = 0.8
                elif "bearish" in analysis["technical"].lower():
                    sentiment_data["technical"] = -0.8
            
            if "fundamental" in analysis and analysis["fundamental"]:
                if "undervalued" in analysis["fundamental"].lower() or "strong" in analysis["fundamental"].lower():
                    sentiment_data["fundamental"] = 0.7
                elif "overvalued" in analysis["fundamental"].lower() or "weak" in analysis["fundamental"].lower():
                    sentiment_data["fundamental"] = -0.7
            
            if "news_impact" in analysis and analysis["news_impact"]:
                if "positive" in analysis["news_impact"].lower():
                    sentiment_data["news"] = 0.6
                elif "negative" in analysis["news_impact"].lower():
                    sentiment_data["news"] = -0.6
            
            if "sentiment" in analysis and analysis["sentiment"]:
                if "positive" in analysis["sentiment"].lower() or "bullish" in analysis["sentiment"].lower():
                    sentiment_data["overall"] = 0.7
                elif "negative" in analysis["sentiment"].lower() or "bearish" in analysis["sentiment"].lower():
                    sentiment_data["overall"] = -0.7
            
            sentiment_chart = generate_sentiment_chart(sentiment_data)
            charts["sentiment"] = json.loads(sentiment_chart)
            
            response["charts"] = charts
        
        # Add news if requested
        if include_news:
            response["news"] = news_data
        
        # Cache the response
        await set_cached_data(cache_key, response, 1800)  # Cache for 30 minutes
        
        return response
    except Exception as e:
        logger.error(f"Error generating stock analysis for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating analysis: {str(e)}")

@router.get("/technical/{symbol}")
async def get_technical_analysis(symbol: str, period: int = 14):
    """
    Get technical indicators for a stock
    
    Parameters:
    - symbol: Stock symbol
    - period: Period for indicators
    """
    try:
        # Create cache key
        cache_key = f"technical_{symbol}_{period}"
        
        # Try to get from cache first
        cached_data = await get_cached_data(cache_key)
        if cached_data:
            logger.info(f"Using cached technical data for {symbol}")
            return cached_data
        
        # Fetch technical indicators
        rsi_data = await fetch_technical_indicators(symbol, "rsi", period)
        macd_data = await fetch_technical_indicators(symbol, "macd", period)
        
        # Prepare response
        response = {
            "symbol": symbol,
            "period": period,
            "rsi": rsi_data,
            "macd": macd_data,
            "timestamp": datetime.now().isoformat()
        }
        
        # Cache the response
        await set_cached_data(cache_key, response, 3600)  # Cache for 1 hour
        
        return response
    except Exception as e:
        logger.error(f"Error fetching technical indicators for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching technical indicators: {str(e)}")

@router.get("/fundamental/{symbol}")
async def get_fundamental_analysis(symbol: str):
    """
    Get fundamental data for a stock
    
    Parameters:
    - symbol: Stock symbol
    """
    try:
        # Create cache key
        cache_key = f"fundamental_{symbol}"
        
        # Try to get from cache first
        cached_data = await get_cached_data(cache_key)
        if cached_data:
            logger.info(f"Using cached fundamental data for {symbol}")
            return cached_data
        
        # Fetch fundamental data
        fundamentals = await fetch_company_fundamentals(symbol)
        
        # Fetch analyst ratings
        ratings = await fetch_analyst_ratings(symbol)
        
        # Prepare response
        response = {
            "symbol": symbol,
            "fundamentals": fundamentals,
            "ratings": ratings,
            "timestamp": datetime.now().isoformat()
        }
        
        # Cache the response
        await set_cached_data(cache_key, response, 86400)  # Cache for 24 hours
        
        return response
    except Exception as e:
        logger.error(f"Error fetching fundamental data for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching fundamental data: {str(e)}")

@router.get("/charts/{symbol}")
async def get_stock_charts(
    symbol: str,
    chart_types: List[str] = Query(["kline", "valuation", "ratings", "sentiment"])
):
    """
    Get charts for a stock
    
    Parameters:
    - symbol: Stock symbol
    - chart_types: Types of charts to generate
    """
    try:
        # Create cache key
        cache_key = f"charts_{symbol}_{'-'.join(chart_types)}"
        
        # Try to get from cache first
        cached_data = await get_cached_data(cache_key)
        if cached_data:
            logger.info(f"Using cached charts for {symbol}")
            return cached_data
        
        # Fetch data needed for charts
        charts = {}
        
        # Fetch historical data for KLINE chart
        if "kline" in chart_types:
            historical_data = await fetch_historical_data(symbol, "daily")
            kline_chart = generate_kline_chart(historical_data, f"{symbol} Price History")
            charts["kline"] = json.loads(kline_chart)
        
        # Fetch fundamental data for valuation chart
        if "valuation" in chart_types:
            fundamentals = await fetch_company_fundamentals(symbol)
            valuation_chart = generate_valuation_chart(fundamentals)
            charts["valuation"] = json.loads(valuation_chart)
        
        # Fetch analyst ratings for ratings chart
        if "ratings" in chart_types:
            ratings = await fetch_analyst_ratings(symbol)
            ratings_chart = generate_analyst_ratings_chart(ratings)
            charts["ratings"] = json.loads(ratings_chart)
        
        # Generate sentiment chart (placeholder values)
        if "sentiment" in chart_types:
            sentiment_data = {
                "technical": 0.2,
                "fundamental": 0.5,
                "news": -0.3,
                "overall": 0.1
            }
            sentiment_chart = generate_sentiment_chart(sentiment_data)
            charts["sentiment"] = json.loads(sentiment_chart)
        
        # Prepare response
        response = {
            "symbol": symbol,
            "charts": charts,
            "timestamp": datetime.now().isoformat()
        }
        
        # Cache the response
        await set_cached_data(cache_key, response, 3600)  # Cache for 1 hour
        
        return response
    except Exception as e:
        logger.error(f"Error generating charts for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating charts: {str(e)}")
