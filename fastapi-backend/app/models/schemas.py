from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

# Market Data Models
class StockPrice(BaseModel):
    symbol: str
    price: float
    change: float
    change_percent: float
    volume: int
    timestamp: datetime

class MarketIndex(BaseModel):
    name: str
    value: float
    change: float
    change_percent: float
    timestamp: datetime

class MarketMover(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float

class MarketMovers(BaseModel):
    gainers: List[MarketMover]
    losers: List[MarketMover]

class MarketOverview(BaseModel):
    indices: List[MarketIndex]
    breadth: Dict[str, int] = Field(..., description="Market breadth with advances, declines, unchanged")

class IndexMovers(BaseModel):
    index_name: str
    gainers: List[MarketMover]
    losers: List[MarketMover]

# AI Analysis Models
class CompanyData(BaseModel):
    symbol: str
    company: Optional[Dict[str, Any]] = None
    currentPrice: Optional[float] = None
    dayChangePct: Optional[float] = None
    periodChangePct: Optional[float] = None
    history: Optional[List[Dict[str, Any]]] = None
    news: Optional[List[Dict[str, Any]]] = None

class CompanyAnalysisRequest(BaseModel):
    companyData: CompanyData

class CompanyAnalysisResponse(BaseModel):
    analysis: str
    error: Optional[str] = None

# Document Processing Models
class DocumentUploadResponse(BaseModel):
    filename: str
    size: int
    content_type: str
    status: str
    document_id: str
    vector_count: int

class DocumentSearchRequest(BaseModel):
    query: str
    top_k: int = 5

class DocumentSearchMatch(BaseModel):
    document_id: str
    text: str
    score: float
    metadata: Dict[str, Any]

class DocumentSearchResponse(BaseModel):
    matches: List[DocumentSearchMatch]
    query: str

# FinGenie Models
class ChatMessage(BaseModel):
    userId: str
    message: str

class ChatResponse(BaseModel):
    message: str
