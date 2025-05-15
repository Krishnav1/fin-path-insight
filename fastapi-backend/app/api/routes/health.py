"""
Health Check Routes
Endpoints for monitoring application health and status
"""

from fastapi import APIRouter, Depends
from typing import Dict, Any
import logging
import os
import httpx
import time
from app.db.supabase import supabase
from app.core.config import settings
import platform
import psutil

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/")
async def health_check() -> Dict[str, Any]:
    """
    Comprehensive health check endpoint to verify all system components
    
    Returns:
        Health status of all components
    """
    start_time = time.time()
    
    # Initialize response
    response = {
        "status": "healthy",
        "components": {},
        "environment": settings.NODE_ENV or "development",
        "version": "1.0.0",
    }
    
    # Check Supabase connection
    try:
        supabase_start = time.time()
        await supabase.select("cache", "count(*)", None, 1)
        supabase_time = time.time() - supabase_start
        
        response["components"]["supabase"] = {
            "status": "healthy",
            "response_time_ms": round(supabase_time * 1000, 2),
            "message": "Supabase connection is working"
        }
    except Exception as e:
        logger.error(f"Supabase health check failed: {str(e)}")
        response["components"]["supabase"] = {
            "status": "unhealthy",
            "error": str(e),
            "message": "Supabase connection failed"
        }
        response["status"] = "degraded"
    
    # Check required tables
    required_tables = ["market_overview", "stocks", "news", "cache"]
    missing_tables = []
    
    for table in required_tables:
        try:
            table_start = time.time()
            data = await supabase.select(table, "count(*)", None, 1)
            table_time = time.time() - table_start
            
            response["components"][f"table_{table}"] = {
                "status": "healthy",
                "response_time_ms": round(table_time * 1000, 2),
                "message": f"Table {table} exists"
            }
        except Exception as e:
            logger.error(f"Table {table} check failed: {str(e)}")
            response["components"][f"table_{table}"] = {
                "status": "unhealthy",
                "error": str(e),
                "message": f"Table {table} does not exist or is inaccessible"
            }
            missing_tables.append(table)
            response["status"] = "degraded"
    
    if missing_tables:
        response["missing_tables"] = missing_tables
    
    # Check system resources
    try:
        response["system"] = {
            "cpu_usage_percent": psutil.cpu_percent(interval=0.1),
            "memory_usage_percent": psutil.virtual_memory().percent,
            "disk_usage_percent": psutil.disk_usage('/').percent,
            "platform": platform.platform(),
            "python_version": platform.python_version()
        }
    except Exception as e:
        logger.error(f"System resource check failed: {str(e)}")
        response["system"] = {
            "status": "error",
            "message": f"Failed to get system resources: {str(e)}"
        }
    
    # Check environment variables
    env_vars = {
        "SUPABASE_URL": settings.SUPABASE_URL is not None,
        "SUPABASE_ANON_KEY": settings.SUPABASE_ANON_KEY is not None,
        "FMP_API_KEY": settings.FMP_API_KEY is not None,
        "NEWS_API_KEY": settings.NEWS_API_KEY is not None
    }
    
    missing_vars = [var for var, exists in env_vars.items() if not exists]
    
    response["environment_variables"] = {
        "status": "healthy" if not missing_vars else "degraded",
        "missing": missing_vars if missing_vars else None
    }
    
    # Calculate total response time
    response["response_time_ms"] = round((time.time() - start_time) * 1000, 2)
    
    return response

@router.get("/ready")
async def readiness_check() -> Dict[str, Any]:
    """
    Simple readiness check for kubernetes/container orchestration
    
    Returns:
        Readiness status
    """
    return {
        "status": "ready",
        "timestamp": time.time()
    }

@router.get("/live")
async def liveness_check() -> Dict[str, Any]:
    """
    Simple liveness check for kubernetes/container orchestration
    
    Returns:
        Liveness status
    """
    return {
        "status": "alive",
        "timestamp": time.time()
    }
