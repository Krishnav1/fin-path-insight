from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import market_data, ai_analysis, document_processing, fingenie, news
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FastAPI backend for FinPath Insight with AI Analysis, Market Data, and Document Processing",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(market_data.router, prefix=f"{settings.API_V1_STR}/market-data", tags=["Market Data"])
app.include_router(ai_analysis.router, prefix=f"{settings.API_V1_STR}/ai-analysis", tags=["AI Analysis"])
app.include_router(document_processing.router, prefix=f"{settings.API_V1_STR}/documents", tags=["Document Processing"])
app.include_router(fingenie.router, prefix=f"{settings.API_V1_STR}/fingenie", tags=["FinGenie"])
app.include_router(news.router, prefix=f"{settings.API_V1_STR}/news", tags=["News"])

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
