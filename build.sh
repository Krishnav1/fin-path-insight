#!/bin/bash
# Root build.sh - Builds the FastAPI backend for Render deployment

echo "Running root build.sh script"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Upgrade pip globally
python -m pip install --upgrade pip

# Install critical packages globally first
echo "Installing critical packages globally..."
python -m pip install fastapi uvicorn gunicorn pydantic python-dotenv httpx requests

# Check if fastapi-backend directory exists
if [ -d "fastapi-backend" ]; then
    echo "Found fastapi-backend directory, navigating to it..."
    cd fastapi-backend
    
    # Install all dependencies directly without virtual environment
    echo "Installing dependencies directly..."
    if [ -f "requirements.txt" ]; then
        echo "Installing from fastapi-backend/requirements.txt"
        python -m pip install -r requirements.txt
    else
        echo "requirements.txt not found in fastapi-backend directory!"
        echo "Installing common FastAPI dependencies..."
        python -m pip install fastapi==0.104.1 uvicorn==0.24.0 gunicorn==21.2.0 pydantic==2.4.2 \
            pydantic-settings==2.1.0 python-dotenv==1.0.0 httpx==0.24.1 requests==2.31.0 \
            aiohttp==3.9.1 pandas==2.1.4 numpy==1.26.2 python-multipart==0.0.6 \
            python-jose==3.3.0 passlib==1.7.4 bcrypt==4.0.1 email-validator==2.1.0.post1
    fi
else
    echo "fastapi-backend directory not found!"
    echo "Installing dependencies from root requirements.txt..."
    if [ -f "requirements.txt" ]; then
        python -m pip install -r requirements.txt
    else
        echo "requirements.txt not found in root directory!"
        echo "Installing common dependencies..."
        python -m pip install fastapi==0.104.1 uvicorn==0.24.0 gunicorn==21.2.0 pydantic==2.4.2 \
            pydantic-settings==2.1.0 python-dotenv==1.0.0 httpx==0.24.1 requests==2.31.0 \
            aiohttp==3.9.1 pandas==2.1.4 numpy==1.26.2 python-multipart==0.0.6 \
            python-jose==3.3.0 passlib==1.7.4 bcrypt==4.0.1 email-validator==2.1.0.post1
    fi
fi

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    echo "Creating uploads directory..."
    mkdir -p uploads
fi

# Verify installations
echo "Verifying installations..."
python -m pip list | grep fastapi
python -m pip list | grep uvicorn
python -m pip list | grep pydantic
python -m pip list | grep pandas
python -m pip list | grep numpy

echo "Build completed successfully"
