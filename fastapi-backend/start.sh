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

# Verify FastAPI installation and imports
python -c "import fastapi; from app.core.config import settings; print('FastAPI version:', fastapi.__version__)"

# Try to start the FastAPI application
echo "Attempting to start FastAPI application..."

# First try: uvicorn directly
if command -v uvicorn &> /dev/null; then
  echo "Starting with uvicorn command..."
  exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
  exit 0
fi

# Second try: python -m uvicorn
echo "uvicorn command not found, trying python -m uvicorn"
if python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT; then
  exit 0
fi

# Third try: gunicorn with uvicorn worker
echo "Trying gunicorn with uvicorn worker..."
if command -v gunicorn &> /dev/null; then
  exec gunicorn app.main:app -b 0.0.0.0:$PORT -k uvicorn.workers.UvicornWorker
  exit 0
fi

echo "ERROR: Could not start the FastAPI application"
exit 1

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
