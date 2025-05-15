"""
Database Update Script
Creates and updates required tables in Supabase
"""

import os
import sys
import asyncio
import logging
from pathlib import Path

# Add the parent directory to the path so we can import from app
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.db.supabase import supabase
from app.core.config import settings
from app.utils.supabase_cache import ensure_cache_table_exists

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

async def create_market_overview_table():
    """Create the market_overview table if it doesn't exist"""
    try:
        # Check if table exists
        try:
            await supabase.select("market_overview", "count(*)", None, 1)
            logger.info("market_overview table exists")
            return True
        except Exception as e:
            if "does not exist" in str(e).lower() or "not found" in str(e).lower():
                logger.warning("market_overview table does not exist. Creating it...")
                
                # SQL to create the market_overview table
                create_table_sql = """
                CREATE TABLE IF NOT EXISTS public.market_overview (
                  id SERIAL PRIMARY KEY,
                  market TEXT NOT NULL,
                  indices JSONB NOT NULL,
                  breadth JSONB NOT NULL,
                  updated_at TIMESTAMPTZ DEFAULT current_timestamp
                );
                
                -- Add comment to the table for documentation
                COMMENT ON TABLE public.market_overview IS 'Market overview data for different markets (india, us, global)';
                
                -- Create index on market for faster queries
                CREATE INDEX IF NOT EXISTS market_overview_market_idx ON public.market_overview (market);
                
                -- Enable row level security
                ALTER TABLE public.market_overview ENABLE ROW LEVEL SECURITY;
                
                -- Create policies for public access
                CREATE POLICY "Allow public access to market_overview" 
                  ON public.market_overview
                  FOR ALL
                  USING (true);
                """
                
                # Execute the SQL
                await supabase.execute_query(create_table_sql)
                logger.info("market_overview table created successfully")
                return True
            else:
                logger.error(f"Error checking market_overview table: {str(e)}")
                return False
    except Exception as e:
        logger.error(f"Error creating market_overview table: {str(e)}")
        return False

async def create_stocks_table():
    """Create the stocks table if it doesn't exist"""
    try:
        # Check if table exists
        try:
            await supabase.select("stocks", "count(*)", None, 1)
            logger.info("stocks table exists")
            return True
        except Exception as e:
            if "does not exist" in str(e).lower() or "not found" in str(e).lower():
                logger.warning("stocks table does not exist. Creating it...")
                
                # SQL to create the stocks table
                create_table_sql = """
                CREATE TABLE IF NOT EXISTS public.stocks (
                  id SERIAL PRIMARY KEY,
                  symbol TEXT NOT NULL UNIQUE,
                  name TEXT NOT NULL,
                  price DECIMAL(15, 2),
                  change DECIMAL(15, 2),
                  change_percent DECIMAL(10, 2),
                  volume BIGINT,
                  market_cap DECIMAL(20, 2),
                  pe_ratio DECIMAL(10, 2),
                  sector TEXT,
                  industry TEXT,
                  updated_at TIMESTAMPTZ DEFAULT current_timestamp
                );
                
                -- Add comment to the table for documentation
                COMMENT ON TABLE public.stocks IS 'Stock data for various companies';
                
                -- Create index on symbol for faster queries
                CREATE INDEX IF NOT EXISTS stocks_symbol_idx ON public.stocks (symbol);
                
                -- Enable row level security
                ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
                
                -- Create policies for public access
                CREATE POLICY "Allow public access to stocks" 
                  ON public.stocks
                  FOR ALL
                  USING (true);
                """
                
                # Execute the SQL
                await supabase.execute_query(create_table_sql)
                logger.info("stocks table created successfully")
                return True
            else:
                logger.error(f"Error checking stocks table: {str(e)}")
                return False
    except Exception as e:
        logger.error(f"Error creating stocks table: {str(e)}")
        return False

async def create_news_table():
    """Create the news table if it doesn't exist"""
    try:
        # Check if table exists
        try:
            await supabase.select("news", "count(*)", None, 1)
            logger.info("news table exists")
            return True
        except Exception as e:
            if "does not exist" in str(e).lower() or "not found" in str(e).lower():
                logger.warning("news table does not exist. Creating it...")
                
                # SQL to create the news table
                create_table_sql = """
                CREATE TABLE IF NOT EXISTS public.news (
                  id SERIAL PRIMARY KEY,
                  title TEXT NOT NULL,
                  content TEXT,
                  summary TEXT,
                  url TEXT,
                  image_url TEXT,
                  source TEXT,
                  author TEXT,
                  market TEXT,
                  company TEXT,
                  published_at TIMESTAMPTZ,
                  created_at TIMESTAMPTZ DEFAULT current_timestamp
                );
                
                -- Add comment to the table for documentation
                COMMENT ON TABLE public.news IS 'News articles related to markets and companies';
                
                -- Create indexes for faster queries
                CREATE INDEX IF NOT EXISTS news_published_at_idx ON public.news (published_at);
                CREATE INDEX IF NOT EXISTS news_market_idx ON public.news (market);
                CREATE INDEX IF NOT EXISTS news_company_idx ON public.news (company);
                
                -- Enable row level security
                ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
                
                -- Create policies for public access
                CREATE POLICY "Allow public access to news" 
                  ON public.news
                  FOR ALL
                  USING (true);
                """
                
                # Execute the SQL
                await supabase.execute_query(create_table_sql)
                logger.info("news table created successfully")
                return True
            else:
                logger.error(f"Error checking news table: {str(e)}")
                return False
    except Exception as e:
        logger.error(f"Error creating news table: {str(e)}")
        return False

