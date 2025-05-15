from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import market_data, ai_analysis, document_processing, fingenie, supabase_data, news, analysis, health
from app.middleware.response_formatter import NewsResponseFormatterMiddleware
from app.middleware.timeout_middleware import TimeoutMiddleware
from app.utils.supabase_cache import clear_expired_cache, ensure_cache_table_exists
import logging
import time
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

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

# Add timeout middleware to prevent long-running requests
app.add_middleware(TimeoutMiddleware, timeout=30)  # 30 second timeout

# Add custom middleware for formatting news responses
app.add_middleware(NewsResponseFormatterMiddleware)

# Add middleware for request timing and logging
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    
    # Log the request
    logger.info(f"Request: {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log the response time
    logger.info(f"Response: {request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")
    
    return response

# Include routers
app.include_router(market_data.router, prefix="/api/market-data", tags=["Market Data"])
app.include_router(ai_analysis.router, prefix="/api/ai-analysis", tags=["AI Analysis"])
app.include_router(document_processing.router, prefix="/api/documents", tags=["Document Processing"])
app.include_router(fingenie.router, prefix="/api/fingenie", tags=["FinGenie"])
app.include_router(supabase_data.router, prefix="/api/supabase", tags=["Supabase Data"])
app.include_router(news.router, prefix="/api/news", tags=["News"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Financial Analysis"])
app.include_router(health.router, prefix="/api/health", tags=["Health Check"])

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    logger.info("Starting FinPath Insight API")
    try:
        # Ensure cache table exists
        await ensure_cache_table_exists()
        logger.info("Cache table check completed")
        
        # Clear expired cache entries
        deleted_count = await clear_expired_cache()
        logger.info(f"Cleared {deleted_count} expired cache entries")
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down FinPath Insight API")

@app.get("/")
async def root():
    return {
        "message": "Welcome to FinPath Insight API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "health_check": "/api/health"
    }
