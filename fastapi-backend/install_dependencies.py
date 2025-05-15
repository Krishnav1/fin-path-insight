#!/usr/bin/env python
"""
Emergency dependency installer for Render deployment
This script will install the core dependencies needed to run the FastAPI application
"""

import subprocess
import sys
import os

def run_command(command):
    print(f"Running: {command}")
    process = subprocess.run(command, shell=True, capture_output=True, text=True)
    print(f"Return code: {process.returncode}")
    print(f"Output: {process.stdout}")
    if process.stderr:
        print(f"Error: {process.stderr}")
    return process.returncode == 0

def main():
    print("Emergency dependency installer for Render deployment")
    print(f"Python version: {sys.version}")
    print(f"Python executable: {sys.executable}")
    
    # Core dependencies that must be installed
    core_deps = [
        "pip install --upgrade pip",
        "pip install fastapi==0.104.1",
        "pip install uvicorn==0.24.0",
        "pip install pydantic==2.4.2",
        "pip install python-dotenv==1.0.0",
        "pip install httpx==0.23.3",
    ]
    
    success = True
    for cmd in core_deps:
        if not run_command(cmd):
            success = False
            print(f"Failed to install: {cmd}")
    
    if success:
        print("Core dependencies installed successfully!")
    else:
        print("Some dependencies failed to install.")
    
    # Try to run the application
    if os.path.exists("start.py"):
        print("Attempting to run start.py...")
        run_command("python start.py")
    else:
        print("start.py not found, trying to run uvicorn directly...")
        port = os.environ.get("PORT", "8000")
        run_command(f"python -m uvicorn app.main:app --host 0.0.0.0 --port {port}")

if __name__ == "__main__":
    main()
