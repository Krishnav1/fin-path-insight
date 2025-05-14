#!/bin/bash
set -e

echo "Starting FinPath Insight application..."

# Navigate to the FastAPI backend directory
cd fastapi-backend

# Start the application with Uvicorn
echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
