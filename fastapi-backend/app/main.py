from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import market_data, ai_analysis, document_processing, fingenie

app = FastAPI(
    title="FinPath Insight API",
    description="FastAPI backend for FinPath Insight with AI Analysis, Market Data, and Document Processing",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(market_data.router, prefix="/api/market-data", tags=["Market Data"])
app.include_router(ai_analysis.router, prefix="/api/ai-analysis", tags=["AI Analysis"])
app.include_router(document_processing.router, prefix="/api/documents", tags=["Document Processing"])
app.include_router(fingenie.router, prefix="/api/fingenie", tags=["FinGenie"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to FinPath Insight API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
