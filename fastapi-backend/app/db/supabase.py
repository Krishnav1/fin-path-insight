"""
Supabase client for FastAPI backend
Provides database access using Supabase with robust error handling
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
import httpx
from dotenv import load_dotenv
from app.core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

# Create a client class for Supabase
class SupabaseClient:
    def __init__(self, url: Optional[str] = None, key: Optional[str] = None):
        """
        Initialize the Supabase client
        
        Args:
            url: Supabase URL (optional, defaults to environment variable)
            key: Supabase API key (optional, defaults to environment variable)
        """
        # Get URL and key from parameters or environment variables
        self.url = url or settings.SUPABASE_URL
        raw_key = key or settings.SUPABASE_ANON_KEY
        
        # Clean the key to prevent header issues
        self.key = self._clean_key(raw_key)
        
        # Set up headers
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        logger.info(f"Initialized Supabase client with URL: {self.url}")
    
    def _clean_key(self, key: str) -> str:
        """
        Clean the API key to prevent header issues
        
        Args:
            key: Raw API key
            
        Returns:
            Cleaned API key
        """
        if not key:
            return ""
            
        # Remove all whitespace, newlines, and control characters
        clean_key = key.strip()
        clean_key = ''.join(clean_key.splitlines())
        clean_key = clean_key.strip()
        
        return clean_key
    
    async def select(self, table: str, columns: str = "*", filters: Optional[Dict[str, Any]] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Select data from a table
        
        Args:
            table: Table name
            columns: Columns to select
            filters: Filters to apply
            limit: Maximum number of rows to return
            
        Returns:
            List of rows
        """
        url = f"{self.url}/rest/v1/{table}"
        params = {"select": columns, "limit": limit}
        
        # Add filters if provided
        if filters:
            for key, value in filters.items():
                params[key] = value
        
        try:
            # Use a timeout to prevent hanging requests
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=self.headers, params=params)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error during select from {table}: {e.response.status_code} - {e.response.text}")
            if e.response.status_code == 404:
                return []
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error during select from {table}: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error during select from {table}: {str(e)}")
            return []
    
    async def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Insert data into a table
        
        Args:
            table: Table name
            data: Data to insert
            
        Returns:
            Inserted row
        """
        url = f"{self.url}/rest/v1/{table}"
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, headers=self.headers, json=data)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error during insert into {table}: {e.response.status_code} - {e.response.text}")
            return {}
        except httpx.RequestError as e:
            logger.error(f"Request error during insert into {table}: {str(e)}")
            return {}
        except Exception as e:
            logger.error(f"Unexpected error during insert into {table}: {str(e)}")
            return {}
    
    async def update(self, table: str, data: Dict[str, Any], filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update data in a table
        
        Args:
            table: Table name
            data: Data to update
            filters: Filters to apply
            
        Returns:
            Updated row
        """
        url = f"{self.url}/rest/v1/{table}"
        params = filters
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.patch(url, headers=self.headers, params=params, json=data)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error during update of {table}: {e.response.status_code} - {e.response.text}")
            return {}
        except httpx.RequestError as e:
            logger.error(f"Request error during update of {table}: {str(e)}")
            return {}
        except Exception as e:
            logger.error(f"Unexpected error during update of {table}: {str(e)}")
            return {}
    
    async def delete(self, table: str, filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Delete data from a table
        
        Args:
            table: Table name
            filters: Filters to apply
            
        Returns:
            Deleted row
        """
        url = f"{self.url}/rest/v1/{table}"
        params = filters
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.delete(url, headers=self.headers, params=params)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error during delete from {table}: {e.response.status_code} - {e.response.text}")
            return {}
        except httpx.RequestError as e:
            logger.error(f"Request error during delete from {table}: {str(e)}")
            return {}
        except Exception as e:
            logger.error(f"Unexpected error during delete from {table}: {str(e)}")
            return {}
    
    async def execute_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Execute a raw SQL query
        
        Args:
            query: SQL query
            params: Query parameters
            
        Returns:
            Query results
        """
        url = f"{self.url}/rest/v1/rpc/execute_sql"
        data = {"query": query}
        
        if params:
            data["params"] = params
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, headers=self.headers, json=data)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error during SQL query execution: {e.response.status_code} - {e.response.text}")
            return []
        except httpx.RequestError as e:
            logger.error(f"Request error during SQL query execution: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error during SQL query execution: {str(e)}")
            return []

# Create a singleton instance with proper error handling
try:
    supabase = SupabaseClient()
    logger.info("Supabase client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {str(e)}")
    # Create a dummy client that will log errors but not crash the app
    supabase = SupabaseClient(url="https://example.com", key="dummy_key")

# Export the client
__all__ = ["supabase"]
