#!/bin/bash
# Start script for FastAPI backend on Render

echo "Starting FinPath Insight FastAPI backend..."

# Debug information
echo "Python version:"
python --version
echo "Current directory:"
pwd
echo "Directory contents:"
ls -la
echo "Environment variables:"
printenv | grep -E 'PORT|SUPABASE|DATABASE|FASTAPI'

# Try multiple approaches to start the application

# Approach 1: Check if uvicorn is available and use it directly
if command -v uvicorn &> /dev/null; then
    echo "Uvicorn found in PATH, using it directly..."
    uvicorn app.main:app --host 0.0.0.0 --port $PORT
    exit_code=$?
    if [ $exit_code -eq 0 ]; then
        exit 0
    else
        echo "Direct uvicorn call failed with exit code $exit_code, trying other methods..."
    fi
fi

# Approach 2: Try to install dependencies again and use python -m uvicorn
echo "Installing core dependencies again..."
pip install --upgrade pip
pip install fastapi uvicorn httpx pydantic python-dotenv

echo "Trying python -m uvicorn..."
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
exit_code=$?
if [ $exit_code -eq 0 ]; then
    exit 0
else
    echo "Python -m uvicorn failed with exit code $exit_code, trying other methods..."
fi

# Approach 3: Use start.py
if [ -f "start.py" ]; then
    echo "Using start.py to launch the application..."
    python start.py
    exit_code=$?
    if [ $exit_code -eq 0 ]; then
        exit 0
    else
        echo "start.py failed with exit code $exit_code, trying emergency installer..."
    fi
fi

# Approach 4: Emergency dependency installer
if [ -f "install_dependencies.py" ]; then
    echo "Using emergency dependency installer..."
    python install_dependencies.py
    exit_code=$?
    if [ $exit_code -eq 0 ]; then
        exit 0
    fi
fi

echo "All approaches failed. Please check the logs for more information."
exit 1
