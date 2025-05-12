#!/bin/bash
# Root start.sh - Redirects to the fastapi-backend start script

echo "Running root start.sh script"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Check if fastapi-backend directory exists
if [ -d "fastapi-backend" ]; then
    echo "Found fastapi-backend directory, navigating to it..."
    cd fastapi-backend
    
    # Check if start.sh exists in fastapi-backend
    if [ -f "start.sh" ]; then
        echo "Found start.sh in fastapi-backend, making it executable and running it..."
        chmod +x ./start.sh
        ./start.sh
    else
        echo "start.sh not found in fastapi-backend directory!"
        echo "Contents of fastapi-backend directory:"
        ls -la
        
        # Fallback: Start the application directly
        echo "Fallback: Starting application directly..."
        if [ -f "app.py" ]; then
            python app.py
        else
            python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
        fi
    fi
else
    echo "fastapi-backend directory not found!"
    echo "Attempting to start from root directory..."
    
    # Try to find and run the app
    if [ -f "app.py" ]; then
        python app.py
    elif [ -d "app" ] && [ -f "app/main.py" ]; then
        python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
    else
        echo "ERROR: Could not find FastAPI application entry point!"
        exit 1
    fi
fi
