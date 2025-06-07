"""
Script to create an admin user for testing the admin panel
"""
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
from models.user import User
from models.role import Role
from core.database import Base
import uuid
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin_user():
    # Database URL
    DATABASE_URL = os.getenv("DATABASE_URL", "mysql+aiomysql://root:password@localhost/cv_db")
    
    # Create engine
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    # Create session
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # First, ensure roles exist
            print("Checking roles...")
            
            # Check if admin role exists
            admin_role_result = await session.execute(
                select(Role).where(Role.id == 1)
            )
            admin_role = admin_role_result.scalar_one_or_none()
            
            if not admin_role:
                print("Creating admin role...")
                admin_role = Role(id=1, role_name="ADMIN")
                session.add(admin_role)
            
            # Check if user role exists
            user_role_result = await session.execute(
                select(Role).where(Role.id == 2)
            )
            user_role = user_role_result.scalar_one_or_none()
            
            if not user_role:
                print("Creating user role...")
                user_role = Role(id=2, role_name="USER")
                session.add(user_role)
            
            await session.commit()
            print("Roles created/verified successfully")
            
            # Check if admin user already exists
            admin_email = "admin@cvbuilder.com"
            existing_admin = await session.execute(
                select(User).where(User.email == admin_email)
            )
            
            if existing_admin.scalar_one_or_none():
                print(f"Admin user {admin_email} already exists!")
                return
            
            # Create admin user
            print(f"Creating admin user: {admin_email}")
            
            admin_user = User(
                id=uuid.uuid4(),
                email=admin_email,
                hashed_password=pwd_context.hash("admin123"),  # Change this password!
                is_active=True,
                is_verified=True,
                is_superuser=True,
                role_id=1  # Admin role
            )
            
            session.add(admin_user)
            await session.commit()
            
            print("✅ Admin user created successfully!")
            print(f"Email: {admin_email}")
            print("Password: admin123")
            print("⚠️  Please change the password after first login!")
            
        except Exception as e:
            print(f"❌ Error creating admin user: {e}")
            await session.rollback()
        finally:
            await session.close()
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_admin_user())
