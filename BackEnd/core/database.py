from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession # Import async components
from sqlalchemy.orm import sessionmaker, declarative_base # Keep declarative_base
import os

# Use an async driver like asyncmy
DATABASE_URL = "mysql+asyncmy://root@localhost:3306/new_cv" # Changed driver to asyncmy

# Create an async engine
engine = create_async_engine(DATABASE_URL, echo=True) # Set echo=True for debugging if needed

# Create an async session factory
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession, # Use AsyncSession
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

# Define an async dependency for getting the session
async def get_async_db() -> AsyncSession: # Rename to avoid confusion and make it async
    async with AsyncSessionLocal() as session:
        yield session

# Keep the synchronous version for parts that might still need it,
# but prefer the async version for FastAPI routes.
# Consider removing this if everything is migrated to async.
def get_db():
    # This synchronous version will likely cause issues if used with async routes.
    # It's better to migrate fully to get_async_db.
    # For now, we keep it but it might need removal/refactoring later.
    from sqlalchemy import create_engine as create_sync_engine # Avoid name clash
    sync_engine = create_sync_engine("mysql+pymysql://root@localhost:3306/new_cv")
    SyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()
