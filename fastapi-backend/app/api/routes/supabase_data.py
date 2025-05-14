"""
Supabase Data Routes
Routes for accessing data from Supabase
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
import logging
from app.db.supabase import supabase

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/stocks/{symbol}")
async def get_stock_data(symbol: str):
    """
    Get stock data from Supabase
    
    Args:
        symbol: Stock symbol
        
    Returns:
        Stock data
    """
    try:
        logger.info(f"Getting stock data for {symbol}")
        
        # Query Supabase for stock data
        filters = {"symbol": f"eq.{symbol}"}
        data = await supabase.select("stocks", "*", filters, 1)
        
        if not data:
            raise HTTPException(status_code=404, detail=f"Stock {symbol} not found")
        
        return data[0]
    except Exception as e:
        logger.error(f"Error getting stock data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting stock data: {str(e)}")

@router.get("/market-overview/{market}")
async def get_market_overview(market: str = "india"):
    """
    Get market overview data from Supabase
    
    Args:
        market: Market (india, us, global)
        
    Returns:
        Market overview data
    """
    try:
        logger.info(f"Getting market overview for {market}")
        
        # Query Supabase for market overview data
        filters = {"market": f"eq.{market}"}
        data = await supabase.select("market_overview", "*", filters, 1)
        
        if not data:
            # Fallback to any market data if specific market not found
            data = await supabase.select("market_overview", "*", None, 1)
            
        if not data:
            raise HTTPException(status_code=404, detail=f"Market overview data not found")
        
        return data[0]
    except Exception as e:
        logger.error(f"Error getting market overview: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting market overview: {str(e)}")

@router.get("/news")
async def get_latest_news(market: Optional[str] = None, limit: int = 10):
    """
    Get latest news from Supabase
    
    Args:
        market: Optional market filter (india, us, global)
        limit: Maximum number of news items to return
        
    Returns:
        List of news items
    """
    try:
        logger.info(f"Getting latest news for market={market}, limit={limit}")
        
        # Query Supabase for news data
        filters = {}
        if market:
            filters["market"] = f"eq.{market}"
            
        # Add ordering by date
        filters["order"] = "published_at.desc"
        
        data = await supabase.select("news", "*", filters, limit)
        
        return data
    except Exception as e:
        logger.error(f"Error getting news: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting news: {str(e)}")

@router.get("/company-news/{symbol}")
async def get_company_news(symbol: str, limit: int = 5):
    """
    Get company news from Supabase
    
    Args:
        symbol: Stock symbol
        limit: Maximum number of news items to return
        
    Returns:
        List of news items
    """
    try:
        logger.info(f"Getting news for company {symbol}, limit={limit}")
        
        # Query Supabase for company news
        # This assumes you have a 'company' column in your news table
        # or that you're using full-text search on the content
        filters = {"or": f"(company.eq.{symbol},content.ilike.%{symbol}%)"}
        filters["order"] = "published_at.desc"
        
        data = await supabase.select("news", "*", filters, limit)
        
        return data
    except Exception as e:
        logger.error(f"Error getting company news: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting company news: {str(e)}")

@router.get("/health")
async def health_check():
    """
    Health check endpoint to verify Supabase connection
    
    Returns:
        Health status
    """
    try:
        # Try to query a simple table to verify connection
        await supabase.select("stocks", "count(*)", None, 1)
        
        return {
            "status": "healthy",
            "database": "connected",
            "message": "Supabase connection is working"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "message": f"Supabase connection error: {str(e)}"
        }
