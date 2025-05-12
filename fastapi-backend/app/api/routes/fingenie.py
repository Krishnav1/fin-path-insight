from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
from app.models.schemas import ChatMessage, ChatResponse
from app.utils.gemini_client import generate_text_response, generate_embedding
from app.utils.pinecone_client import query_similar_vectors
from app.utils.alpha_vantage_client import fetch_stock_data

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
        
        # Add bot response to history
        conversation_history[user_id].append({
            "sender": "model",
            "text": bot_response,
            "timestamp": datetime.now().isoformat()
        })
        
        # Limit conversation history to last 20 messages
        if len(conversation_history[user_id]) > 20:
            conversation_history[user_id] = conversation_history[user_id][-20:]
        
        logger.info(f"FinGenie responded to {user_id}")
        
        return {"message": bot_response}
    except Exception as e:
        logger.error(f"Error in FinGenie chat: {str(e)}")
        return {
            "message": "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment."
        }

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
        
        # Fetch data for each symbol
        data = []
        for symbol in stock_symbols:
            stock_data = await fetch_stock_data(symbol)
            if stock_data:
                data.append(f"{symbol}: ₹{stock_data.get('price', 'N/A')} ({'+' if stock_data.get('change_percent', 0) > 0 else ''}{stock_data.get('change_percent', 'N/A')}%)")
        
        if not data:
            return ""
        
        return "Real-time stock data:\n" + "\n".join(data)
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
