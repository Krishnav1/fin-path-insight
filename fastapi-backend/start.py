import uvicorn
import os
import sys

print("Python executable:", sys.executable)
print("Python path:", sys.path)

# Get port from environment variable or use default
port = int(os.environ.get("PORT", 8000))

if __name__ == "__main__":
    print(f"Starting FastAPI application on port {port}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, log_level="info")
