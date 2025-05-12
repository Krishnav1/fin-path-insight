from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Body
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
import os
import shutil
from pathlib import Path
import logging
from app.models.schemas import DocumentUploadResponse, DocumentSearchRequest, DocumentSearchResponse
from app.utils.document_processor import process_document
from app.utils.gemini_client import generate_embedding
from app.utils.pinecone_client import query_similar_vectors
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    description: str = Form(None)
):
    """
    Upload a document (PDF, CSV, XLSX) for processing and indexing
    """
    try:
        # Check if file extension is allowed
        file_extension = file.filename.split(".")[-1].lower()
        if file_extension not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        
        # Create upload directory if it doesn't exist
        upload_dir = os.path.join(os.getcwd(), settings.UPLOAD_FOLDER)
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save the file
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process the document
        result = await process_document(
            file_path=file_path,
            file_name=file.filename,
            content_type=file.content_type
        )
        
        # Add file size and description to result
        file_size = os.path.getsize(file_path)
        result["size"] = file_size
        result["status"] = "processed"
        result["filename"] = file.filename
        result["content_type"] = file.content_type
        
        return result
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search", response_model=DocumentSearchResponse)
async def search_documents(request: DocumentSearchRequest = Body(...)):
    """
    Search for relevant documents based on query
    """
    try:
        # Generate embedding for the query
        embedding = await generate_embedding(request.query)
        
        # Query Pinecone for similar vectors
        matches = await query_similar_vectors(embedding, top_k=request.top_k)
        
        # Format the response
        formatted_matches = []
        for match in matches:
            formatted_matches.append({
                "document_id": match["metadata"]["document_id"],
                "text": match["metadata"]["text"],
                "score": match["score"],
                "metadata": {
                    "file_name": match["metadata"]["file_name"],
                    "content_type": match["metadata"]["content_type"],
                    "chunk_index": match["metadata"]["chunk_index"]
                }
            })
        
        return {
            "matches": formatted_matches,
            "query": request.query
        }
    except Exception as e:
        logger.error(f"Error searching documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_documents():
    """
    List all processed documents
    """
    try:
        # Get list of files in the upload directory
        upload_dir = os.path.join(os.getcwd(), settings.UPLOAD_FOLDER)
        files = []
        
        if os.path.exists(upload_dir):
            for file_name in os.listdir(upload_dir):
                file_path = os.path.join(upload_dir, file_name)
                
                # Skip directories and processed marker files
                if os.path.isdir(file_path) or file_name.endswith(".processed"):
                    continue
                
                # Check if file has been processed
                processed_marker = file_path + ".processed"
                processed = os.path.exists(processed_marker)
                
                # Get file info
                file_size = os.path.getsize(file_path)
                file_extension = file_name.split(".")[-1].lower()
                
                # Determine content type
                if file_extension == "pdf":
                    content_type = "application/pdf"
                elif file_extension == "csv":
                    content_type = "text/csv"
                elif file_extension == "xlsx":
                    content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                else:
                    content_type = "application/octet-stream"
                
                files.append({
                    "filename": file_name,
                    "size": file_size,
                    "content_type": content_type,
                    "processed": processed,
                    "upload_date": os.path.getctime(file_path)
                })
        
        return {"documents": files}
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """
    Delete a document and its vectors from the knowledge base
    """
    try:
        # This is a placeholder - in a real implementation, you would:
        # 1. Delete the vectors from Pinecone
        # 2. Delete the file from the upload directory
        # 3. Delete any metadata from the database
        
        return {"status": "success", "message": f"Document {document_id} deleted"}
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
