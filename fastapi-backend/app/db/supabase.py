"""
Supabase client for FastAPI backend
Provides database access using Supabase
"""

import os
from typing import Dict, List, Any, Optional
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ydakwyplcqoshxcdllah.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYWt3eXBsY3Fvc2h4Y2RsbGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTAwNTMsImV4cCI6MjA2Mjc4NjA1M30.J0c0YqSsR9XbtbYLVOq6oqQwYQ3G7j65Q0stEtS4W2s"))

# Create a client class for Supabase
class SupabaseClient:
    def __init__(self, url: str, key: str):
        self.url = url
        self.key = key
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
    
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
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json()
    
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
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=self.headers, json=data)
            response.raise_for_status()
            return response.json()
    
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
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(url, headers=self.headers, params=params, json=data)
            response.raise_for_status()
            return response.json()
    
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
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json()
    
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
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=self.headers, json=data)
            response.raise_for_status()
            return response.json()

# Create a singleton instance
supabase = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)

# Export the client
__all__ = ["supabase"]
