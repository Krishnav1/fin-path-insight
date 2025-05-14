git#!/bin/bash
# Root start.sh - Starts the FastAPI application

echo "Starting FastAPI application..."
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"
echo "Files in directory:"
ls -la

# Ensure uvicorn is installed
echo "Checking if uvicorn is installed..."
if ! python -m pip list | grep -q uvicorn; then
    echo "uvicorn not found, installing it..."
    python -m pip install uvicorn gunicorn fastapi
fi

# Set default port if not provided
if [ -z "$PORT" ]; then
    export PORT=10000
    echo "PORT not set, defaulting to $PORT"
fi

# Set PYTHONPATH to include the current directory
export PYTHONPATH=$PYTHONPATH:$(pwd)
echo "PYTHONPATH set to: $PYTHONPATH"

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
            echo "Starting with app.py..."
            python app.py
        elif [ -d "app" ] && [ -f "app/main.py" ]; then
            echo "Starting with app/main.py..."
            # Try multiple methods to start uvicorn
            if command -v uvicorn &> /dev/null; then
                echo "Using uvicorn command..."
                uvicorn app.main:app --host 0.0.0.0 --port $PORT
            elif command -v gunicorn &> /dev/null; then
                echo "Using gunicorn with uvicorn worker..."
                gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app -b 0.0.0.0:$PORT
            else
                echo "Using python -m uvicorn..."
                python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
            fi
        else
            echo "No app.py or app/main.py found, searching for Python files..."
            find . -name "*.py" -type f | grep -v "__pycache__"
            
            # Last resort: Try to find any FastAPI app
            MAIN_PY=$(find . -name "main.py" -type f | head -n 1)
            if [ -n "$MAIN_PY" ]; then
                echo "Found a main.py at $MAIN_PY, attempting to start..."
                MAIN_DIR=$(dirname "$MAIN_PY")
                MODULE_PATH=$(echo "$MAIN_DIR" | sed 's/^\.\///g' | sed 's/\//./g')
                if [ -z "$MODULE_PATH" ]; then
                    python -m uvicorn main:app --host 0.0.0.0 --port $PORT
                else
                    python -m uvicorn "$MODULE_PATH".main:app --host 0.0.0.0 --port $PORT
                fi
            else
                echo "ERROR: Could not find any FastAPI application entry point!"
                exit 1
            fi
        fi
    fi
else
    echo "fastapi-backend directory not found!"
    echo "Attempting to start from root directory..."
    
    # Try to find and run the app
    if [ -f "app.py" ]; then
        echo "Starting with app.py in root directory..."
        python app.py
    elif [ -d "app" ] && [ -f "app/main.py" ]; then
        echo "Starting with app/main.py in root directory..."
        # Try multiple methods to start uvicorn
        if command -v uvicorn &> /dev/null; then
            echo "Using uvicorn command..."
            uvicorn app.main:app --host 0.0.0.0 --port $PORT
        elif command -v gunicorn &> /dev/null; then
            echo "Using gunicorn with uvicorn worker..."
            gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app -b 0.0.0.0:$PORT
        else
            echo "Using python -m uvicorn..."
            python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
        fi
    else
        echo "No app.py or app/main.py found in root, searching for Python files..."
        find . -name "*.py" -type f | grep -v "__pycache__"
        
        # Last resort: Try to find any FastAPI app
        MAIN_PY=$(find . -name "main.py" -type f | head -n 1)
        if [ -n "$MAIN_PY" ]; then
            echo "Found a main.py at $MAIN_PY, attempting to start..."
            MAIN_DIR=$(dirname "$MAIN_PY")
            MODULE_PATH=$(echo "$MAIN_DIR" | sed 's/^\.\///g' | sed 's/\//./g')
            if [ -z "$MODULE_PATH" ]; then
                python -m uvicorn main:app --host 0.0.0.0 --port $PORT
            else
                python -m uvicorn "$MODULE_PATH".main:app --host 0.0.0.0 --port $PORT
            fi
        else
            echo "ERROR: Could not find any FastAPI application entry point!"
            exit 1
        fi
    fi
fi
