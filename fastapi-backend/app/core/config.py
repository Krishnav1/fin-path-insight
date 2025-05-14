import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, Dict, Any, List, Union

class Settings(BaseSettings):
    # Server Settings
    PORT: Optional[Union[int, str]] = 8000
    HOST: str = "0.0.0.0"
    FASTAPI_URL: Optional[str] = None
    
    # API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "FinPath Insight API"
    
    # CORS Settings
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # Database Settings
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL", "postgresql://postgres.ydakwyplcqoshxcdllah:0RwuxjGlRJwgquO4@aws-0-us-east-2.pooler.supabase.com:6543/postgres")
    
    # Google Gemini API Settings
    GEMINI_API_KEY: Optional[str] = os.getenv("GOOGLE_GEMINI_API_KEY")
    
    # Pinecone Settings
    PINECONE_API_KEY: Optional[str] = os.getenv("PINECONE_API_KEY")
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "fingenie-finance-vectors")
    PINECONE_ENVIRONMENT: str = os.getenv("PINECONE_ENVIRONMENT", "gcp-starter")
    PINECONE_CLOUD: str = os.getenv("PINECONE_CLOUD", "aws")
    PINECONE_REGION: Optional[str] = os.getenv("PINECONE_REGION", "us-east-1")
    
    # Alpha Vantage API Settings
    ALPHA_VANTAGE_API_KEY: Optional[str] = os.getenv("ALPHA_VANTAGE_API_KEY")
    ALPHA_VANTAGE_BASE_URL: str = "https://www.alphavantage.co/query"
    
    # News API Settings
    NEWS_API_KEY: Optional[str] = os.getenv("NEWS_API_KEY")
    GNEWS_API_KEY: Optional[str] = os.getenv("GNEWS_API_KEY")
    
    # Document Processing Settings
    UPLOAD_FOLDER: str = os.getenv("UPLOAD_FOLDER", "uploads")
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "csv", "xlsx", "docx", "txt"]
    
    # Supabase Settings
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL", "https://ydakwyplcqoshxcdllah.supabase.co")
    SUPABASE_KEY: Optional[str] = os.getenv("SUPABASE_KEY")
    SUPABASE_JWT_SECRET: Optional[str] = os.getenv("SUPABASE_JWT_SECRET")
    
    model_config = SettingsConfigDict(
        env_file='.env',
        case_sensitive=True,
        extra='allow'
    )

settings = Settings()
