from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

# Create SQLAlchemy engine
try:
    engine = create_engine(settings.DATABASE_URL)
    logger.info("Database connection established successfully")
except Exception as e:
    logger.error(f"Error connecting to database: {str(e)}")
    # Fallback to SQLite for local development if needed
    engine = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})
    logger.warning("Using SQLite fallback database")

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
