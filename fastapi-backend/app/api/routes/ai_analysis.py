from fastapi import APIRouter, HTTPException, Depends, Body
from typing import List, Dict, Any, Optional
from app.models.schemas import CompanyAnalysisRequest, CompanyAnalysisResponse
from app.utils.gemini_client import generate_company_analysis
from app.utils.pinecone_client import query_similar_vectors
from app.utils.gemini_client import generate_embedding
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/company", response_model=CompanyAnalysisResponse)
async def analyze_company(request: CompanyAnalysisRequest = Body(...)):
    """
    Generate AI analysis for a company based on provided data
    """
    try:
        logger.info(f"Generating analysis for {request.companyData.symbol}")
        
        # Get relevant context from knowledge base
        relevant_context = await get_relevant_context(request.companyData.symbol)
        
        # Generate analysis
        analysis = await generate_company_analysis(
            company_data=request.companyData.dict(),
            context=relevant_context
        )
        
        return {
            "analysis": analysis,
            "error": None
        }
    except Exception as e:
        logger.error(f"Error generating company analysis: {str(e)}")
        return {
            "analysis": get_placeholder_analysis(request.companyData),
            "error": str(e)
        }

async def get_relevant_context(symbol: str) -> str:
    """
    Get relevant context from knowledge base for a company
    """
    try:
        # Generate embedding for the company symbol
        query = f"financial analysis for {symbol} company"
        embedding = await generate_embedding(query)
        
        # Query Pinecone for similar vectors
        matches = await query_similar_vectors(embedding, top_k=5)
        
        if not matches:
            return ""
        
        # Format context
        context = "--- RELEVANT KNOWLEDGE BASE EXCERPTS ---\n\n"
        for i, match in enumerate(matches):
            context += f"[Document {i+1} (Relevance: {match['score']:.2f})]: {match['metadata']['text']}\n\n"
        
        return context
    except Exception as e:
        logger.error(f"Error getting relevant context: {str(e)}")
        return ""

def get_placeholder_analysis(company_data: Any) -> str:
    """
    Get placeholder analysis when AI generation fails
    """
    company_name = company_data.company.name if company_data.company and hasattr(company_data.company, 'name') else company_data.symbol
    
    return f"""# Investment Analysis for {company_name}

## Business Summary
{company_name} operates in the {company_data.company.sector if company_data.company and hasattr(company_data.company, 'sector') else 'unknown'} sector, specifically in the {company_data.company.industry if company_data.company and hasattr(company_data.company, 'industry') else 'unknown'} industry. The company has shown {'+' if company_data.periodChangePct and company_data.periodChangePct > 0 else '-'}performance over the selected period.

## Key Financial Metrics
* Current Price: ₹{company_data.currentPrice if company_data.currentPrice else 'N/A'}
* Market Cap: ₹{company_data.company.marketCap if company_data.company and hasattr(company_data.company, 'marketCap') else 'N/A'}
* Day Change: {'+' if company_data.dayChangePct and company_data.dayChangePct > 0 else ''}{company_data.dayChangePct if company_data.dayChangePct else 'N/A'}%

## Note
This is a placeholder analysis. The AI-powered analysis service is currently unavailable. Please try again later."""
