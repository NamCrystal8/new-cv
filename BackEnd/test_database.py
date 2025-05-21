"""
Database connection test script.
Run this to verify that your database connection is working properly.
"""
import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import re
import traceback

async def test_database_connection():
    """Test database connection with detailed error reporting."""
    # Get database URL from environment variable
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("ERROR: DATABASE_URL environment variable is not set")
        return False
    
    print(f"Testing connection to database with URL type: {database_url.split('://')[0]}")
    
    # Process URL based on database type
    try:
        if database_url.startswith("sqlite:"):
            if "aiosqlite" not in database_url:
                database_url = re.sub(r'^sqlite:', 'sqlite+aiosqlite:', database_url)
            print("Using SQLite with aiosqlite driver")
            
        elif database_url.startswith("postgres://"):
            print("Converting postgres:// URL to postgresql+asyncpg:// format")
            database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
            
        elif database_url.startswith("postgresql:") and "asyncpg" not in database_url:
            print("Adding asyncpg driver to postgresql:// URL")
            database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
            
        print(f"Final connection string type: {database_url.split('://')[0]}")
        
        # Create engine
        engine = create_async_engine(
            database_url, 
            echo=True,
            pool_pre_ping=True
        )
        
        # Create session
        async_session = sessionmaker(
            engine, 
            expire_on_commit=False,
            class_=AsyncSession
        )
        
        # Test connection
        async with async_session() as session:
            result = await session.execute("SELECT 1 AS is_working")
            row = result.first()
            
            if row and row.is_working == 1:
                print("✅ Database connection successful!")
                return True
            else:
                print("❌ Database query did not return expected result")
                return False
                
    except Exception as e:
        print("❌ Database connection failed with error:")
        print(str(e))
        print("\nTraceback:")
        traceback.print_exc()
        
        print("\nTrying to diagnose the issue:")
        
        if "asyncpg.exceptions" in str(e):
            print("This appears to be an asyncpg driver issue.")
            print("Make sure asyncpg is installed: pip install asyncpg>=0.27.0")
            
        elif "psycopg2" in str(e):
            print("This appears to be related to psycopg2.")
            print("Ensure you're using asyncpg for async code, not psycopg2.")
            
        elif "not installed" in str(e):
            print("A required database driver is missing.")
            print("Check that all requirements are installed: pip install -r requirements.txt")
            
        return False

if __name__ == "__main__":
    print("Database Connection Test")
    print("-----------------------")
    
    # Check package versions
    try:
        import sqlalchemy
        print(f"SQLAlchemy version: {sqlalchemy.__version__}")
        
        try:
            import asyncpg
            print(f"asyncpg version: {asyncpg.__version__}")
        except ImportError:
            print("asyncpg not installed!")
            
        try:
            import psycopg2
            print(f"psycopg2 version: {psycopg2.__version__}")
        except ImportError:
            print("psycopg2 not installed!")
            
        try:
            import aiosqlite
            print(f"aiosqlite version: {aiosqlite.__version__}")
        except ImportError:
            print("aiosqlite not installed!")
    
    except ImportError as e:
        print(f"Error importing modules: {e}")
    
    result = asyncio.run(test_database_connection())
    
    if result:
        print("\nDatabase connection test passed!")
        sys.exit(0)
    else:
        print("\nDatabase connection test failed!")
        sys.exit(1)
