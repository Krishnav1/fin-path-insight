import os
import logging
import uuid
import pandas as pd
import PyPDF2
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path
import asyncio
from app.utils.gemini_client import generate_embedding
from app.utils.pinecone_client import upsert_vectors
from app.core.config import settings

logger = logging.getLogger(__name__)

# Ensure upload directory exists
os.makedirs(os.path.join(os.getcwd(), settings.UPLOAD_FOLDER), exist_ok=True)

async def process_document(file_path: str, file_name: str, content_type: str) -> Dict[str, Any]:
    """
    Process uploaded document (PDF or CSV) and store embeddings in Pinecone
    
    Args:
        file_path: Path to the uploaded file
        file_name: Original file name
        content_type: MIME type of the file
        
    Returns:
        Dictionary with processing results
    """
    try:
        # Generate a unique document ID
        document_id = str(uuid.uuid4())
        
        # Extract text based on file type
        if content_type == "application/pdf":
            chunks = await extract_text_from_pdf(file_path)
        elif content_type in ["text/csv", "application/vnd.ms-excel"]:
            chunks = await extract_text_from_csv(file_path)
        elif content_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            chunks = await extract_text_from_excel(file_path)
        else:
            raise ValueError(f"Unsupported file type: {content_type}")
        
        # Generate embeddings and store in Pinecone
        vectors = []
        for i, chunk in enumerate(chunks):
            # Generate embedding for the chunk
            embedding = await generate_embedding(chunk)
            
            # Prepare vector for Pinecone
            vector = {
                "id": f"{document_id}_{i}",
                "values": embedding,
                "metadata": {
                    "document_id": document_id,
                    "chunk_index": i,
                    "file_name": file_name,
                    "content_type": content_type,
                    "text": chunk
                }
            }
            
            vectors.append(vector)
        
        # Upsert vectors to Pinecone in batches of 100
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i+batch_size]
            await upsert_vectors(batch)
        
        # Return processing results
        return {
            "document_id": document_id,
            "file_name": file_name,
            "content_type": content_type,
            "chunk_count": len(chunks),
            "vector_count": len(vectors),
            "status": "processed"
        }
    except Exception as e:
        logger.error(f"Error processing document {file_name}: {str(e)}")
        raise

async def extract_text_from_pdf(file_path: str) -> List[str]:
    """
    Extract text from PDF file and split into chunks
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        List of text chunks
    """
    try:
        # Open the PDF file
        with open(file_path, 'rb') as file:
            # Create a PDF reader object
            pdf_reader = PyPDF2.PdfReader(file)
            
            # Extract text from each page
            text = ""
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text() + "\n\n"
        
        # Split text into chunks (approximately 1000 tokens each)
        return split_text_into_chunks(text)
    except Exception as e:
        logger.error(f"Error extracting text from PDF {file_path}: {str(e)}")
        raise

async def extract_text_from_csv(file_path: str) -> List[str]:
    """
    Extract text from CSV file and split into chunks
    
    Args:
        file_path: Path to the CSV file
        
    Returns:
        List of text chunks
    """
    try:
        # Read CSV file
        df = pd.read_csv(file_path)
        
        # Convert DataFrame to string representation
        text = df.to_string()
        
        # Split text into chunks
        return split_text_into_chunks(text)
    except Exception as e:
        logger.error(f"Error extracting text from CSV {file_path}: {str(e)}")
        raise

async def extract_text_from_excel(file_path: str) -> List[str]:
    """
    Extract text from Excel file and split into chunks
    
    Args:
        file_path: Path to the Excel file
        
    Returns:
        List of text chunks
    """
    try:
        # Read Excel file
        df = pd.read_excel(file_path)
        
        # Convert DataFrame to string representation
        text = df.to_string()
        
        # Split text into chunks
        return split_text_into_chunks(text)
    except Exception as e:
        logger.error(f"Error extracting text from Excel {file_path}: {str(e)}")
        raise

def split_text_into_chunks(text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
    """
    Split text into chunks of approximately chunk_size tokens with overlap
    
    Args:
        text: Text to split
        chunk_size: Approximate size of each chunk in tokens
        overlap: Number of tokens to overlap between chunks
        
    Returns:
        List of text chunks
    """
    # Simple approximation: 1 token ≈ 4 characters
    char_size = chunk_size * 4
    overlap_chars = overlap * 4
    
    # Split text into chunks
    chunks = []
    start = 0
    
    while start < len(text):
        # Calculate end position
        end = start + char_size
        
        # Adjust end to not break in the middle of a paragraph
        if end < len(text):
            # Try to find paragraph break
            paragraph_break = text.find('\n\n', end - 200, end + 200)
            if paragraph_break != -1:
                end = paragraph_break + 2
            else:
                # Try to find sentence break
                sentence_break = text.find('. ', end - 100, end + 100)
                if sentence_break != -1:
                    end = sentence_break + 2
                else:
                    # Try to find word break
                    word_break = text.rfind(' ', end - 50, end)
                    if word_break != -1:
                        end = word_break + 1
        
        # Add chunk to list
        if end > len(text):
            end = len(text)
        
        chunks.append(text[start:end])
        
        # Move start position for next chunk (with overlap)
        start = end - overlap_chars if end - overlap_chars > start else end
        
        # Break if we've reached the end of the text
        if start >= len(text):
            break
    
    return chunks

async def update_knowledge_base():
    """
    Weekly task to update the knowledge base with new documents
    This function should be called by a scheduled task
    """
    try:
        logger.info("Starting knowledge base update")
        
        # Get list of files in the upload directory
        upload_dir = os.path.join(os.getcwd(), settings.UPLOAD_FOLDER)
        files = os.listdir(upload_dir)
        
        # Process new files
        for file_name in files:
            file_path = os.path.join(upload_dir, file_name)
            
            # Skip directories
            if os.path.isdir(file_path):
                continue
            
            # Check if file has been processed before
            processed_marker = file_path + ".processed"
            if os.path.exists(processed_marker):
                continue
            
            # Determine content type
            if file_name.endswith(".pdf"):
                content_type = "application/pdf"
            elif file_name.endswith(".csv"):
                content_type = "text/csv"
            elif file_name.endswith(".xlsx"):
                content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            else:
                logger.warning(f"Unsupported file type: {file_name}")
                continue
            
            # Process the document
            logger.info(f"Processing new document: {file_name}")
            result = await process_document(file_path, file_name, content_type)
            
            # Create processed marker file
            with open(processed_marker, "w") as f:
                f.write(str(result))
            
            logger.info(f"Document processed: {file_name}, ID: {result['document_id']}")
        
        logger.info("Knowledge base update completed")
    except Exception as e:
        logger.error(f"Error updating knowledge base: {str(e)}")
        raise
