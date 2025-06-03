"""
Script to add role_id column to user table
"""
import asyncio
import sys
import os
import traceback

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from core.database import get_async_db


async def add_role_id_to_user():
    """Add role_id column to user table"""
    print("Adding role_id column to user table...")
    
    async for db in get_async_db():
        try:
            # Check if the column already exists
            print("Checking if role_id column exists...")
            check_query = """
                SELECT COUNT(*) AS column_exists
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                AND table_name = 'user'
                AND column_name = 'role_id';
            """
            result = await db.execute(text(check_query))
            column_exists = result.scalar()
            
            if column_exists > 0:
                print("ℹ️ role_id column already exists in user table")
                return
            
            # Add role_id column with default=2 (User role)
            print("Adding role_id column...")
            add_column_query = """
                ALTER TABLE `user`
                ADD COLUMN role_id INT NOT NULL DEFAULT 2;
            """
            await db.execute(text(add_column_query))
            
            # Create foreign key constraint
            print("Adding foreign key constraint...")
            add_fk_query = """
                ALTER TABLE `user`
                ADD CONSTRAINT fk_user_role_id_roles
                FOREIGN KEY (role_id) REFERENCES roles (id);
            """
            await db.execute(text(add_fk_query))
            
            await db.commit()
            print("✅ Successfully added role_id column to user table")
                
        except Exception as exc:
            print(f"❌ Error: {exc}")
            print(f"Stack trace: {traceback.format_exc()}")
            await db.rollback()
        finally:
            await db.close()
            break


if __name__ == "__main__":
    print('here')
    asyncio.run(add_role_id_to_user())