#!/bin/bash
# Start script for FastAPI backend on Render

echo "Starting FinPath Insight FastAPI backend..."

# Start the FastAPI application
uvicorn app.main:app --host 0.0.0.0 --port $PORT