async def insert_sample_data():
    """Insert sample data into the tables if they are empty"""
    try:
        # Check if market_overview table is empty
        market_overview_data = await supabase.select("market_overview", "*", None, 1)
        if not market_overview_data:
            logger.info("Inserting sample data into market_overview table")
            
            # Sample data for Indian market
            sample_data = {
                "market": "india",
                "indices": [
                    {
                        "name": "NIFTY 50",
                        "value": 22345.60,
                        "change": 123.45,
                        "change_percent": 0.55,
                        "timestamp": "2025-05-15T09:30:00+05:30"
                    },
                    {
                        "name": "NIFTY BANK",
                        "value": 48765.30,
                        "change": -156.70,
                        "change_percent": -0.32,
                        "timestamp": "2025-05-15T09:30:00+05:30"
                    },
                    {
                        "name": "NIFTY IT",
                        "value": 37890.25,
                        "change": 345.60,
                        "change_percent": 0.92,
                        "timestamp": "2025-05-15T09:30:00+05:30"
                    },
                    {
                        "name": "INDIA VIX",
                        "value": 14.25,
                        "change": -0.75,
                        "change_percent": -5.00,
                        "timestamp": "2025-05-15T09:30:00+05:30"
                    }
                ],
                "breadth": {
                    "advances": 1234,
                    "declines": 876,
                    "unchanged": 123
                }
            }
            
            await supabase.insert("market_overview", sample_data)
            logger.info("Sample data inserted into market_overview table")
        
        # Check if stocks table is empty
        stocks_data = await supabase.select("stocks", "*", None, 1)
        if not stocks_data:
            logger.info("Inserting sample data into stocks table")
            
            # Sample stock data
            sample_stocks = [
                {
                    "symbol": "RELIANCE.NS",
                    "name": "Reliance Industries Ltd.",
                    "price": 2987.30,
                    "change": 67.80,
                    "change_percent": 2.32,
                    "volume": 12345678,
                    "market_cap": 1876543000000,
                    "pe_ratio": 22.5,
                    "sector": "Energy",
                    "industry": "Oil & Gas"
                },
                {
                    "symbol": "HDFCBANK.NS",
                    "name": "HDFC Bank Ltd.",
                    "price": 1678.45,
                    "change": 45.60,
                    "change_percent": 2.79,
                    "volume": 8765432,
                    "market_cap": 932145000000,
                    "pe_ratio": 18.7,
                    "sector": "Financial Services",
                    "industry": "Banking"
                }
            ]
            
            for stock in sample_stocks:
                await supabase.insert("stocks", stock)
            
            logger.info("Sample data inserted into stocks table")
        
        # Check if news table is empty
        news_data = await supabase.select("news", "*", None, 1)
        if not news_data:
            logger.info("Inserting sample data into news table")
            
            # Sample news data
            sample_news = [
                {
                    "title": "RBI Maintains Repo Rate at 6.5%",
                    "content": "The Reserve Bank of India (RBI) has decided to maintain the repo rate at 6.5% in its latest monetary policy meeting.",
                    "summary": "RBI keeps rates unchanged",
                    "url": "https://example.com/rbi-news",
                    "image_url": "https://example.com/rbi-image.jpg",
                    "source": "Financial Times",
                    "author": "John Doe",
                    "market": "india",
                    "company": None,
                    "published_at": "2025-05-14T10:30:00+05:30"
                },
                {
                    "title": "Reliance Industries Reports Strong Q1 Results",
                    "content": "Reliance Industries Limited reported a 15% increase in net profit for Q1 FY2026, beating market expectations.",
                    "summary": "Reliance Q1 results exceed expectations",
                    "url": "https://example.com/reliance-news",
                    "image_url": "https://example.com/reliance-image.jpg",
                    "source": "Economic Times",
                    "author": "Jane Smith",
                    "market": "india",
                    "company": "RELIANCE.NS",
                    "published_at": "2025-05-13T14:45:00+05:30"
                }
            ]
            
            for news in sample_news:
                await supabase.insert("news", news)
            
            logger.info("Sample data inserted into news table")
        
    except Exception as e:
        logger.error(f"Error inserting sample data: {str(e)}")

async def main():
    """Main function to update the database"""
    logger.info("Starting database update")
    
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
        
        # Ensure cache table exists
        logger.info("Ensuring cache table exists")
        cache_exists = await ensure_cache_table_exists()
        if not cache_exists:
            logger.error("Failed to create cache table")
            return
        
        # Create required tables
        logger.info("Creating required tables")
        market_overview_exists = await create_market_overview_table()
        stocks_exists = await create_stocks_table()
        news_exists = await create_news_table()
        
        if market_overview_exists and stocks_exists and news_exists:
            logger.info("All required tables exist")
            
            # Insert sample data if tables are empty
            await insert_sample_data()
            
            logger.info("Database update completed successfully")
        else:
            logger.error("Failed to create all required tables")
    
    except Exception as e:
        logger.error(f"Error updating database: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
