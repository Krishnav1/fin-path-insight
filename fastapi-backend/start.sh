#!/bin/bash
# start.sh - Start script for Render deployment

# Print environment information
echo "Starting FastAPI application..."
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"
echo "Files in directory:"
ls -la

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
  source .venv/bin/activate
  echo "Activated virtual environment"
fi

# Set default port if not provided
if [ -z "$PORT" ]; then
  export PORT=10000
  echo "PORT not set, defaulting to $PORT"
fi

# Add fastapi-backend directory to PYTHONPATH
export PYTHONPATH="$(pwd)"
echo "PYTHONPATH set to: $PYTHONPATH"

# Install critical packages if they're missing
echo "Checking for critical packages..."
python -c "import fastapi" 2>/dev/null || pip install fastapi==0.104.1
python -c "import uvicorn" 2>/dev/null || pip install uvicorn==0.24.0
python -c "import gunicorn" 2>/dev/null || pip install gunicorn==21.2.0
python -c "import httpx" 2>/dev/null || pip install httpx==0.25.1
python -c "import requests" 2>/dev/null || pip install requests==2.31.0
python -c "import aiohttp" 2>/dev/null || pip install aiohttp==3.9.1
python -c "import pandas" 2>/dev/null || pip install pandas==2.1.4
python -c "import numpy" 2>/dev/null || pip install numpy==1.26.2

# Ensure all dependencies are installed
echo "Installing all dependencies from requirements.txt..."
pip install -r requirements.txt

# Verify FastAPI installation and imports
python -c "import fastapi; print('FastAPI version:', fastapi.__version__)" || echo "WARNING: FastAPI not found"

# Try to start the FastAPI application
echo "Attempting to start FastAPI application..."

# First try: uvicorn directly from .venv/bin
if [ -f ".venv/bin/uvicorn" ]; then
  echo "Starting with .venv/bin/uvicorn..."
  exec .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $PORT
  exit 0
fi

# Second try: uvicorn directly
if command -v uvicorn &> /dev/null; then
  echo "Starting with uvicorn command..."
  exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
  exit 0
fi

# Third try: python -m uvicorn
echo "uvicorn command not found, trying python -m uvicorn"
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
if [ $? -eq 0 ]; then
  exit 0
fi

# Fourth try: gunicorn with uvicorn worker
echo "Trying gunicorn with uvicorn worker..."
if command -v gunicorn &> /dev/null; then
  exec gunicorn app.main:app -b 0.0.0.0:$PORT -k uvicorn.workers.UvicornWorker
  exit 0
fi

# Fifth try: direct python execution
echo "Trying direct Python execution..."
python -c "import uvicorn; uvicorn.run('app.main:app', host='0.0.0.0', port=$PORT)"
if [ $? -eq 0 ]; then
  exit 0
fi

echo "ERROR: Could not start the FastAPI application"
exit 1
