from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
import json
import logging

logger = logging.getLogger(__name__)

class NewsResponseFormatterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        """
        Middleware to format news API responses to match frontend expectations.
        
        This middleware intercepts responses from news endpoints and transforms them
        to ensure compatibility with the frontend code.
        """
        response = await call_next(request)
        
        # Only process JSON responses from news endpoints
        if (
            response.status_code == 200 and
            "/api/news/" in request.url.path and
            response.headers.get("content-type") == "application/json"
        ):
            try:
                # Get the response body
                body = b""
                async for chunk in response.body_iterator:
                    body += chunk
                
                # Parse the JSON
                data = json.loads(body)
                
                # Format the response to return articles directly
                if "articles" in data:
                    # Ensure articles is always an array, even if empty
                    formatted_data = data["articles"] if isinstance(data["articles"], list) else []
                    
                    # Create a new response with the formatted data
                    return JSONResponse(
                        content=formatted_data,
                        status_code=response.status_code,
                        headers=dict(response.headers)
                    )
                elif isinstance(data, dict) and "status" in data and data.get("status") == "ok":
                    # Handle case where NewsAPI returns empty results
                    formatted_data = data.get("articles", [])
                    if not isinstance(formatted_data, list):
                        formatted_data = []
                    
                    return JSONResponse(
                        content=formatted_data,
                        status_code=response.status_code,
                        headers=dict(response.headers)
                    )
            except Exception as e:
                logger.error(f"Error formatting news response: {str(e)}")
                # Return an empty array in case of error to prevent frontend errors
                return JSONResponse(
                    content=[],
                    status_code=response.status_code,
                    headers=dict(response.headers)
                )
        
        return response
