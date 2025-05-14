#!/bin/bash
# Start script for FastAPI backend on Render

echo "Starting FinPath Insight FastAPI backend..."

# Debug information
echo "Python version:"
python --version
echo "Pip version:"
pip --version
echo "Installed packages:"
pip list
echo "Current directory:"
pwd
echo "Directory contents:"
ls -la

# Make sure we're using the Python environment with our packages
export PATH="$PATH:$HOME/.local/bin"

# Start the FastAPI application
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
