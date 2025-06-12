#!/usr/bin/env python3
"""
Simple admin user creation script for Render deployment
Fallback if FastAPI Users creation fails
"""
import asyncio
import uuid
from passlib.context import CryptContext
from sqlalchemy import text
from core.database import get_async_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin_simple():
    """Create admin user with simple approach"""
    print("👤 Creating admin user (simple method)...")
    
    async for db in get_async_db():
        try:
            # Check if admin exists
            admin_check = await db.execute(
                text('SELECT COUNT(*) FROM "user" WHERE email = :email'),
                {'email': 'admin@cvbuilder.com'}
            )
            
            if admin_check.scalar() > 0:
                print("   ✅ Admin user already exists")
                return True
            
            # Create admin user directly
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
            
            print("   ✅ Created admin user:")
            print("      Email: admin@cvbuilder.com")
            print("      Password: admin123")
            print("      Role: Admin (role_id=1)")
            
            return True
            
        except Exception as e:
            print(f"   ⚠️ Failed to create admin user: {e}")
            print(f"   ℹ️ Admin user can be created later via /setup/create-admin endpoint")
            await db.rollback()
            return True  # Don't fail deployment
        finally:
            await db.close()
            break

if __name__ == "__main__":
    success = asyncio.run(create_admin_simple())
    exit(0 if success else 1)
