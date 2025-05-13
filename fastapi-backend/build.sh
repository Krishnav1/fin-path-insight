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

# Ensure uvicorn is installed first
pip install uvicorn==0.24.0

# Check if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "Found requirements.txt, installing dependencies with pip..."
    pip install -r requirements.txt
else
    echo "requirements.txt not found in current directory"
    echo "Searching for requirements.txt in subdirectories..."
    find . -name "requirements.txt" -type f
    
    # Try to find and use requirements.txt in subdirectories
    REQUIREMENTS_FILE=$(find . -name "requirements.txt" -type f | head -n 1)
    if [ -n "$REQUIREMENTS_FILE" ]; then
        echo "Found requirements.txt at $REQUIREMENTS_FILE"
        pip install -r "$REQUIREMENTS_FILE"
    else
        echo "No requirements.txt found, checking for Poetry..."
        
        # Check if pyproject.toml exists for Poetry
        if [ -f "pyproject.toml" ]; then
            echo "Found pyproject.toml, installing dependencies with Poetry..."
            pip install poetry
            poetry config virtualenvs.create false
            poetry install --no-dev
        else
            echo "ERROR: No dependency files found!"
            echo "Installing common dependencies as fallback..."
            pip install fastapi uvicorn gunicorn pydantic python-dotenv httpx
        fi
    fi
fi

# Print installed packages for debugging
echo "Installed packages:"
pip list
