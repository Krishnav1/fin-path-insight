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

# Approach 1: Try the minimal app first (most reliable)
if [ -f "minimal_app.py" ]; then
    echo "Using minimal_app.py as a reliable fallback..."
    python -m uvicorn minimal_app:app --host 0.0.0.0 --port $PORT
    exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo "Minimal app started successfully!"
        exit 0
    else
        echo "Minimal app failed with exit code $exit_code, trying other methods..."
    fi
fi

# Approach 2: Check if uvicorn is available and use it directly with the main app
if command -v uvicorn &> /dev/null; then
    echo "Uvicorn found in PATH, trying main app..."
    uvicorn app.main:app --host 0.0.0.0 --port $PORT
    exit_code=$?
    if [ $exit_code -eq 0 ]; then
        exit 0
    else
        echo "Direct uvicorn call failed with exit code $exit_code, trying other methods..."
    fi
fi

# Approach 3: Try to install dependencies again and use python -m uvicorn
echo "Installing core dependencies again..."
pip install --upgrade pip
pip install fastapi==0.104.1 uvicorn==0.24.0 httpx==0.23.3 pydantic==2.4.2 python-dotenv==1.0.0 pydantic-settings==2.0.3

echo "Trying python -m uvicorn with main app..."
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
exit_code=$?
if [ $exit_code -eq 0 ]; then
    exit 0
else
    echo "Python -m uvicorn failed with exit code $exit_code, trying other methods..."
fi

# Approach 4: Use start.py
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

# Approach 5: Emergency dependency installer
if [ -f "install_dependencies.py" ]; then
    echo "Using emergency dependency installer..."
    python install_dependencies.py
    exit_code=$?
    if [ $exit_code -eq 0 ]; then
        exit 0
    fi
fi

# Approach 6: Last resort - run the minimal app directly with python
if [ -f "minimal_app.py" ]; then
    echo "Last resort: Running minimal_app.py directly with Python..."
    python minimal_app.py
    exit 0
fi

echo "All approaches failed. Please check the logs for more information."
exit 1
