from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from core.database import get_async_db
import uuid
from passlib.context import CryptContext

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/setup/create-admin")
async def create_admin_endpoint(db: AsyncSession = Depends(get_async_db)):
    """
    Temporary endpoint to create admin user if it doesn't exist.
    This can be called after deployment to ensure admin user is created.
    """
    try:
        # Check if admin already exists
        admin_check = await db.execute(
            text('SELECT COUNT(*) FROM "user" WHERE email = :email'),
            {'email': 'admin@cvbuilder.com'}
        )
        
        if admin_check.scalar() > 0:
            return {
                "status": "success",
                "message": "Admin user already exists",
                "admin_email": "admin@cvbuilder.com"
            }
        
        # Create admin user
        admin_id = str(uuid.uuid4())
        hashed_password = pwd_context.hash("admin123")
        
        await db.execute(
            text('''
                INSERT INTO "user" (id, email, hashed_password, is_active, is_superuser, is_verified, role_id)
                VALUES (:id, :email, :password, :active, :superuser, :verified, :role_id)
            '''),
            {
                'id': admin_id,
                'email': 'admin@cvbuilder.com',
                'password': hashed_password,
                'active': True,
                'superuser': True,
                'verified': True,
                'role_id': 1
            }
        )
        
        await db.commit()
        
        return {
            "status": "success",
            "message": "Admin user created successfully",
            "admin_email": "admin@cvbuilder.com",
            "admin_password": "admin123",
            "note": "Please change the password after first login"
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create admin user: {str(e)}"
        )

@router.get("/setup/status")
async def setup_status(db: AsyncSession = Depends(get_async_db)):
    """
    Check the setup status of the application.
    """
    try:
        # Check tables exist
        tables_result = await db.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """))
        tables = [row[0] for row in tables_result.fetchall()]
        
        # Check roles
        roles_result = await db.execute(text("SELECT COUNT(*) FROM roles"))
        roles_count = roles_result.scalar()
        
        # Check subscription plans
        plans_result = await db.execute(text("SELECT COUNT(*) FROM subscription_plans"))
        plans_count = plans_result.scalar()
        
        # Check admin user
        admin_result = await db.execute(
            text('SELECT COUNT(*) FROM "user" WHERE email = :email'),
            {'email': 'admin@cvbuilder.com'}
        )
        admin_exists = admin_result.scalar() > 0
        
        # Check total users
        users_result = await db.execute(text('SELECT COUNT(*) FROM "user"'))
        users_count = users_result.scalar()
        
        return {
            "status": "success",
            "database": {
                "tables": tables,
                "tables_count": len(tables)
            },
            "data": {
                "roles_count": roles_count,
                "plans_count": plans_count,
                "users_count": users_count,
                "admin_exists": admin_exists
            },
            "ready": {
                "database_schema": len(tables) > 0,
                "roles_initialized": roles_count >= 2,
                "plans_initialized": plans_count >= 3,
                "admin_user": admin_exists,
                "fully_ready": len(tables) > 0 and roles_count >= 2 and plans_count >= 3 and admin_exists
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check setup status: {str(e)}"
        )
