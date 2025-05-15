"""
Request Validators
Validation functions for API requests
"""

from pydantic import BaseModel, Field, validator, root_validator
from typing import List, Dict, Any, Optional
from datetime import datetime
import re

class StockSymbolValidator(BaseModel):
    """Validator for stock symbol parameters"""
    symbol: str = Field(..., description="Stock symbol (e.g., RELIANCE.NS, AAPL)")
    
    @validator('symbol')
    def validate_symbol(cls, v):
        if not v or not isinstance(v, str):
            raise ValueError("Symbol must be a non-empty string")
        
        # Remove any whitespace
        v = v.strip()
        
        # Basic validation for common stock symbols
        if not re.match(r'^[A-Za-z0-9\.\-\_]+$', v):
            raise ValueError("Symbol contains invalid characters")
        
        return v

class MarketValidator(BaseModel):
    """Validator for market parameters"""
    market: str = Field(..., description="Market (india, us, global)")
    
    @validator('market')
    def validate_market(cls, v):
        if not v or not isinstance(v, str):
            raise ValueError("Market must be a non-empty string")
        
        # Normalize to lowercase
        v = v.lower().strip()
        
        # Validate against allowed markets
        allowed_markets = ["india", "us", "global"]
        if v not in allowed_markets:
            raise ValueError(f"Market must be one of: {', '.join(allowed_markets)}")
        
        return v

class PaginationValidator(BaseModel):
    """Validator for pagination parameters"""
    page: int = Field(1, ge=1, description="Page number (starts at 1)")
    limit: int = Field(10, ge=1, le=100, description="Items per page (1-100)")
    
    @validator('page')
    def validate_page(cls, v):
        if v < 1:
            return 1
        return v
    
    @validator('limit')
    def validate_limit(cls, v):
        if v < 1:
            return 10
        if v > 100:
            return 100
        return v

class DateRangeValidator(BaseModel):
    """Validator for date range parameters"""
    start_date: Optional[datetime] = Field(None, description="Start date (ISO format)")
    end_date: Optional[datetime] = Field(None, description="End date (ISO format)")
    
    @root_validator
    def validate_date_range(cls, values):
        start_date = values.get('start_date')
        end_date = values.get('end_date')
        
        if start_date and end_date and start_date > end_date:
            raise ValueError("start_date must be before end_date")
        
        return values

class CompanyAnalysisValidator(BaseModel):
    """Validator for company analysis request"""
    symbol: str = Field(..., description="Stock symbol")
    timeframe: Optional[str] = Field("1y", description="Timeframe for analysis (1d, 1w, 1m, 3m, 6m, 1y, 5y)")
    
    @validator('symbol')
    def validate_symbol(cls, v):
        if not v or not isinstance(v, str):
            raise ValueError("Symbol must be a non-empty string")
        
        # Remove any whitespace
        v = v.strip()
        
        # Basic validation for common stock symbols
        if not re.match(r'^[A-Za-z0-9\.\-\_]+$', v):
            raise ValueError("Symbol contains invalid characters")
        
        return v
    
    @validator('timeframe')
    def validate_timeframe(cls, v):
        if not v:
            return "1y"
        
        # Normalize to lowercase
        v = v.lower().strip()
        
        # Validate against allowed timeframes
        allowed_timeframes = ["1d", "1w", "1m", "3m", "6m", "1y", "5y"]
        if v not in allowed_timeframes:
            raise ValueError(f"Timeframe must be one of: {', '.join(allowed_timeframes)}")
        
        return v
