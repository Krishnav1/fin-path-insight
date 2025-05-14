import os
from pydantic_settings import BaseSettings
from typing import Optional, Dict, Any, List

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "FinPath Insight API"
    
    # CORS Settings
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # Google Gemini API Settings
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    
    # Pinecone Settings
    PINECONE_API_KEY: Optional[str] = os.getenv("PINECONE_API_KEY")
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "fingenie-finance-vectors")
    PINECONE_CLOUD: str = os.getenv("PINECONE_CLOUD", "aws")
    
    # Alpha Vantage API Settings
    ALPHA_VANTAGE_API_KEY: Optional[str] = os.getenv("ALPHA_VANTAGE_API_KEY")
    
    # News API Settings
    NEWS_API_KEY: Optional[str] = os.getenv("NEWS_API_KEY")
    
    # Document Processing Settings
    UPLOAD_FOLDER: str = "uploads"
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "csv", "xlsx"]
    
    # Render Environment Variables
    PORT: Optional[str] = os.getenv("PORT")
    NODE_ENV: Optional[str] = os.getenv("NODE_ENV")
    
    # Supabase Settings
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY: Optional[str] = os.getenv("SUPABASE_ANON_KEY")
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Allow extra fields that aren't defined in the model

# Initialize settings with environment variables
try:
    settings = Settings()
    print(f"Settings loaded successfully. API_V1_STR: {settings.API_V1_STR}")
    print(f"PORT: {settings.PORT}, NODE_ENV: {settings.NODE_ENV}")
    print(f"SUPABASE_URL is {'set' if settings.SUPABASE_URL else 'not set'}")
    print(f"SUPABASE_ANON_KEY is {'set' if settings.SUPABASE_ANON_KEY else 'not set'}")
except Exception as e:
    print(f"Error loading settings: {e}")
    # Fallback to a minimal settings object if there's an error
    settings = Settings()

