#!/bin/bash
# Build script for FastAPI backend on Render

echo "Starting build process for FinPath Insight FastAPI backend..."

# Install Python dependencies with verbose output
pip install --upgrade pip
pip install -r requirements.txt

# Verify installations
echo "Verifying installations..."
pip list | grep uvicorn
pip list | grep fastapi
pip list | grep supabase
pip list | grep httpx

echo "Build completed successfully!"
