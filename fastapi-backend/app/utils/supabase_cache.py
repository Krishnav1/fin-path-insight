import os
import logging
import json
import hashlib
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase_client: Optional[Client] = None

def init_supabase() -> Optional[Client]:
    """Initialize Supabase client"""
    global supabase_client
    
    if supabase_client:
        return supabase_client
    
    try:
        if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
            logger.warning("Supabase URL or anon key not set. Caching will not be available.")
            return None
        
        # Clean the anon key to remove any newlines or whitespace
        clean_anon_key = settings.SUPABASE_ANON_KEY.strip()
        
        supabase_client = create_client(settings.SUPABASE_URL, clean_anon_key)
        logger.info("Supabase client initialized successfully")
        
        # Create cache table if it doesn't exist
        try:
            # SQL to create the cache table if it doesn't exist with the new structure
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS public.cache (
                key TEXT PRIMARY KEY,
                value JSONB,
                created_at TIMESTAMPTZ DEFAULT current_timestamp
            );
            
            -- Add index on created_at for faster expiration checks
            CREATE INDEX IF NOT EXISTS cache_created_at_idx ON public.cache (created_at);
            """
            
            # Execute the SQL using Supabase's REST API
            supabase_client.table('cache').select('key').limit(1).execute()
            logger.info("Cache table exists")
        except Exception as table_error:
            if "relation \"public.cache\" does not exist" in str(table_error):
                logger.warning("Cache table does not exist. Creating it...")
                try:
                    # Use raw SQL query to create the table
                    response = supabase_client.rpc('exec_sql', {'query': create_table_sql}).execute()
                    logger.info("Cache table created successfully")
                except Exception as create_error:
                    logger.error(f"Error creating cache table: {str(create_error)}")
            else:
                logger.error(f"Error checking cache table: {str(table_error)}")
        
        return supabase_client
    except Exception as e:
        logger.error(f"Error initializing Supabase client: {str(e)}")
        return None

async def get_cached_data(key: str) -> Optional[Dict[str, Any]]:
    """
    Get data from Supabase cache
    
    Args:
        key: Cache key
        
    Returns:
        Cached data if found and not expired, None otherwise
    """
    try:
        client = init_supabase()
        if not client:
            return None
        
        try:
            # Query the cache table using the key directly
            response = client.table("cache").select("*").eq("key", key).execute()
            
            if response.data and len(response.data) > 0:
                cache_item = response.data[0]
                
                # Check if cache is expired (using TTL from settings)
                created_at = datetime.fromisoformat(cache_item["created_at"].replace("Z", "+00:00"))
                ttl = settings.SUPABASE_TTL_CACHE
                
                if datetime.now() - created_at < timedelta(seconds=ttl):
                    # Cache is still valid
                    return cache_item["value"]
                else:
                    # Cache is expired, delete it
                    try:
                        client.table("cache").delete().eq("key", key).execute()
                    except Exception as delete_error:
                        # Ignore deletion errors
                        logger.warning(f"Cache deletion failed: {str(delete_error)}")
        except Exception as cache_error:
            # If the cache table doesn't exist or other cache error, log and continue
            logger.warning(f"Cache retrieval failed: {str(cache_error)}")
        
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
        client = init_supabase()
        if not client:
            return False
        
        # Prepare cache item with the new schema
        cache_item = {
            "key": key,
            "value": data,
            # created_at will be set automatically by the database default
        }
        
        try:
            # Upsert to cache table
            client.table("cache").upsert(cache_item).execute()
            return True
        except Exception as cache_error:
            # If the cache table doesn't exist, log and continue
            logger.warning(f"Cache storage failed: {str(cache_error)}")
            return False
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
        client = init_supabase()
        if not client:
            return False
        
        try:
            # Delete from cache table using the key directly
            client.table("cache").delete().eq("key", key).execute()
            return True
        except Exception as cache_error:
            # If the cache table doesn't exist, log and continue
            logger.warning(f"Cache deletion failed: {str(cache_error)}")
            return False
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
        client = init_supabase()
        if not client:
            return False
        
        try:
            # Get all cache entries
            response = client.table("cache").select("*").execute()
            
            if response.data:
                now = datetime.now()
                ttl = settings.SUPABASE_TTL_CACHE
                
                for cache_item in response.data:
                    # Check if cache is expired
                    created_at = datetime.fromisoformat(cache_item["created_at"].replace("Z", "+00:00"))
                    
                    if now - created_at > timedelta(seconds=ttl):
                        # Delete expired cache entry
                        client.table("cache").delete().eq("key", cache_item["key"]).execute()
            
            return True
        except Exception as cache_error:
            # If the cache table doesn't exist, log and continue
            logger.warning(f"Cache clearing failed: {str(cache_error)}")
            return False
    except Exception as e:
        logger.error(f"Error clearing expired cache: {str(e)}")
        return False
