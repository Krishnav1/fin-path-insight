#!/bin/bash
# build.sh - Build script for Render deployment

# Print Python version and directory contents
python --version
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies directly
echo "Installing Python packages..."
pip install fastapi==0.104.1
pip install uvicorn==0.24.0
pip install gunicorn==21.2.0
pip install pydantic==2.4.2
pip install python-dotenv==1.0.0
pip install httpx==0.25.1
pip install requests==2.31.0
pip install pinecone-client==3.0.2
pip install google-generativeai==0.3.2
pip install "python-jose[cryptography]==3.3.0"
pip install "passlib[bcrypt]==1.7.4"
pip install python-multipart==0.0.6

# Verify installations
echo "Installed packages:"
pip list

# Test importing key packages
python -c "import fastapi; import uvicorn; print('Key imports successful!')"
