"""
Robust script to create admin user that handles any database schema
"""
import asyncio
import sys
import os
import uuid

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from core.database import get_async_db
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_admin_robust():
    """Create admin user that works with any database schema"""
    print("🔧 Creating admin user (robust method)...")
    
    async for db in get_async_db():
        try:
            admin_email = "admin@cvbuilder.com"
            admin_password = "admin123"
            
            # Check if admin already exists
            print(f"Checking if admin user {admin_email} exists...")
            check_query = 'SELECT email FROM "user" WHERE email = $1'
            existing = await db.execute(text(check_query), (admin_email,))
            
            if existing.fetchone():
                print(f"ℹ️ Admin user {admin_email} already exists!")
                return
            
            # Get the user table schema
            print("Analyzing user table schema...")
            schema_query = """
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'user' AND table_schema = 'public'
                ORDER BY ordinal_position;
            """
            schema_result = await db.execute(text(schema_query))
            columns = {row[0]: row for row in schema_result.fetchall()}
            
            # Prepare admin data
            admin_id = str(uuid.uuid4())
            hashed_password = pwd_context.hash(admin_password)
            
            # Build the INSERT query dynamically based on available columns
            insert_columns = ['id', 'email', 'hashed_password', 'is_active', 'is_superuser', 'is_verified']
            insert_values = [admin_id, admin_email, hashed_password, True, True, True]
            placeholders = ['$1', '$2', '$3', '$4', '$5', '$6']
            
            # Handle the role column if it exists
            if 'role' in columns:
                print("Found 'role' column, adding Admin role...")
                insert_columns.append('role')
                insert_values.append('Admin')
                placeholders.append('$7')
            elif 'role_id' in columns:
                print("Found 'role_id' column, setting to 1 (Admin)...")
                insert_columns.append('role_id')
                insert_values.append(1)
                placeholders.append('$7')
            
            # Create the INSERT query
            columns_str = ', '.join(f'"{col}"' for col in insert_columns)
            placeholders_str = ', '.join(placeholders)
            
            insert_query = f"""
                INSERT INTO "user" ({columns_str})
                VALUES ({placeholders_str})
            """
            
            print(f"Executing: {insert_query}")
            print(f"Values: {insert_values}")
            
            await db.execute(text(insert_query), insert_values)
            await db.commit()
            
            print("✅ Admin user created successfully!")
            print(f"📧 Email: {admin_email}")
            print(f"🔑 Password: {admin_password}")
            print("⚠️  IMPORTANT: Change the password after first login!")
            
        except Exception as exc:
            print(f"❌ Error creating admin user: {exc}")
            import traceback
            print(f"Stack trace: {traceback.format_exc()}")
            await db.rollback()
        finally:
            await db.close()
            break


async def main():
    """Main function"""
    print("🚀 Starting robust admin creation...")
    await create_admin_robust()
    print("🎉 Process completed!")


if __name__ == "__main__":
    asyncio.run(main())
