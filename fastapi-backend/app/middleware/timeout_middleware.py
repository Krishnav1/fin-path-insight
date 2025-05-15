"""
Timeout Middleware
Middleware to prevent long-running requests
"""

import asyncio
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class TimeoutMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, timeout=30):
        super().__init__(app)
        self.timeout = timeout
    
    async def dispatch(self, request: Request, call_next):
        try:
            # Use asyncio.wait_for to enforce timeout
            response = await asyncio.wait_for(
                call_next(request), 
                timeout=self.timeout
            )
            return response
        except asyncio.TimeoutError:
            # Log the timeout
            logger.error(f"Request timeout: {request.method} {request.url.path} exceeded {self.timeout}s timeout")
            
            # Return a 504 Gateway Timeout response
            return JSONResponse(
                status_code=504,
                content={
                    "detail": f"Request timeout: operation took longer than {self.timeout} seconds",
                    "error_code": "request_timeout",
                    "path": request.url.path
                }
            )
        except Exception as e:
            # Log any other exceptions
            logger.error(f"Error in timeout middleware: {str(e)}")
            
            # Return a 500 Internal Server Error response
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error",
                    "error_code": "internal_server_error",
                    "path": request.url.path
                }
            )
