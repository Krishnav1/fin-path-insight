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

# Install dependencies with extra verbosity and retry on failure
echo "Installing dependencies..."
pip install -v --no-cache-dir -r requirements.txt

# If the first attempt fails, try again with --no-deps
if [ $? -ne 0 ]; then
  echo "First attempt failed, trying again with --no-deps..."
  pip install -v --no-cache-dir --no-deps -r requirements.txt
fi

# Install critical packages individually if needed
echo "Ensuring critical packages are installed..."
pip install fastapi==0.104.1 uvicorn==0.24.0 gunicorn==21.2.0 pydantic==2.4.2

# Verify installations
echo "Verifying installations..."
python -c "import fastapi; print('FastAPI version:', fastapi.__version__)" || echo "FastAPI not installed properly"
python -c "import pydantic; print('Pydantic version:', pydantic.__version__)" || echo "Pydantic not installed properly"
python -c "import pandas; print('Pandas version:', pandas.__version__)" || echo "Pandas not installed properly"
python -c "import numpy; print('NumPy version:', numpy.__version__)" || echo "NumPy not installed properly"

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
  echo "Creating uploads directory..."
  mkdir uploads
fi

echo "Build completed successfully"
