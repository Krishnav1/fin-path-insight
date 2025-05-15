from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="FinPath Insight API (Minimal Test)",
    description="Minimal test version of FastAPI backend for FinPath Insight",
    version="1.0.0"
)

# Configure CORS
allowed_origins = [
    "http://localhost:8080",
    "http://localhost:3000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Environment", "X-Client-Version"],
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to FinPath Insight API (Minimal Test)",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

@app.get("/api/test")
async def test_endpoint():
    return {
        "status": "success",
        "message": "API is working correctly",
        "timestamp": "2025-05-15T04:08:49+05:30"
    }

if __name__ == "__main__":
    uvicorn.run("minimal_test_app:app", host="127.0.0.1", port=8000, reload=True)
