from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
from app.models.schemas import ChatMessage, ChatResponse
from app.utils.gemini_client import generate_text_response, generate_embedding, generate_financial_analysis
from app.utils.pinecone_client import query_similar_vectors
from app.utils.fmp_client import fetch_stock_data, fetch_technical_indicators, fetch_company_fundamentals, fetch_analyst_ratings
from app.utils.newsapi_client import fetch_news, search_news_semantic
from app.utils.supabase_cache import get_cached_data, set_cached_data

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory conversation storage (in production, use a database)
conversation_history = {}

@router.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage = Body(...)):
    """
    Handle chat messages for FinGenie chatbot
    """
    try:
        user_id = message.userId
        user_message = message.message
        
        logger.info(f"User {user_id} sent: {user_message}")
        
        # Get or initialize conversation history
        if user_id not in conversation_history:
            conversation_history[user_id] = []
        
        # Add user message to history
        conversation_history[user_id].append({
            "sender": "user",
            "text": user_message,
            "timestamp": datetime.now().isoformat()
        })
        
        try:
            # Get relevant context from knowledge base
            relevant_context = await get_relevant_context(user_message)
            
            # Get real-time financial data if needed
            financial_data = await get_financial_data(user_message)
            
            # Create system prompt with context and financial data
            system_prompt = create_system_prompt(relevant_context, financial_data)
            
            # Generate response
            bot_response = await generate_text_response(
                prompt=user_message,
                system_prompt=system_prompt,
                conversation_history=conversation_history[user_id][-6:] if len(conversation_history[user_id]) > 6 else conversation_history[user_id]
            )
        except Exception as inner_e:
            logger.error(f"Error generating AI response: {str(inner_e)}")
            # Fallback response if AI generation fails
            bot_response = "I'm sorry, I'm having trouble processing your request right now. Please try again later or ask a different question about financial markets or investments."
        
        # Add bot response to history
        conversation_history[user_id].append({
            "sender": "model",
            "text": bot_response,
            "timestamp": datetime.now().isoformat()
        })
        
        # Limit conversation history to last 20 messages
        if len(conversation_history[user_id]) > 20:
            conversation_history[user_id] = conversation_history[user_id][-20:]
        
        return ChatResponse(message=bot_response)
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        # Return a friendly error message instead of throwing an exception
        return ChatResponse(message="I apologize, but I'm experiencing technical difficulties. Please try again later.")

@router.get("/chat")
async def chat_get():
    """
    Simple GET handler for the chat endpoint
    """
    return {"message": "FinGenie chat API is running. Please use POST method to send messages."}

