import os
import logging
from pydantic_settings import BaseSettings
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "FinPath Insight API"
    
    # CORS Settings
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # Google Gemini API Settings
    GEMINI_API_KEY: Optional[str] = None
    
    # Pinecone Settings
    PINECONE_API_KEY: Optional[str] = None
    PINECONE_INDEX_NAME: str = "fingenie-finance-vectors"
    PINECONE_CLOUD: str = "aws"
    
    # Alpha Vantage API Settings (Legacy)
    ALPHA_VANTAGE_API_KEY: Optional[str] = None
    
    # Financial Modeling Prep (FMP) API Settings
    FMP_API_KEY: Optional[str] = None
    
    # News API Settings
    NEWS_API_KEY: Optional[str] = None
    
    # Document Processing Settings
    UPLOAD_FOLDER: str = "uploads"
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "csv", "xlsx"]
    
    # Render Environment Variables
    PORT: Optional[str] = None
    NODE_ENV: Optional[str] = None
    
    # Supabase Settings
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_TTL_CACHE: int = 3600  # Default TTL for cache in seconds (1 hour)
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Allow extra fields that aren't defined in the model

# Initialize settings with environment variables
try:
    # Create settings instance
    settings = Settings()
    
    # Manually load environment variables to ensure they're set
    settings.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    settings.PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
    settings.PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "fingenie-finance-vectors")
    settings.PINECONE_CLOUD = os.getenv("PINECONE_CLOUD", "aws")
    settings.ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
    settings.FMP_API_KEY = os.getenv("FMP_API_KEY")
    settings.NEWS_API_KEY = os.getenv("NEWS_API_KEY")
    settings.PORT = os.getenv("PORT")
    settings.NODE_ENV = os.getenv("NODE_ENV")
    settings.SUPABASE_URL = os.getenv("SUPABASE_URL")
    settings.SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    settings.SUPABASE_TTL_CACHE = int(os.getenv("SUPABASE_TTL_CACHE", "3600"))
    
    # Log successful loading
    logger.info(f"Settings loaded successfully. API_V1_STR: {settings.API_V1_STR}")
    logger.info(f"Environment: {settings.NODE_ENV}")
    logger.info(f"FMP API Key: {'Set' if settings.FMP_API_KEY else 'Not set'}")
    logger.info(f"News API Key: {'Set' if settings.NEWS_API_KEY else 'Not set'}")
    logger.info(f"Alpha Vantage API Key (Legacy): {'Set' if settings.ALPHA_VANTAGE_API_KEY else 'Not set'}")
    logger.info(f"Supabase URL: {'Set' if settings.SUPABASE_URL else 'Not set'}")
    
    # Print for debugging during deployment
    print(f"Settings loaded successfully. Environment: {settings.NODE_ENV}")
    print(f"FMP API Key: {'Set' if settings.FMP_API_KEY else 'Not set'}")
    print(f"News API Key: {'Set' if settings.NEWS_API_KEY else 'Not set'}")
    print(f"Supabase URL: {'Set' if settings.SUPABASE_URL else 'Not set'}")
    
except Exception as e:
    error_msg = f"Error loading settings: {e}"
    print(error_msg)
    logger.error(error_msg)
    # Create a minimal settings object if there's an error
    settings = Settings()

