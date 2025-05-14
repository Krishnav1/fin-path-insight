#!/bin/bash
# Build script for FastAPI backend on Render

echo "Starting build process for FinPath Insight FastAPI backend..."

# Ensure pip is up to date
pip install --upgrade pip

# Install dependencies with verbose output
echo "Installing dependencies..."
pip install -v -r requirements.txt

# Verify critical installations
echo "Verifying installations..."
pip list
echo "Checking for uvicorn..."
which python
pip show uvicorn

echo "Build completed successfully!"
