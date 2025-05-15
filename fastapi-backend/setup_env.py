"""
Environment Setup Script for FinPath Insight
This script helps set up the .env file with proper values and tests the connection
"""

import os
import sys
import asyncio
import logging
from pathlib import Path
import getpass
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

ENV_TEMPLATE_PATH = Path(__file__).parent / ".env.example"
ENV_PATH = Path(__file__).parent / ".env"

def validate_url(url):
    """Validate that a URL has the correct format with protocol"""
    if not url:
        return False
    
    url_pattern = re.compile(r'^https?://.*')
    return bool(url_pattern.match(url))

async def test_supabase_connection(url, key):
    """Test the Supabase connection with the provided credentials"""
    if not validate_url(url):
        logger.error(f"Invalid Supabase URL format: {url}")
        logger.error("URL must start with http:// or https://")
        return False
    
    try:
        # Add the parent directory to the path so we can import from app
        sys.path.append(str(Path(__file__).parent))
        
        # Import here to avoid circular imports
        from app.db.supabase import create_supabase_client
        
        # Create a test client with the provided credentials
        test_client = create_supabase_client(url, key)
        
        # Try a simple query to check connection
        result = await test_client.select("cache", "count(*)", None, 1)
        logger.info("Supabase connection successful!")
        return True
    except Exception as e:
        logger.error(f"Supabase connection failed: {str(e)}")
        return False

def create_env_file():
    """Create a .env file with user input for required values"""
    if not ENV_TEMPLATE_PATH.exists():
        logger.error(f".env.example file not found at {ENV_TEMPLATE_PATH}")
        return False
    
    # Read the template file
    with open(ENV_TEMPLATE_PATH, 'r') as f:
        template_content = f.read()
    
    # Collect required values from user
    print("\n=== FinPath Insight Environment Setup ===\n")
    print("Please enter the following required values:\n")
    
    # Supabase settings (required)
    supabase_url = input("Supabase URL (must start with https://): ")
    supabase_key = getpass.getpass("Supabase Anon Key: ")
    
    # API keys (at least one required)
    fmp_api_key = getpass.getpass("Financial Modeling Prep API Key (optional): ")
    news_api_key = getpass.getpass("News API Key (optional): ")
    
    # Replace placeholders in the template
    env_content = template_content
    env_content = env_content.replace("your_supabase_url_here", supabase_url)
    env_content = env_content.replace("your_supabase_anon_key_here", supabase_key)
    
    if fmp_api_key:
        env_content = env_content.replace("your_fmp_api_key_here", fmp_api_key)
    
    if news_api_key:
        env_content = env_content.replace("your_news_api_key_here", news_api_key)
    
    # Write the .env file
    with open(ENV_PATH, 'w') as f:
        f.write(env_content)
    
    logger.info(f".env file created at {ENV_PATH}")
    return supabase_url, supabase_key

async def main():
    """Main function to set up the environment"""
    logger.info("Starting environment setup")
    
    if ENV_PATH.exists():
        overwrite = input(".env file already exists. Overwrite? (y/n): ").lower()
        if overwrite != 'y':
            logger.info("Setup cancelled. Using existing .env file.")
            return
    
    # Create the .env file
    supabase_credentials = create_env_file()
    
    if not supabase_credentials:
        logger.error("Failed to create .env file")
        return
    
    # Test the Supabase connection
    supabase_url, supabase_key = supabase_credentials
    connection_success = await test_supabase_connection(supabase_url, supabase_key)
    
    if connection_success:
        logger.info("Environment setup completed successfully!")
        logger.info("\nNext steps:")
        logger.info("1. Run 'python -m app.scripts.update_database' to set up the database tables")
        logger.info("2. Start the API server with 'uvicorn app.main:app --reload'")
        logger.info("3. Test the API with 'python test_api.py'")
    else:
        logger.error("Environment setup failed. Please check your Supabase credentials.")
        logger.error("Make sure your Supabase URL starts with https://")

if __name__ == "__main__":
    asyncio.run(main())
