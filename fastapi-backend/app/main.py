from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import market_data, ai_analysis, document_processing, fingenie, supabase_data, news, analysis

app = FastAPI(
    title="FinPath Insight API",
    description="FastAPI backend for FinPath Insight with AI Analysis, Market Data, and Document Processing",
    version="1.0.0"
)

# Configure CORS
import os

# Get environment variables
ENVIRONMENT = os.getenv("NODE_ENV", "development")

# Define allowed origins based on environment
if ENVIRONMENT == "production":
    # Production origins
    allowed_origins = [
        "https://fin-insight.netlify.app/",  # Main production site
        "https://fininsight.onrender.com",       # Render deployment
        "https://finpath-insight.vercel.app"    # Vercel deployment (if used)
    ]
else:
    # Development origins
    allowed_origins = [
        "http://localhost:8080",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "http://127.0.0.1:8080",  # Local IP variant
        "http://127.0.0.1:3000"   # Alternative local IP
    ]

# Add CORS middleware with appropriate configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Environment", "X-Client-Version"],
)

# Include routers
app.include_router(market_data.router, prefix="/api/market-data", tags=["Market Data"])
app.include_router(ai_analysis.router, prefix="/api/ai-analysis", tags=["AI Analysis"])
app.include_router(document_processing.router, prefix="/api/documents", tags=["Document Processing"])
app.include_router(fingenie.router, prefix="/api/fingenie", tags=["FinGenie"])
app.include_router(supabase_data.router, prefix="/api/supabase", tags=["Supabase Data"])
app.include_router(news.router, prefix="/api/news", tags=["News"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Financial Analysis"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to FinPath Insight API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
