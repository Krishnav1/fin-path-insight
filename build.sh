#!/bin/bash
set -e

echo "Building FinPath Insight application..."

# Navigate to the FastAPI backend directory
cd fastapi-backend

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file from environment variables
echo "Setting up environment variables..."
cat > .env << EOL
# API Keys
GEMINI_API_KEY=${GEMINI_API_KEY}
PINECONE_API_KEY=${PINECONE_API_KEY}
PINECONE_INDEX_NAME=${PINECONE_INDEX_NAME:-fingenie-finance-vectors}
PINECONE_CLOUD=${PINECONE_CLOUD:-aws}

# Financial Data APIs
FMP_API_KEY=${FMP_API_KEY}
ALPHA_VANTAGE_API_KEY=${ALPHA_VANTAGE_API_KEY}
NEWS_API_KEY=${NEWS_API_KEY}

# Supabase Settings
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_TTL_CACHE=${SUPABASE_TTL_CACHE:-3600}

# Deployment Settings
PORT=${PORT:-8000}
NODE_ENV=${NODE_ENV:-production}
EOL

echo "Build completed successfully!"
