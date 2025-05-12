#!/bin/bash
# Root build.sh - Redirects to the fastapi-backend build script

echo "Running root build.sh script"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Upgrade pip first
pip install --upgrade pip

# Explicitly install critical packages first
echo "Installing critical packages..."
pip install fastapi uvicorn gunicorn pydantic python-dotenv httpx

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
        if [ -f "requirements.txt" ]; then
            pip install -r requirements.txt
        else
            echo "requirements.txt not found in fastapi-backend directory!"
            echo "Searching for requirements.txt..."
            find . -name "requirements.txt" -type f
        fi
    fi
else
    echo "fastapi-backend directory not found!"
    echo "Installing dependencies from root requirements.txt..."
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    else
        echo "requirements.txt not found in root directory!"
        echo "Installing common dependencies..."
        pip install fastapi==0.104.1 uvicorn==0.24.0 gunicorn==21.2.0 pydantic==2.4.2 pydantic-settings==2.0.3 python-dotenv==1.0.0 httpx==0.25.1 pinecone-client==2.2.4 google-generativeai==0.3.1 python-multipart==0.0.6 pandas==2.1.1 PyPDF2==3.0.1 openpyxl==3.1.2 python-jose==3.3.0 passlib==1.7.4 bcrypt==4.0.1
    fi
fi

# Verify installations
echo "Verifying installations..."
pip list | grep uvicorn
pip list | grep fastapi
pip list | grep gunicorn
