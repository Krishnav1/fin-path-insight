import os
import logging
import json
import hashlib
from typing import Dict, Any, Optional, List, Union
from datetime import datetime, timedelta, timezone
from app.core.config import settings
from app.db.supabase import supabase

logger = logging.getLogger(__name__)

async def ensure_cache_table_exists() -> bool:
    """
    Ensure the cache table exists in Supabase
    
    Returns:
        True if the table exists or was created, False otherwise
    """
    try:
        # SQL to create the cache table with the correct structure
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS public.cache (
            key TEXT PRIMARY KEY,
            value JSONB,
            created_at TIMESTAMPTZ DEFAULT current_timestamp
        );
        
        -- Add index on created_at for faster expiration checks
        CREATE INDEX IF NOT EXISTS cache_created_at_idx ON public.cache (created_at);
        
        -- Enable row level security
        ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;
        
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
            await supabase.select("cache", "key", None, 1)
            logger.info("Cache table exists")
            return True
        except Exception as table_error:
            error_message = str(table_error).lower()
            if "does not exist" in error_message or "not found" in error_message:
                logger.warning("Cache table does not exist. Creating it...")
                try:
                    # Use raw SQL query to create the table
                    await supabase.execute_query(create_table_sql)
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
        filters = {"key": f"eq.{key}"}
        cache_data = await supabase.select("cache", "*", filters, 1)
        
        if cache_data and len(cache_data) > 0:
            cache_item = cache_data[0]
            
            # Check if cache is expired (using TTL from settings)
            created_at_str = cache_item.get("created_at")
            if not created_at_str:
                logger.warning(f"Cache item for key {key} has no created_at timestamp")
                return None
                
            # Handle different timestamp formats
            try:
                if "Z" in created_at_str:
                    created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                elif "+" in created_at_str or "-" in created_at_str[10:]:  # Check if timezone info exists
                    created_at = datetime.fromisoformat(created_at_str)
                else:
                    created_at = datetime.fromisoformat(created_at_str).replace(tzinfo=timezone.utc)
            except Exception as dt_error:
                logger.warning(f"Error parsing timestamp {created_at_str}: {str(dt_error)}")
                created_at = datetime.now(timezone.utc) - timedelta(seconds=settings.SUPABASE_TTL_CACHE + 1)  # Force expiration
            
            ttl = settings.SUPABASE_TTL_CACHE
            
            # Use datetime.now(timezone.utc) to get an aware datetime for comparison
            if datetime.now(timezone.utc) - created_at < timedelta(seconds=ttl):
                # Cache is still valid
                return cache_item["value"]
            else:
                # Cache is expired, delete it
                try:
                    filters = {"key": f"eq.{key}"}
                    await supabase.delete("cache", filters)
                    logger.debug(f"Deleted expired cache for key {key}")
                except Exception as delete_error:
                    # Ignore deletion errors
                    logger.warning(f"Cache deletion failed: {str(delete_error)}")
        
        return None
    except Exception as e:
        logger.error(f"Error getting cached data for key {key}: {str(e)}")
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
        
        # Delete any existing cache entry first to ensure clean insert
        try:
            filters = {"key": f"eq.{key}"}
            await supabase.delete("cache", filters)
        except Exception as delete_error:
            logger.debug(f"No existing cache to delete for key {key} or error: {str(delete_error)}")
        
        # Prepare cache item with the new schema
        cache_item = {
            "key": key,
            "value": data,
            # created_at will be set automatically by the database default
        }
        
        # Insert into cache table
        result = await supabase.insert("cache", cache_item)
        success = bool(result)
        
        if success:
            logger.debug(f"Successfully cached data for key {key}")
        else:
            logger.warning(f"Failed to cache data for key {key}")
            
        return success
    except Exception as e:
        logger.error(f"Error setting cached data for key {key}: {str(e)}")
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
        filters = {"key": f"eq.{key}"}
        await supabase.delete("cache", filters)
        logger.debug(f"Deleted cache for key {key}")
        return True  # Even if no rows were deleted, consider it a success
    except Exception as e:
        logger.error(f"Error deleting cached data for key {key}: {str(e)}")
        return False

async def clear_expired_cache() -> int:
    """
    Clear expired cache entries
    
    Returns:
        Number of deleted entries, or -1 if an error occurred
    """
    try:
        # Ensure the cache table exists
        if not await ensure_cache_table_exists():
            return -1
        
        # More efficient approach using a direct SQL query
        ttl = settings.SUPABASE_TTL_CACHE
        delete_sql = f"""
        DELETE FROM public.cache 
        WHERE created_at < NOW() - INTERVAL '{ttl} seconds'
        RETURNING key;
        """
        
        try:
            # Execute the SQL directly
            result = await supabase.execute_query(delete_sql)
            deleted_count = len(result) if result else 0
            logger.info(f"Cleared {deleted_count} expired cache entries")
            return deleted_count
        except Exception as sql_error:
            logger.warning(f"Error executing SQL to clear expired cache: {str(sql_error)}")
            
            # Fallback to manual deletion if SQL fails
            deleted_count = 0
            cache_data = await supabase.select("cache", "*")
            
            if cache_data:
                now = datetime.now(timezone.utc)
                ttl = settings.SUPABASE_TTL_CACHE
                
                for cache_item in cache_data:
                    try:
                        created_at_str = cache_item.get("created_at")
                        if not created_at_str:
                            continue
                            
                        # Handle different timestamp formats
                        if "Z" in created_at_str:
                            created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                        elif "+" in created_at_str or "-" in created_at_str[10:]:  # Check if timezone info exists
                            created_at = datetime.fromisoformat(created_at_str)
                        else:
                            created_at = datetime.fromisoformat(created_at_str).replace(tzinfo=timezone.utc)
                        
                        if now - created_at > timedelta(seconds=ttl):
                            # Delete expired cache entry
                            filters = {"key": f"eq.{cache_item['key']}"}
                            await supabase.delete("cache", filters)
                            deleted_count += 1
                    except Exception as item_error:
                        logger.warning(f"Error processing cache item: {str(item_error)}")
                        continue
            
            logger.info(f"Cleared {deleted_count} expired cache entries using fallback method")
            return deleted_count
    except Exception as e:
        logger.error(f"Error clearing expired cache: {str(e)}")
        return -1