@router.delete("/conversations/{user_id}")
async def clear_conversation(user_id: str):
    """
    Clear conversation history for a user
    """
    try:
        if user_id in conversation_history:
            conversation_history[user_id] = []
        
        return {"status": "success", "message": f"Conversation history cleared for user {user_id}"}
    except Exception as e:
        logger.error(f"Error clearing conversation for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_relevant_context(message: str) -> str:
    """
    Get relevant context from knowledge base based on user message
    """
    try:
        # Generate embedding for the message
        embedding = await generate_embedding(message)
        
        # Query Pinecone for similar vectors
        matches = await query_similar_vectors(embedding, top_k=3)
        
        if not matches:
            return ""
        
        # Format context
        context = ""
        for i, match in enumerate(matches):
            context += f"[Document {i+1} (Relevance: {match['score']:.2f})]: {match['metadata']['text']}\n\n"
        
        return context
    except Exception as e:
        logger.error(f"Error getting relevant context: {str(e)}")
        return ""

async def get_financial_data(message: str) -> str:
    """
    Get real-time financial data based on user message
    """
    try:
        # Check if message contains stock symbols
        # This is a simple implementation - in production, use NER or a more sophisticated approach
        stock_symbols = extract_stock_symbols(message)
        
        if not stock_symbols:
            return ""
        
        # Create cache key
        cache_key = f"fingenie_financial_data_{'-'.join(stock_symbols)}"
        
        # Try to get from cache first
        cached_data = await get_cached_data(cache_key)
        if cached_data:
            logger.info(f"Using cached financial data for {stock_symbols}")
            return cached_data
        
        # Fetch data for each symbol
        data = []
        for symbol in stock_symbols:
            # Get basic stock data
            stock_data = await fetch_stock_data(symbol)
            
            if stock_data:
                # Format price with currency symbol (₹ for Indian stocks, $ for US stocks)
                currency_symbol = "₹" if ".NS" in symbol or ".BSE" in symbol else "$"
                change_pct_raw = stock_data.get("changesPercentage") or stock_data.get("change_percent")
                try:
                    change_pct = float(str(change_pct_raw).strip("%"))
                    sign = "+" if change_pct > 0 else ""
                    pct_display = f"{sign}{change_pct:.2f}%"
                except (ValueError, TypeError):
                    pct_display = change_pct_raw or "N/A"

                price_info = (
                    f"{symbol}: {currency_symbol}{stock_data.get('price', 'N/A')} "
                    f"({pct_display})"
                )
                data.append(price_info)
                
                # Get technical indicators
                try:
                    rsi_data = await fetch_technical_indicators(symbol, "rsi", 14)
                    if rsi_data and len(rsi_data) > 0:
                        rsi_value = rsi_data[0].get("rsi", "N/A") if isinstance(rsi_data[0].get("rsi"), (int, float)) else "N/A"
                        data.append(f"  RSI (14): {rsi_value}")
                except Exception as tech_err:
                    logger.warning(f"Error fetching RSI for {symbol}: {str(tech_err)}")
                
                # Get fundamental metrics
                try:
                    fundamentals = await fetch_company_fundamentals(symbol)
                    if fundamentals and "ratios" in fundamentals:
                        ratios = fundamentals.get("ratios", {})
                        pe_ratio = ratios.get("peRatio", "N/A")
                        ev_ebitda = ratios.get("enterpriseValueToEBITDA", "N/A")
                        data.append(f"  P/E Ratio: {pe_ratio}")
                        data.append(f"  EV/EBITDA: {ev_ebitda}")
                except Exception as fund_err:
                    logger.warning(f"Error fetching fundamentals for {symbol}: {str(fund_err)}")
        
        if not data:
            return ""
        
        result = "Real-time financial data:\n" + "\n".join(data)
        
        # Cache the result
        await set_cached_data(cache_key, result, 900)  # Cache for 15 minutes
        
        return result
    except Exception as e:
        logger.error(f"Error getting financial data: {str(e)}")
        return ""

def extract_stock_symbols(message: str) -> List[str]:
    """
    Extract potential stock symbols from message
    This is a simple implementation - in production, use NER or a more sophisticated approach
    """
    # Common Indian stock symbols
    common_symbols = [
        "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "HINDUNILVR", 
        "HDFC", "SBIN", "BAJFINANCE", "BHARTIARTL", "ITC", "KOTAKBANK", 
        "LT", "AXISBANK", "ASIANPAINT", "MARUTI", "WIPRO", "HCLTECH"
    ]
    
    # Check if any common symbols are in the message
    found_symbols = []
    words = message.upper().split()
    
    for word in words:
        # Remove punctuation
        clean_word = ''.join(c for c in word if c.isalnum())
        if clean_word in common_symbols:
            found_symbols.append(clean_word)
    
    return found_symbols

def create_system_prompt(context: str, financial_data: str) -> str:
    """
    Create system prompt with context and financial data
    """
    system_prompt = """You are FinGenie, a polite, helpful, and professional financial assistant. Always respond to user questions in a clean, structured format using markdown. If the user asks for financial news, company share price, investment insights, or definitions, use the following structure in your replies:

1. **Title** (bolded and relevant to the topic)
2. **Answer Summary:** A 2–3 sentence overview or definition
3. **Key Information:** A bullet list of key details or steps
4. **Additional Insights (if needed):** Brief explanations or tips
5. **Note/Disclaimer:** Always remind the user that financial data may change and to consult official sources or professionals for investment advice
6. If the user asks for real-time data (like stock prices), say:
   - "📈 *Real-time share prices may change. Please check reliable financial sites like Yahoo Finance or Google Finance for the latest data.*"

Keep the tone friendly but professional. Always aim for clarity. Respond only with relevant financial or investing information. If asked an unrelated question, politely redirect the user.
"""
    
    if context:
        system_prompt += f"\n\n--- RELEVANT DOCUMENT EXCERPTS ---\n\n{context}\n\n"
    
    if financial_data:
        system_prompt += f"\n\n--- REAL-TIME FINANCIAL DATA ---\n\n{financial_data}\n\n"
    
    system_prompt += "\nUse the above information if relevant to the user's query. If the information doesn't address the query completely, provide general financial advice based on your knowledge."
    
    return system_prompt

@router.delete("/conversations/{user_id}")
async def clear_conversation(user_id: str):
    """
    Clear conversation history for a user
    """
    try:
        if user_id in conversation_history:
            conversation_history[user_id] = []
        
        return {"status": "success", "message": f"Conversation history cleared for user {user_id}"}
    except Exception as e:
        logger.error(f"Error clearing conversation for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
