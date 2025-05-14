from fastapi import Request
from fastapi.responses import JSONResponse
from typing import Callable
import logging

logger = logging.getLogger(__name__)

async def format_news_response(request: Request, call_next: Callable):
    """
    Middleware to format news API responses to match frontend expectations.
    
    This middleware intercepts responses from news endpoints and transforms them
    to ensure compatibility with the frontend code.
    """
    # Process the request and get the response
    response = await call_next(request)
    
    # Only process JSON responses from news endpoints
    path = request.url.path
    if "/api/news/" in path and hasattr(response, "body"):
        try:
            # Get the response body
            body = await response.body()
            
            # If it's a JSON response, try to transform it
            if response.headers.get("content-type") == "application/json":
                import json
                data = json.loads(body)
                
                # If the response has the structure with articles inside
                if isinstance(data, dict) and "articles" in data and isinstance(data["articles"], list):
                    # Return just the articles array as the frontend expects
                    return JSONResponse(
                        content=data["articles"],
                        status_code=response.status_code,
                        headers=dict(response.headers)
                    )
        except Exception as e:
            logger.error(f"Error in response formatter middleware: {str(e)}")
    
    # Return the original response if we didn't modify it
    return response
