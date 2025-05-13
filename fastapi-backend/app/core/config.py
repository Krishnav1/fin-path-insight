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
    
    # Google Gemini API Settings
    GEMINI_API_KEY: Optional[str] = None
    
    # Pinecone Settings
    PINECONE_API_KEY: Optional[str] = None
    PINECONE_INDEX_NAME: str = "fingenie-finance-vectors"
    PINECONE_CLOUD: str = "aws"
    PINECONE_REGION: Optional[str] = "us-east-1"
    
    # Alpha Vantage API Settings
    ALPHA_VANTAGE_API_KEY: Optional[str] = None
    
    # News API Settings
    NEWS_API_KEY: Optional[str] = None
    GNEWS_API_KEY: Optional[str] = None
    
    # Document Processing Settings
    UPLOAD_FOLDER: str = "uploads"
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "csv", "xlsx"]
    
    model_config = SettingsConfigDict(
        env_file='.env',
        case_sensitive=True,
        extra='allow'
    )

settings = Settings()
