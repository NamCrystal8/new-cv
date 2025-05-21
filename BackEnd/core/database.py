from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os
import re

# Get database URL from environment variable or use default
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+asyncmy://root@localhost:3306/new_cv")

# Handle different database URL formats
if DATABASE_URL.startswith("sqlite:"):
    # For SQLite, we need to use aiosqlite as the driver
    if "aiosqlite" not in DATABASE_URL:
        DATABASE_URL = re.sub(r'^sqlite:', 'sqlite+aiosqlite:', DATABASE_URL)
    print(f"Using SQLite database: {DATABASE_URL}")
    engine = create_async_engine(
        DATABASE_URL, 
        echo=True,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )
elif DATABASE_URL.startswith("postgres:"):
    # Render provides PostgreSQL URLs starting with postgres://
    # Make sure we always use the asyncpg driver
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    print(f"Using PostgreSQL database with asyncpg: {DATABASE_URL}")
    engine = create_async_engine(DATABASE_URL, echo=True, pool_pre_ping=True)
elif DATABASE_URL.startswith("postgresql:") and "asyncpg" not in DATABASE_URL:
    # Handle postgresql:// URL without asyncpg
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    print(f"Converted PostgreSQL URL to use asyncpg: {DATABASE_URL}")
    engine = create_async_engine(DATABASE_URL, echo=True, pool_pre_ping=True)
else:
    # MySQL or other database
    print(f"Using database with URL: {DATABASE_URL}")
    engine = create_async_engine(DATABASE_URL, echo=True, pool_pre_ping=True)

# Create base declarative class
Base = declarative_base()

# Create an async session factory
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Define an async dependency for getting the session
async def get_async_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# For backwards compatibility - points to the async version
# All code should be using get_async_db now
get_db = get_async_db
