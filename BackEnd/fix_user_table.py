"""
Script to fix user table by adding role_id column for PostgreSQL
"""
import asyncio
import sys
import os
import traceback

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from core.database import get_async_db


async def fix_user_table():
    """Add role_id column to user table for PostgreSQL"""
    print("🔧 Fixing user table schema...")
    
    async for db in get_async_db():
        try:
            # Check if the column already exists (PostgreSQL syntax)
            print("Checking if role_id column exists...")
            check_query = """
                SELECT COUNT(*) AS column_exists
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'user'
                AND column_name = 'role_id';
            """
            result = await db.execute(text(check_query))
            column_exists = result.scalar()
            
            if column_exists > 0:
                print("ℹ️ role_id column already exists in user table")
                return
            
            # Check if roles table exists
            print("Checking if roles table exists...")
            roles_check = """
                SELECT COUNT(*) AS table_exists
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'roles';
            """
            result = await db.execute(text(roles_check))
            roles_exists = result.scalar()
            
            if roles_exists == 0:
                print("Creating roles table...")
                create_roles_table = """
                    CREATE TABLE roles (
                        id SERIAL PRIMARY KEY,
                        role_name VARCHAR(50) UNIQUE NOT NULL
                    );
                """
                await db.execute(text(create_roles_table))
                
                # Insert default roles
                print("Inserting default roles...")
                insert_roles = """
                    INSERT INTO roles (id, role_name) VALUES 
                    (1, 'Admin'),
                    (2, 'User')
                    ON CONFLICT (id) DO NOTHING;
                """
                await db.execute(text(insert_roles))
            
            # Add role_id column with default=2 (User role)
            print("Adding role_id column...")
            add_column_query = """
                ALTER TABLE "user"
                ADD COLUMN role_id INTEGER NOT NULL DEFAULT 2;
            """
            await db.execute(text(add_column_query))
            
            # Create foreign key constraint
            print("Adding foreign key constraint...")
            add_fk_query = """
                ALTER TABLE "user"
                ADD CONSTRAINT fk_user_role_id_roles
                FOREIGN KEY (role_id) REFERENCES roles (id);
            """
            await db.execute(text(add_fk_query))
            
            await db.commit()
            print("✅ Successfully fixed user table schema")
                
        except Exception as exc:
            print(f"❌ Error: {exc}")
            print(f"Stack trace: {traceback.format_exc()}")
            await db.rollback()
        finally:
            await db.close()
            break


if __name__ == "__main__":
    print('🚀 Starting user table fix...')
    asyncio.run(fix_user_table())
