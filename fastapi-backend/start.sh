#!/bin/bash
# start.sh - Start script for Render deployment

# Print environment information
echo "Starting FastAPI application..."
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"
echo "Files in directory:"
ls -la

# Set default port if not provided
if [ -z "$PORT" ]; then
  export PORT=10000
  echo "PORT not set, defaulting to $PORT"
fi

# Check if app directory exists
if [ -d "app" ]; then
  echo "app directory found"
else
  echo "ERROR: app directory not found"
  exit 1
fi

# Check if main.py exists in app directory
if [ -f "app/main.py" ]; then
  echo "app/main.py found"
else
  echo "ERROR: app/main.py not found"
  exit 1
fi

# Try different ways to start the application
echo "Attempting to start FastAPI application with uvicorn..."

# Method 1: Direct uvicorn command
if command -v uvicorn &> /dev/null; then
  echo "Starting with uvicorn directly"
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
else
  # Method 2: Python module
  echo "uvicorn command not found, trying python -m uvicorn"
  python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
fi
