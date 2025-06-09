"""
Script to inspect the current database schema
"""
import asyncio
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from core.database import get_async_db


async def inspect_database():
    """Inspect the current database schema"""
    print("🔍 Inspecting database schema...")
    
    async for db in get_async_db():
        try:
            # Get all tables
            print("\n📋 Tables in database:")
            tables_query = """
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """
            tables_result = await db.execute(text(tables_query))
            tables = tables_result.fetchall()
            
            for table in tables:
                print(f"  - {table[0]}")
            
            # Get user table schema
            print("\n👤 User table schema:")
            user_schema_query = """
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'user' AND table_schema = 'public'
                ORDER BY ordinal_position;
            """
            user_schema_result = await db.execute(text(user_schema_query))
            user_columns = user_schema_result.fetchall()
            
            for col in user_columns:
                nullable = "NULL" if col[2] == "YES" else "NOT NULL"
                default = f" DEFAULT {col[3]}" if col[3] else ""
                print(f"  - {col[0]}: {col[1]} {nullable}{default}")
            
            # Check if there are any existing users
            print("\n👥 Existing users:")
            users_query = """
                SELECT email, is_active, is_superuser, is_verified
                FROM "user"
                ORDER BY email;
            """
            users_result = await db.execute(text(users_query))
            users = users_result.fetchall()
            
            if users:
                for user in users:
                    status = []
                    if user[1]: status.append("active")
                    if user[2]: status.append("superuser")
                    if user[3]: status.append("verified")
                    status_str = ", ".join(status) if status else "inactive"
                    print(f"  - {user[0]} ({status_str})")
            else:
                print("  No users found")
                
        except Exception as exc:
            print(f"❌ Error inspecting database: {exc}")
        finally:
            await db.close()
            break


if __name__ == "__main__":
    asyncio.run(inspect_database())
