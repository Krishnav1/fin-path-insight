import os
import pinecone
from typing import List, Dict, Any, Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Pinecone client
def init_pinecone():
    """Initialize the Pinecone client with API key and environment"""
    try:
        pinecone.init(
            api_key=settings.PINECONE_API_KEY,
            environment=settings.PINECONE_CLOUD
        )
        
        # Check if index exists, if not create it
        if settings.PINECONE_INDEX_NAME not in pinecone.list_indexes():
            pinecone.create_index(
                name=settings.PINECONE_INDEX_NAME,
                dimension=768,  # Dimension for Gemini embeddings
                metric="cosine"
            )
            logger.info(f"Created new Pinecone index: {settings.PINECONE_INDEX_NAME}")
        
        # Connect to the index
        index = pinecone.Index(settings.PINECONE_INDEX_NAME)
        logger.info(f"Successfully connected to Pinecone index: {settings.PINECONE_INDEX_NAME}")
        return index
    except Exception as e:
        logger.error(f"Error initializing Pinecone: {str(e)}")
        raise

# Query similar vectors from Pinecone
async def query_similar_vectors(query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Query Pinecone for vectors similar to the query embedding
    
    Args:
        query_embedding: The embedding vector to query against
        top_k: Number of results to return
        
    Returns:
        List of matches with their scores and metadata
    """
    try:
        # Initialize Pinecone if not already initialized
        index = init_pinecone()
        
        # Query the index
        query_response = index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True
        )
        
        # Format the response
        matches = []
        for match in query_response.matches:
            matches.append({
                "id": match.id,
                "score": match.score,
                "metadata": match.metadata
            })
        
        return matches
    except Exception as e:
        logger.error(f"Error querying Pinecone: {str(e)}")
        return []

# Upsert vectors to Pinecone
async def upsert_vectors(vectors: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Upsert vectors to Pinecone
    
    Args:
        vectors: List of vectors to upsert, each with id, values, and metadata
        
    Returns:
        Response from Pinecone upsert operation
    """
    try:
        # Initialize Pinecone if not already initialized
        index = init_pinecone()
        
        # Upsert the vectors
        response = index.upsert(vectors=vectors)
        
        return response
    except Exception as e:
        logger.error(f"Error upserting vectors to Pinecone: {str(e)}")
        raise

# Delete vectors from Pinecone
async def delete_vectors(ids: List[str]) -> Dict[str, Any]:
    """
    Delete vectors from Pinecone by their IDs
    
    Args:
        ids: List of vector IDs to delete
        
    Returns:
        Response from Pinecone delete operation
    """
    try:
        # Initialize Pinecone if not already initialized
        index = init_pinecone()
        
        # Delete the vectors
        response = index.delete(ids=ids)
        
        return response
    except Exception as e:
        logger.error(f"Error deleting vectors from Pinecone: {str(e)}")
        raise
