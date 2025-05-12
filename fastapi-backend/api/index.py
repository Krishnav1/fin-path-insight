from fastapi import FastAPI
import sys
import os
from pathlib import Path

# Add parent directory to path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app as fastapi_app

# This file is used by Vercel to deploy the FastAPI application
# It simply imports and re-exports the FastAPI app from app/main.py

app = fastapi_app
