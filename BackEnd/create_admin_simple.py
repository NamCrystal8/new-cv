"""
Simple script to create admin user without role dependencies
"""
import asyncio
import sys
import os
import uuid
import traceback

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_async_db
from models.user import User
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_admin_user():
    """Create admin user with proper role handling"""
    print("🔧 Creating admin user...")

    async for db in get_async_db():
        try:
            # First, check the database schema
            print("Checking database schema...")
            schema_query = """
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'user' AND table_schema = 'public'
                ORDER BY ordinal_position;
            """
            schema_result = await db.execute(text(schema_query))
            columns = schema_result.fetchall()

            print("User table columns:")
            for col in columns:
                print(f"  - {col[0]}: {col[1]} (nullable: {col[2]})")

            # Check if admin user already exists
            admin_email = "admin@cvbuilder.com"
            print(f"Checking if admin user {admin_email} exists...")

            existing_admin = await db.execute(
                select(User).where(User.email == admin_email)
            )

            if existing_admin.scalar_one_or_none():
                print(f"ℹ️ Admin user {admin_email} already exists!")
                return

            # Create admin user using raw SQL to handle the role column
            print(f"Creating admin user: {admin_email}")

            admin_id = str(uuid.uuid4())
            hashed_password = pwd_context.hash("admin123")

            # Check if role column exists and what type it is
            role_column_exists = any(col[0] == 'role' for col in columns)

            if role_column_exists:
                # Use raw SQL to insert with a default role value
                insert_query = """
                    INSERT INTO "user" (id, email, hashed_password, is_active, is_superuser, is_verified, role)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                """
                await db.execute(text(insert_query), (
                    admin_id, admin_email, hashed_password, True, True, True, "Admin"
                ))
            else:
                # Use the User model if no role column
                admin_user = User(
                    id=uuid.UUID(admin_id),
                    email=admin_email,
                    hashed_password=hashed_password,
                    is_active=True,
                    is_verified=True,
                    is_superuser=True
                )
                db.add(admin_user)

            await db.commit()

            print("✅ Admin user created successfully!")
            print(f"📧 Email: {admin_email}")
            print(f"🔑 Password: admin123")
            print("⚠️  IMPORTANT: Change the password after first login!")
            print(f"🔗 Login at: https://your-frontend-url.onrender.com/login")

        except Exception as exc:
            print(f"❌ Error creating admin user: {exc}")
            print(f"Stack trace: {traceback.format_exc()}")
            await db.rollback()
        finally:
            await db.close()
            break


async def create_test_user():
    """Create a test user for development"""
    print("🔧 Creating test user...")
    
    async for db in get_async_db():
        try:
            # Check if test user already exists
            test_email = "test@example.com"
            print(f"Checking if test user {test_email} exists...")
            
            existing_user = await db.execute(
                select(User).where(User.email == test_email)
            )
            
            if existing_user.scalar_one_or_none():
                print(f"ℹ️ Test user {test_email} already exists!")
                return
            
            # Create test user
            print(f"Creating test user: {test_email}")
            
            test_user = User(
                id=uuid.uuid4(),
                email=test_email,
                hashed_password=pwd_context.hash("test123"),
                is_active=True,
                is_verified=True,
                is_superuser=False
            )
            
            db.add(test_user)
            await db.commit()
            
            print("✅ Test user created successfully!")
            print(f"📧 Email: {test_email}")
            print(f"🔑 Password: test123")
                
        except Exception as exc:
            print(f"❌ Error creating test user: {exc}")
            print(f"Stack trace: {traceback.format_exc()}")
            await db.rollback()
        finally:
            await db.close()
            break


async def main():
    """Main function to create both admin and test users"""
    print("🚀 Starting user creation process...")
    
    await create_admin_user()
    print()  # Empty line for separation
    await create_test_user()
    
    print()
    print("🎉 User creation process completed!")
    print()
    print("📋 Summary:")
    print("- Admin: admin@cvbuilder.com / admin123")
    print("- Test User: test@example.com / test123")
    print()
    print("⚠️  Remember to change the admin password after first login!")


if __name__ == "__main__":
    asyncio.run(main())
