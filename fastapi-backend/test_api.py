"""
Test script for FinInsight API endpoints
Run this script to test the API functionality before deployment
"""
import os
import httpx
import asyncio
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base URL for local testing
BASE_URL = "http://localhost:8000"

# Test endpoints
ENDPOINTS = {
    "health": "/health",
    "stock_data": "/api/market-data/stock/AAPL",
    "market_overview": "/api/market-data/indian-market/overview",
    "latest_news": "/api/news/latest",
    "company_news": "/api/news/company/AAPL",
    "semantic_news": "/api/news/semantic-search?query=technology",
    "stock_analysis": "/api/analysis/stock/AAPL",
    "technical_analysis": "/api/analysis/technical/AAPL",
    "fundamental_analysis": "/api/analysis/fundamental/AAPL",
    "charts": "/api/analysis/charts/AAPL",
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

async def run_tests():
    """Run all API tests"""
    print("Starting API tests...")
    
    # Check if required API keys are set
    required_keys = ["GEMINI_API_KEY", "PINECONE_API_KEY", "FMP_API_KEY", "NEWS_API_KEY"]
    missing_keys = [key for key in required_keys if not os.getenv(key)]
    
    if missing_keys:
        print(f"Warning: The following API keys are missing: {', '.join(missing_keys)}")
        print("Some tests may fail due to missing API keys.")
    
    # Create HTTP client
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Test GET endpoints
        results = {}
        for name, endpoint in ENDPOINTS.items():
            if name != "fingenie_chat":
                results[name] = await test_endpoint(client, name, endpoint)
        
        # Test POST endpoints
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

if __name__ == "__main__":
    asyncio.run(run_tests())
