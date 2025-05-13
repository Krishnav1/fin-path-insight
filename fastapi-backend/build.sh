#!/bin/bash
# build.sh - Build script for Render deployment

echo "Build started..."

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
  echo "Creating virtual environment..."
  python -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Verify installations
echo "Verifying installations..."
python -c "import fastapi; print('FastAPI version:', fastapi.__version__)"
python -c "import pydantic; print('Pydantic version:', pydantic.__version__)"
python -c "import pandas; print('Pandas version:', pandas.__version__)"
python -c "import numpy; print('NumPy version:', numpy.__version__)"

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
  echo "Creating uploads directory..."
  mkdir uploads
fi

echo "Build completed successfully"
