"""
Check database structure to find outdated columns/tables
"""
import asyncio
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from core.database import get_async_db


async def check_db_structure():
    """Check database structure"""
    print("Checking database structure...")
    
    async for db in get_async_db():
        try:
            # Check if the user table has a role column
            print("\n=== User Table Structure ===")
            result = await db.execute(text("DESCRIBE user"))
            columns = result.fetchall()
            
            role_column_exists = False
            role_id_column_exists = False
            
            for column in columns:
                print(f"{column[0]}: {column[1]}")
                if column[0] == "role":
                    role_column_exists = True
                if column[0] == "role_id":
                    role_id_column_exists = True
            
            # Check if usr_roles table exists
            print("\n=== Checking for usr_roles table ===")
            result = await db.execute(text(
                "SELECT COUNT(*) FROM information_schema.tables "
                "WHERE table_schema = DATABASE() AND table_name = 'usr_roles'"
            ))
            usr_roles_exists = result.scalar() > 0
            
            print(f"usr_roles table exists: {usr_roles_exists}")
            
            # Summary
            print("\n=== Summary ===")
            print(f"role column in user table: {role_column_exists}")
            print(f"role_id column in user table: {role_id_column_exists}")
            print(f"usr_roles table exists: {usr_roles_exists}")
            
        except Exception as exc:
            print(f"Error: {exc}")
        finally:
            await db.close()
            break


if __name__ == "__main__":
    asyncio.run(check_db_structure())
