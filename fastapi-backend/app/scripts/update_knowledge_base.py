import asyncio
import sys
import os
import logging
from pathlib import Path

# Add parent directory to path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.utils.document_processor import update_knowledge_base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("knowledge_base_update.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

async def main():
    """Run the knowledge base update task"""
    try:
        logger.info("Starting weekly knowledge base update task")
        await update_knowledge_base()
        logger.info("Knowledge base update task completed successfully")
    except Exception as e:
        logger.error(f"Error running knowledge base update task: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
