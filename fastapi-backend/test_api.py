"""
Test script for FinPath Insight API endpoints
Run this script to test the API functionality before deployment
"""
import os
import httpx
import asyncio
import json
import sys
import subprocess
import time
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Base URL for local testing
BASE_URL = "http://localhost:8000"

# Test endpoints
ENDPOINTS = {
    # Health check endpoints
    "health": "/api/health",
    "health_ready": "/api/health/ready",
    "health_live": "/api/health/live",
    
    # Market data endpoints
    "stock_data": "/api/market-data/stock/RELIANCE.NS",
    "market_overview": "/api/market-data/indian-market/overview",
    "index_movers": "/api/market-data/indian-market/index-movers/NIFTY50",
    "market_status": "/api/market-data/market/status",
    
    # Supabase data endpoints
    "supabase_health": "/api/supabase/health",
    "supabase_stocks": "/api/supabase/stocks/RELIANCE.NS",
    "supabase_market": "/api/supabase/market-overview/india",
    "supabase_news": "/api/supabase/news",
    
    # News endpoints
    "latest_news": "/api/news/latest",
    "company_news": "/api/news/company/RELIANCE.NS",
    "semantic_news": "/api/news/semantic-search?query=market",
    
    # Analysis endpoints
    "stock_analysis": "/api/analysis/stock/RELIANCE.NS",
    "technical_analysis": "/api/analysis/technical/RELIANCE.NS",
    "fundamental_analysis": "/api/analysis/fundamental/RELIANCE.NS",
    "charts": "/api/analysis/charts/RELIANCE.NS",
    
    # AI endpoints
    "fingenie_chat": "/api/fingenie/chat"
}

# Chat message for testing FinGenie
CHAT_MESSAGE = {
    "userId": "test-user",
    "message": "What's the price forecast for Nvidia?"
}

async def test_endpoint(client, name, endpoint, method="GET", data=None):
    """Test an API endpoint and print the result"""
    print(f"\n--- Testing {name} endpoint ---")
    try:
        if method == "GET":
            response = await client.get(f"{BASE_URL}{endpoint}")
        elif method == "POST":
            response = await client.post(f"{BASE_URL}{endpoint}", json=data)
        
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            # Print a summary of the response
            if isinstance(result, dict):
                print(f"Response keys: {list(result.keys())}")
                # Print first few items for each key if they are lists
                for key, value in result.items():
                    if isinstance(value, list) and len(value) > 0:
                        print(f"  {key}: {len(value)} items")
                        if len(value) > 0 and isinstance(value[0], dict):
                            print(f"    First item keys: {list(value[0].keys())}")
            elif isinstance(result, list):
                print(f"Response: List with {len(result)} items")
                if len(result) > 0 and isinstance(result[0], dict):
                    print(f"  First item keys: {list(result[0].keys())}")
            
            print("Test PASSED")
            return True
        else:
            print(f"Error: {response.text}")
            print("Test FAILED")
            return False
    except Exception as e:
        print(f"Exception: {str(e)}")
        print("Test FAILED")
        return False

async def setup_database():
    """Run the database setup script"""
    print("\n--- Setting up database ---")
    try:
        # Import and run the database update script
        script_path = Path(__file__).parent / "app" / "scripts" / "update_database.py"
        if not script_path.exists():
            print(f"Error: Database update script not found at {script_path}")
            return False
        
        # Run the script as a subprocess
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("Database setup completed successfully")
            return True
        else:
            print(f"Database setup failed with error:\n{result.stderr}")
            return False
    except Exception as e:
        print(f"Error running database setup: {str(e)}")
        return False

async def run_tests():
    """Run all API tests"""
    print("Starting API tests at", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    
    # Check if required API keys are set
    required_keys = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "FMP_API_KEY", "NEWS_API_KEY"]
    missing_keys = [key for key in required_keys if not os.getenv(key)]
    
    if missing_keys:
        print(f"Warning: The following API keys are missing: {', '.join(missing_keys)}")
        print("Some tests may fail due to missing API keys.")
    
    # Setup database first
    db_setup_success = await setup_database()
    if not db_setup_success:
        print("Warning: Database setup was not successful. Some tests may fail.")
    
    # Create HTTP client with a longer timeout for slow API responses
    async with httpx.AsyncClient(timeout=60.0) as client:
        # First test health endpoints to make sure the API is running
        health_result = await test_endpoint(client, "health", ENDPOINTS["health"])
        if not health_result:
            print("Health check failed. Make sure the API server is running.")
            print("Run 'uvicorn app.main:app --reload' to start the server.")
            return
        
        # Test all GET endpoints
        results = {}
        print("\n--- Testing GET endpoints ---")
        for name, endpoint in ENDPOINTS.items():
            if name != "fingenie_chat":
                results[name] = await test_endpoint(client, name, endpoint)
        
        # Test POST endpoints
        print("\n--- Testing POST endpoints ---")
        results["fingenie_chat"] = await test_endpoint(
            client, 
            "fingenie_chat", 
            ENDPOINTS["fingenie_chat"], 
            method="POST", 
            data=CHAT_MESSAGE
        )
        
        # Print summary
        print("\n--- Test Summary ---")
        passed = sum(1 for result in results.values() if result)
        failed = sum(1 for result in results.values() if not result)
        print(f"Total tests: {len(results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        
        if failed == 0:
            print("\n✅ All tests passed! The API is ready for deployment.")
        else:
            print(f"\n❌ {failed} tests failed. Please fix the issues before deployment.")
            
        # Print instructions for deployment
        print("\n--- Deployment Instructions ---")
        print("1. Commit your changes to GitHub:")
        print("   git add .")
        print("   git commit -m \"Fix API issues and prepare for deployment\"")
        print("   git push origin main")
        print("2. Deploy to Render using the render.yaml configuration:")
        print("   - Go to https://dashboard.render.com/")
        print("   - Connect your GitHub repository")
        print("   - Select 'Blueprint' and use the render.yaml file")
        print("3. Set up environment variables in the Render dashboard")
        print("4. Monitor the deployment logs for any issues")

if __name__ == "__main__":
    # Check if the server is running
    try:
        # Try to connect to the server
        response = httpx.get(f"{BASE_URL}/api/health/live", timeout=2.0)
        if response.status_code == 200:
            print("API server is running. Starting tests...")
            asyncio.run(run_tests())
        else:
            print(f"API server returned status code {response.status_code}. Starting server...")
            # Start the server in a separate process
            server_process = subprocess.Popen(
                [sys.executable, "-m", "uvicorn", "app.main:app", "--reload"],
                cwd=str(Path(__file__).parent)
            )
            # Wait for the server to start
            print("Waiting for server to start...")
            time.sleep(5)
            # Run the tests
            try:
                asyncio.run(run_tests())
            finally:
                # Terminate the server process
                server_process.terminate()
    except httpx.ConnectError:
        print("API server is not running. Starting server...")
        # Start the server in a separate process
        server_process = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--reload"],
            cwd=str(Path(__file__).parent)
        )
        # Wait for the server to start
        print("Waiting for server to start...")
        time.sleep(5)
        # Run the tests
        try:
            asyncio.run(run_tests())
        finally:
            # Terminate the server process
            server_process.terminate()
