import os
import logging
import httpx
from typing import Dict, Any, List, Optional
import json
from datetime import datetime, timedelta
from app.core.config import settings
from app.utils.gemini_client import generate_embedding
from app.utils.pinecone_client import upsert_vectors, query_similar_vectors

logger = logging.getLogger(__name__)

# Base URL for NewsAPI
BASE_URL = "https://newsapi.org/v2"

# Cache for storing API responses to avoid redundant calls
api_cache = {}

async def fetch_news(query: Optional[str] = None, category: str = "business", limit: int = 10) -> List[Dict[str, Any]]:
    """
    Fetch news from NewsAPI
    
    Args:
        query: Search query (e.g., company name, topic)
        category: News category (business, technology, etc.)
        limit: Maximum number of news items to return
        
    Returns:
        List of dictionaries with news data
    """
    cache_key = f"news_{query}_{category}_{limit}"
    
    # Check if data is in cache and not expired (30 minutes)
    if cache_key in api_cache:
        cache_time, cache_data = api_cache[cache_key]
        if datetime.now() - cache_time < timedelta(minutes=30):
            logger.info(f"Using cached news data for {query}")
            return cache_data
    
    try:
        # Prepare request parameters
        params: Dict[str, Any] = {
             "apiKey": settings.NEWS_API_KEY,
             "language": "en",
             "pageSize": limit
         }
        if query:
            params["sortBy"] = "publishedAt"
        
        if query:
            params["q"] = query
        else:
            params["category"] = category
        
        # Make API request
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/everything" if query else f"{BASE_URL}/top-headlines", params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                if "articles" in data:
                    articles = data["articles"]
                    
                    # Store articles in Pinecone for semantic search
                    await store_news_in_pinecone(articles)
                    
                    # Cache the result
                    api_cache[cache_key] = (datetime.now(), articles)
                    
                    return articles
            
            # Return empty list if API fails
            return []
    except Exception as e:
        logger.error(f"Error fetching news: {str(e)}")
        return []

async def store_news_in_pinecone(articles: List[Dict[str, Any]]) -> None:
    """
    Store news articles in Pinecone for semantic search
    
    Args:
        articles: List of news articles
    """
    try:
        vectors = []
        
        for i, article in enumerate(articles):
            # Generate embedding for the article
            title = article.get("title", "")
            description = article.get("description", "")
            content = article.get("content", "")
            
            # Combine title, description, and content for embedding
            text = f"{title}\n{description}\n{content}"
            
            # Generate embedding
            embedding = await generate_embedding(text)
            
            # Create vector for Pinecone
            vector = {
                "id": f"news_{datetime.now().strftime('%Y%m%d%H%M%S')}_{i}",
                "values": embedding,
                "metadata": {
                    "title": title,
                    "description": description,
                    "url": article.get("url", ""),
                    "source": article.get("source", {}).get("name", ""),
                    "publishedAt": article.get("publishedAt", ""),
                    "type": "news"
                }
            }
            
            vectors.append(vector)
        
        # Upsert vectors to Pinecone
        if vectors:
            await upsert_vectors(vectors)
    except Exception as e:
        logger.error(f"Error storing news in Pinecone: {str(e)}")

async def search_news_semantic(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Search news semantically using Pinecone
    
    Args:
        query: Search query
        limit: Maximum number of results to return
        
    Returns:
        List of dictionaries with news data
    """
    try:
        # Generate embedding for the query
        query_embedding = await generate_embedding(query)
        if not query_embedding:
            logger.warning("Embedding generation failed – returning empty result set")
            return []
        matches = await query_similar_vectors(query_embedding, limit)
        
        # Format results
        results = []
        for match in matches:
            if match.get("metadata", {}).get("type") == "news":
                results.append({
                    "title": match.get("metadata", {}).get("title", ""),
                    "description": match.get("metadata", {}).get("description", ""),
                    "url": match.get("metadata", {}).get("url", ""),
                    "source": match.get("metadata", {}).get("source", ""),
                    "publishedAt": match.get("metadata", {}).get("publishedAt", ""),
                    "relevance": match.get("score", 0)
                })
        
        return results
    except Exception as e:
        logger.error(f"Error searching news semantically: {str(e)}")
        return []

def format_news_for_frontend(news_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Format news data in the structure expected by the frontend
    
    Args:
        news_items: List of news items from NewsAPI
        
    Returns:
        List of news articles formatted for the frontend
    """
    formatted_articles = []
    
    for item in news_items:
        # Check if the item is already in the expected format
        if "urlToImage" in item and "source" in item and isinstance(item["source"], dict):
            formatted_articles.append(item)
            continue
            
        # Format from NewsAPI structure
        article = {
            "title": item.get("title", ""),
            "description": item.get("description", ""),
            "url": item.get("url", ""),
            "urlToImage": item.get("urlToImage", "https://placehold.co/600x400/png?text=News"),
            "publishedAt": item.get("publishedAt", datetime.now().isoformat()),
            "content": item.get("content", ""),
            "source": {
                "id": item.get("source", {}).get("id", ""),
                "name": item.get("source", {}).get("name", "News Source")
            },
            "author": item.get("author", "")
        }
        
        formatted_articles.append(article)
    
    return formatted_articles
