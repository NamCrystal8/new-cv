from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_async_db
import os

router = APIRouter()

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_async_db)):
    """
    Health check endpoint for Render to monitor the application.
    """
    try:
        # Test database connection
        result = await db.execute(select(1))
        db_connected = result.scalar() == 1

        # Check if admin user exists
        from sqlalchemy import text
        admin_result = await db.execute(
            text('SELECT COUNT(*) FROM "user" WHERE email = :email'),
            {'email': 'admin@cvbuilder.com'}
        )
        admin_exists = admin_result.scalar() > 0

        return {
            "status": "healthy",
            "database": "connected" if db_connected else "disconnected",
            "admin_user": "exists" if admin_exists else "missing",
            "message": "CV Generator API is running"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "error",
            "admin_user": "unknown",
            "error": str(e),
            "message": "CV Generator API has issues"
        }

@router.get("/debug/database")
async def debug_database(db: AsyncSession = Depends(get_async_db)):
    """
    Debug endpoint to test database connectivity.
    """
    try:
        # Execute a simple SQL query to test the connection
        result = await db.execute("SELECT 1 AS is_working")
        row = result.first()
        
        # Get the database URL (with password masked)
        db_url = os.getenv("DATABASE_URL", "Not set")
        if "://" in db_url:
            # Mask the password in the URL for security
            parts = db_url.split("://")
            if len(parts) > 1 and "@" in parts[1]:
                user_pass, rest = parts[1].split("@", 1)
                if ":" in user_pass:
                    user, _ = user_pass.split(":", 1)
                    masked_url = f"{parts[0]}://{user}:****@{rest}"
                else:
                    masked_url = db_url
            else:
                masked_url = db_url
        else:
            masked_url = db_url

        return {
            "status": "ok", 
            "database_connected": row.is_working == 1,
            "driver_info": {
                "url_type": masked_url.split("://")[0] if "://" in masked_url else "unknown",
                "is_postgresql": "postgresql" in masked_url or "postgres" in masked_url,
                "is_sqlite": "sqlite" in masked_url,
                "is_mysql": "mysql" in masked_url
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")
