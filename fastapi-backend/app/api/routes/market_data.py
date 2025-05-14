from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from app.models.schemas import StockPrice, MarketOverview, IndexMovers
from app.utils.alpha_vantage_client import (
    fetch_stock_data, 
    fetch_intraday_data, 
    fetch_daily_data, 
    fetch_company_overview,
    fetch_market_status
)
from app.utils.fmp_client import fetch_indian_market_overview
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/stock/{symbol}", response_model=StockPrice)
async def get_stock_price(symbol: str):
    """
    Get current stock price and basic information
    """
    try:
        data = await fetch_stock_data(symbol)
        if not data:
            raise HTTPException(status_code=404, detail=f"Stock data for {symbol} not found")
        return data
    except Exception as e:
        logger.error(f"Error fetching stock price for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stock/{symbol}/intraday")
async def get_intraday_data(symbol: str, interval: str = Query("5min", description="Time interval (1min, 5min, 15min, 30min, 60min)")):
    """
    Get intraday stock data
    """
    try:
        data = await fetch_intraday_data(symbol, interval)
        if not data:
            raise HTTPException(status_code=404, detail=f"Intraday data for {symbol} not found")
        return data
    except Exception as e:
        logger.error(f"Error fetching intraday data for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stock/{symbol}/daily")
async def get_daily_data(symbol: str, outputsize: str = Query("compact", description="Output size (compact = 100 latest data points, full = all data points)")):
    """
    Get daily stock data
    """
    try:
        data = await fetch_daily_data(symbol, outputsize)
        if not data:
            raise HTTPException(status_code=404, detail=f"Daily data for {symbol} not found")
        return data
    except Exception as e:
        logger.error(f"Error fetching daily data for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stock/{symbol}/overview")
async def get_company_overview(symbol: str):
    """
    Get company overview information
    """
    try:
        data = await fetch_company_overview(symbol)
        if not data:
            raise HTTPException(status_code=404, detail=f"Company overview for {symbol} not found")
        return data
    except Exception as e:
        logger.error(f"Error fetching company overview for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market/status")
async def get_market_status():
    """
    Get current market status (open, closed, pre-market, after-hours)
    """
    try:
        data = await fetch_market_status()
        return data
    except Exception as e:
        logger.error(f"Error fetching market status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/indian-market/overview", response_model=MarketOverview)
async def get_indian_market_overview():
    """
    Get Indian market overview with key indices and market breadth
    """
    try:
        # Fetch real Indian market data using our FMP client
        market_data = await fetch_indian_market_overview()
        
        # Return the data
        return market_data
    except Exception as e:
        logger.error(f"Error fetching Indian market overview: {str(e)}")
        # Fallback to mock data if real data fetching fails
        indices = [
            {
                "name": "NIFTY 50",
                "value": 22345.60,
                "change": 123.45,
                "change_percent": 0.55,
                "timestamp": "2025-05-13T09:30:00"
            },
            {
                "name": "NIFTY BANK",
                "value": 48765.30,
                "change": -156.70,
                "change_percent": -0.32,
                "timestamp": "2025-05-13T09:30:00"
            },
            {
                "name": "NIFTY IT",
                "value": 37890.25,
                "change": 345.60,
                "change_percent": 0.92,
                "timestamp": "2025-05-13T09:30:00"
            },
            {
                "name": "NIFTY NEXT 50",
                "value": 54321.10,
                "change": 234.50,
                "change_percent": 0.43,
                "timestamp": "2025-05-13T09:30:00"
            },
            {
                "name": "INDIA VIX",
                "value": 14.25,
                "change": -0.75,
                "change_percent": -5.00,
                "timestamp": "2025-05-13T09:30:00"
            }
        ]
        
        breadth = {
            "advances": 1234,
            "declines": 876,
            "unchanged": 123
        }
        
        return {
            "indices": indices,
            "breadth": breadth
        }

@router.get("/indian-market/index-movers/{index_symbol}", response_model=IndexMovers)
async def get_index_movers(
    index_symbol: str,
    top_n: int = Query(5, description="Number of top gainers and losers to return")
):
    """
    Get top gainers and losers for a specific index
    """
    try:
        # Mock data for now - in production, this would call a real API
        if index_symbol == "NIFTY50" or index_symbol == "NIFTY 50":
            gainers = [
                {
                    "symbol": "HDFCBANK",
                    "name": "HDFC Bank Ltd.",
                    "price": 1678.45,
                    "change": 45.60,
                    "change_percent": 2.79
                },
                {
                    "symbol": "RELIANCE",
                    "name": "Reliance Industries Ltd.",
                    "price": 2987.30,
                    "change": 67.80,
                    "change_percent": 2.32
                },
                {
                    "symbol": "TCS",
                    "name": "Tata Consultancy Services Ltd.",
                    "price": 3876.25,
                    "change": 78.45,
                    "change_percent": 2.07
                },
                {
                    "symbol": "INFY",
                    "name": "Infosys Ltd.",
                    "price": 1543.20,
                    "change": 28.75,
                    "change_percent": 1.90
                },
                {
                    "symbol": "ICICIBANK",
                    "name": "ICICI Bank Ltd.",
                    "price": 987.65,
                    "change": 18.30,
                    "change_percent": 1.89
                }
            ]
            
            losers = [
                {
                    "symbol": "SUNPHARMA",
                    "name": "Sun Pharmaceutical Industries Ltd.",
                    "price": 1234.50,
                    "change": -34.20,
                    "change_percent": -2.70
                },
                {
                    "symbol": "TATAMOTORS",
                    "name": "Tata Motors Ltd.",
                    "price": 876.30,
                    "change": -23.45,
                    "change_percent": -2.61
                },
                {
                    "symbol": "BAJAJFINSV",
                    "name": "Bajaj Finserv Ltd.",
                    "price": 1654.75,
                    "change": -42.30,
                    "change_percent": -2.49
                },
                {
                    "symbol": "ASIANPAINT",
                    "name": "Asian Paints Ltd.",
                    "price": 3210.45,
                    "change": -76.80,
                    "change_percent": -2.34
                },
                {
                    "symbol": "HCLTECH",
                    "name": "HCL Technologies Ltd.",
                    "price": 1432.60,
                    "change": -32.15,
                    "change_percent": -2.19
                }
            ]
            
            return {
                "index_name": "NIFTY 50",
                "gainers": gainers[:top_n],
                "losers": losers[:top_n]
            }
        else:
            raise HTTPException(status_code=404, detail=f"Data for index {index_symbol} not found")
    except Exception as e:
        logger.error(f"Error fetching index movers for {index_symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
