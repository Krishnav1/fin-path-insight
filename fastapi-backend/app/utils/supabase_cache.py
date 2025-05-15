import os
import logging
import json
import hashlib
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from app.core.config import settings
from app.utils.supabase_client import get_supabase_client, execute_supabase_query

logger = logging.getLogger(__name__)

async def ensure_cache_table_exists() -> bool:
    """
    Ensure the cache table exists in Supabase
    
    Returns:
        True if the table exists or was created, False otherwise
    """
    try:
        client = get_supabase_client()
        if not client:
            return False
        
        # SQL to create the cache table with the correct structure
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS public.cache (
            key TEXT PRIMARY KEY,
            value JSONB,
            created_at TIMESTAMPTZ DEFAULT current_timestamp
        );
        
        -- Add index on created_at for faster expiration checks
        CREATE INDEX IF NOT EXISTS cache_created_at_idx ON public.cache (created_at);
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Allow public access to cache" ON public.cache;
        DROP POLICY IF EXISTS "Allow service role full access" ON public.cache;
        
        -- Create a single policy for all operations
        CREATE POLICY "Allow public access to cache" 
          ON public.cache
          FOR ALL
          USING (true);
        
        -- Ensure the service role has full access
        CREATE POLICY "Allow service role full access" 
          ON public.cache
          FOR ALL
          TO service_role
          USING (true);
        """
        
        # Try to check if the table exists first
        try:
            await execute_supabase_query('cache', 'select', 'key', limit=1)
            logger.info("Cache table exists")
            return True
        except Exception as table_error:
            if "relation \"public.cache\" does not exist" in str(table_error):
                logger.warning("Cache table does not exist. Creating it...")
                try:
                    # Use raw SQL query to create the table
                    client.rpc('exec_sql', {'query': create_table_sql}).execute()
                    logger.info("Cache table created successfully")
                    return True
                except Exception as create_error:
                    logger.error(f"Error creating cache table: {str(create_error)}")
                    return False
            else:
                logger.error(f"Error checking cache table: {str(table_error)}")
                return False
    except Exception as e:
        logger.error(f"Error ensuring cache table exists: {str(e)}")
        return False

async def get_cached_data(key: str) -> Optional[Dict[str, Any]]:
    """
    Get data from Supabase cache
    
    Args:
        key: Cache key
        
    Returns:
        Cached data if found and not expired, None otherwise
    """
    try:
        # Ensure the cache table exists
        if not await ensure_cache_table_exists():
            return None
        
        # Query the cache table using the key directly
        cache_data = await execute_supabase_query("cache", "select", "*", eq={"key": key})
        
        if cache_data and len(cache_data) > 0:
            cache_item = cache_data[0]
            
            # Check if cache is expired (using TTL from settings)
            created_at = datetime.fromisoformat(cache_item["created_at"].replace("Z", "+00:00"))
            ttl = settings.SUPABASE_TTL_CACHE
            
            # Use datetime.now(timezone.utc) to get an aware datetime for comparison
            if datetime.now(timezone.utc) - created_at < timedelta(seconds=ttl):
                # Cache is still valid
                return cache_item["value"]
            else:
                # Cache is expired, delete it
                try:
                    await execute_supabase_query("cache", "delete", eq={"key": key})
                except Exception as delete_error:
                    # Ignore deletion errors
                    logger.warning(f"Cache deletion failed: {str(delete_error)}")
        
        return None
    except Exception as e:
        logger.error(f"Error getting cached data: {str(e)}")
        return None

async def set_cached_data(key: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
    """
    Set data in Supabase cache
    
    Args:
        key: Cache key
        data: Data to cache
        ttl: Time to live in seconds (optional, not used with new schema but kept for compatibility)
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Ensure the cache table exists
        if not await ensure_cache_table_exists():
            return False
        
        # Prepare cache item with the new schema
        cache_item = {
            "key": key,
            "value": data,
            # created_at will be set automatically by the database default
        }
        
        # Upsert to cache table
        result = await execute_supabase_query("cache", "upsert", cache_item)
        return bool(result)
    except Exception as e:
        logger.error(f"Error setting cached data: {str(e)}")
        return False

async def delete_cached_data(key: str) -> bool:
    """
    Delete data from Supabase cache
    
    Args:
        key: Cache key
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Ensure the cache table exists
        if not await ensure_cache_table_exists():
            return False
        
        # Delete from cache table using the key directly
        result = await execute_supabase_query("cache", "delete", eq={"key": key})
        return True  # Even if no rows were deleted, consider it a success
    except Exception as e:
        logger.error(f"Error deleting cached data: {str(e)}")
        return False

async def clear_expired_cache() -> bool:
    """
    Clear expired cache entries
    
    Returns:
        True if successful, False otherwise
    """
    try:
        # Ensure the cache table exists
        if not await ensure_cache_table_exists():
            return False
        
        # Get all cache entries
        cache_data = await execute_supabase_query("cache", "select", "*")
        
        if cache_data:
            now = datetime.now(timezone.utc)
            ttl = settings.SUPABASE_TTL_CACHE
            
            for cache_item in cache_data:
                try:
                    # Check if cache is expired
                    created_at = datetime.fromisoformat(cache_item["created_at"].replace("Z", "+00:00"))
                    
                    if now - created_at > timedelta(seconds=ttl):
                        # Delete expired cache entry
                        await execute_supabase_query("cache", "delete", eq={"key": cache_item["key"]})
                except Exception as item_error:
                    logger.warning(f"Error processing cache item: {str(item_error)}")
                    continue
        
        # A more efficient approach would be to use a SQL query directly:
        # DELETE FROM cache WHERE created_at < NOW() - INTERVAL '{ttl} seconds'
        # But we'll use the above approach for consistency
        
        return True
    except Exception as e:
        logger.error(f"Error clearing expired cache: {str(e)}")
        return False
