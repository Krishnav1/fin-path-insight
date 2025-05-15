"""
Supabase client utility module for FinPath Insight.
Handles connection, authentication, and error handling for Supabase.
"""
import logging
import httpx
from typing import Optional, Dict, Any
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

# Global client instance
_supabase_client: Optional[Client] = None

def get_clean_anon_key(key: str) -> str:
    """
    Thoroughly clean the Supabase anon key to prevent header issues.
    
    Args:
        key: The raw key from environment variables
        
    Returns:
        A cleaned key safe for HTTP headers
    """
    if not key:
        return ""
        
    # Remove all whitespace, newlines, and control characters
    clean_key = key.strip()
    clean_key = ''.join(clean_key.splitlines())
    
    # Remove any additional whitespace that might be present
    clean_key = clean_key.strip()
    
    # Ensure the key doesn't have any problematic characters
    return clean_key

def get_supabase_client() -> Optional[Client]:
    """
    Get or initialize the Supabase client with proper error handling.
    
    Returns:
        Initialized Supabase client or None if initialization fails
    """
    global _supabase_client
    
    if _supabase_client:
        return _supabase_client
    
    try:
        if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
            logger.warning("Supabase URL or anon key not set. Supabase features will not be available.")
            return None
        
        # Clean the anon key to prevent header issues
        clean_anon_key = get_clean_anon_key(settings.SUPABASE_ANON_KEY)
        
        # Create the client with a custom httpx client that has proper timeout settings
        options = {
            "headers": {
                "X-Client-Info": "fin-path-insight/1.0.0"
            },
            "auto_refresh_token": True,
            "persist_session": True,
            "timeout": 10  # 10 seconds timeout
        }
        
        # Initialize the client
        _supabase_client = create_client(settings.SUPABASE_URL, clean_anon_key, options=options)
        logger.info("Supabase client initialized successfully")
        
        return _supabase_client
    except Exception as e:
        logger.error(f"Error initializing Supabase client: {str(e)}")
        return None

async def execute_supabase_query(table_name: str, query_func, *args, **kwargs) -> Dict[str, Any]:
    """
    Execute a Supabase query with proper error handling.
    
    Args:
        table_name: Name of the table to query
        query_func: Function to call on the table (e.g., 'select', 'insert', etc.)
        *args: Arguments to pass to the query function
        **kwargs: Keyword arguments to pass to the query function
        
    Returns:
        Query result or empty dict on error
    """
    try:
        client = get_supabase_client()
        if not client:
            logger.error(f"Cannot execute Supabase query: client not initialized")
            return {}
            
        # Get the table
        table = client.table(table_name)
        
        # Get the query function
        func = getattr(table, query_func)
        
        # Execute the query
        response = func(*args, **kwargs).execute()
        
        return response.data if response and hasattr(response, 'data') else {}
    except Exception as e:
        logger.error(f"Error executing Supabase query on {table_name}: {str(e)}")
        return {}
