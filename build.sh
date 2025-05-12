#!/bin/bash
# Root build.sh - Redirects to the fastapi-backend build script

echo "Running root build.sh script"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Check if fastapi-backend directory exists
if [ -d "fastapi-backend" ]; then
    echo "Found fastapi-backend directory, navigating to it..."
    cd fastapi-backend
    
    # Check if build.sh exists in fastapi-backend
    if [ -f "build.sh" ]; then
        echo "Found build.sh in fastapi-backend, making it executable and running it..."
        chmod +x ./build.sh
        ./build.sh
    else
        echo "build.sh not found in fastapi-backend directory!"
        echo "Contents of fastapi-backend directory:"
        ls -la
        
        # Fallback: Install dependencies directly
        echo "Fallback: Installing dependencies directly..."
        pip install -r requirements.txt
    fi
else
    echo "fastapi-backend directory not found!"
    echo "Installing dependencies from root requirements.txt..."
    pip install -r requirements.txt
fi
