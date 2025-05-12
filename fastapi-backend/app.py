# app.py - Entry point for Render deployment
# This file helps Render identify the application

import os
from app.main import app

# This file simply imports the FastAPI app from app.main
# If running this file directly, it will start the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
