"""
Root app.py - Simple entry point for Render deployment
This file helps Render find and run the FastAPI application
"""

import os
import sys

# Add the fastapi-backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'fastapi-backend'))

# Try to import the FastAPI app
try:
    from fastapi_backend.app.main import app
except ImportError:
    try:
        from app.main import app
    except ImportError:
        # If the import fails, create a simple FastAPI app
        from fastapi import FastAPI
        app = FastAPI(title="FinPath Insight API")
        
        @app.get("/")
        async def root():
            return {
                "message": "FinPath Insight API is running",
                "status": "ok",
                "paths": os.listdir(),
                "python_path": sys.path
            }

# If running this file directly, start the server
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, log_level="info")
