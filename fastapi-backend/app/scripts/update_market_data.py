"""
Market Data Update Script
Updates market data in Supabase cache to keep it fresh
Run this script via cron job to ensure data is always up-to-date
"""

import os
import sys
import asyncio
import logging
from pathlib import Path
from datetime import datetime, timedelta

# Add the parent directory to the path so we can import from app
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.db.supabase import supabase
from app.core.config import settings
from app.utils.supabase_cache import set_cached_data, get_cached_data
from app.utils.fmp_client import (
    fetch_indian_market_overview,
    fetch_stock_data,
    fetch_index_movers
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# List of important Indian stocks to keep updated
IMPORTANT_STOCKS = [
    "RELIANCE.NS",
    "TCS.NS",
    "HDFCBANK.NS",
    "INFY.NS",
    "ICICIBANK.NS",
    "HINDUNILVR.NS",
    "SBIN.NS",
    "BHARTIARTL.NS",
    "BAJFINANCE.NS",
    "KOTAKBANK.NS"
]

# List of indices to update
INDICES = ["NIFTY50", "SENSEX", "BANKNIFTY"]

async def update_market_overview():
    """Update the Indian market overview data"""
    try:
        logger.info("Updating Indian market overview data")
        market_data = await fetch_indian_market_overview()
        
        if market_data:
            # Cache the data
            await set_cached_data("indian_market_overview", market_data)
            
            # Also update in the market_overview table
            try:
                # Check if data for India exists
                existing_data = await supabase.select(
                    "market_overview", 
                    "*", 
                    {"market": "india"}
                )
                
                if existing_data:
                    # Update existing record
                    await supabase.update(
                        "market_overview",
                        {
                            "indices": market_data.get("indices", {}),
                            "breadth": market_data.get("breadth", {}),
                            "updated_at": datetime.now().isoformat()
                        },
                        {"market": "india"}
                    )
                else:
                    # Insert new record
                    await supabase.insert(
                        "market_overview",
                        {
                            "market": "india",
                            "indices": market_data.get("indices", {}),
                            "breadth": market_data.get("breadth", {}),
                        }
                    )
                
                logger.info("Market overview data updated successfully")
            except Exception as e:
                logger.error(f"Error updating market_overview table: {str(e)}")
        else:
            logger.warning("Failed to fetch market overview data")
    
    except Exception as e:
        logger.error(f"Error updating market overview: {str(e)}")

async def update_stock_data():
    """Update stock data for important stocks"""
    for symbol in IMPORTANT_STOCKS:
        try:
            logger.info(f"Updating stock data for {symbol}")
            stock_data = await fetch_stock_data(symbol)
            
            if stock_data:
                # Cache the data
                cache_key = f"stock_data_{symbol}"
                await set_cached_data(cache_key, stock_data)
                
                # Also update in the stocks table
                try:
                    # Check if stock exists
                    existing_stock = await supabase.select(
                        "stocks", 
                        "*", 
                        {"symbol": symbol}
                    )
                    
                    stock_info = {
                        "symbol": symbol,
                        "name": stock_data.get("name", ""),
                        "price": stock_data.get("price", 0),
                        "change": stock_data.get("change", 0),
                        "change_percent": stock_data.get("change_percent", 0),
                        "volume": stock_data.get("volume", 0),
                        "market_cap": stock_data.get("market_cap", 0),
                        "pe_ratio": stock_data.get("pe_ratio", 0),
                        "sector": stock_data.get("sector", ""),
                        "industry": stock_data.get("industry", ""),
                        "updated_at": datetime.now().isoformat()
                    }
                    
                    if existing_stock:
                        # Update existing stock
                        await supabase.update(
                            "stocks",
                            stock_info,
                            {"symbol": symbol}
                        )
                    else:
                        # Insert new stock
                        await supabase.insert("stocks", stock_info)
                    
                    logger.info(f"Stock data for {symbol} updated successfully")
                except Exception as e:
                    logger.error(f"Error updating stocks table for {symbol}: {str(e)}")
            else:
                logger.warning(f"Failed to fetch stock data for {symbol}")
                
            # Sleep to avoid rate limiting
            await asyncio.sleep(1)
        
        except Exception as e:
            logger.error(f"Error updating stock data for {symbol}: {str(e)}")

async def update_index_movers():
    """Update index movers data for important indices"""
    for index in INDICES:
        try:
            logger.info(f"Updating index movers for {index}")
            movers_data = await fetch_index_movers(index)
            
            if movers_data:
                # Cache the data
                cache_key = f"index_movers_{index}"
                await set_cached_data(cache_key, movers_data)
                logger.info(f"Index movers for {index} updated successfully")
            else:
                logger.warning(f"Failed to fetch index movers for {index}")
                
            # Sleep to avoid rate limiting
            await asyncio.sleep(1)
        
        except Exception as e:
            logger.error(f"Error updating index movers for {index}: {str(e)}")

async def main():
    """Main function to update all market data"""
    logger.info("Starting market data update")
    
    try:
        # Check Supabase connection
        logger.info("Checking Supabase connection")
        try:
            # Simple query to check connection
            await supabase.select("cache", "count(*)", None, 1)
            logger.info("Supabase connection successful")
        except Exception as e:
            logger.error(f"Supabase connection failed: {str(e)}")
            return
        
        # Update market overview
        await update_market_overview()
        
        # Update stock data
        await update_stock_data()
        
        # Update index movers
        await update_index_movers()
        
        logger.info("Market data update completed successfully")
    
    except Exception as e:
        logger.error(f"Error updating market data: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
