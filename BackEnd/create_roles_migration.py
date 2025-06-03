"""
Create roles table migration and seed with Admin and User roles
"""
import asyncio
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from core.database import get_async_db, engine, Base
from models.role import Role


async def create_roles_table_and_seed():
    """Create the roles table and seed with initial data"""
    print("Creating roles table...")
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("Tables created successfully!")
    
    # Seed roles
    print("Seeding roles...")
    
    async for db in get_async_db():
        try:
            # Check if roles already exist
            result = await db.execute(select(Role))
            existing_roles = result.fetchall()
            
            if len(existing_roles) == 0:
                # Create Admin role
                admin_role = Role(id=1, role_name="Admin")
                user_role = Role(id=2, role_name="User")
                
                db.add(admin_role)
                db.add(user_role)
                
                await db.commit()
                print("✅ Roles seeded successfully!")
                print("- Admin role (id=1)")
                print("- User role (id=2)")
            else:
                print(f"ℹ️  Roles table already has {len(existing_roles)} roles. Skipping seed.")
                
        except Exception as e:
            print(f"❌ Error seeding roles: {e}")
            await db.rollback()
        finally:
            await db.close()
            break


if __name__ == "__main__":
    asyncio.run(create_roles_table_and_seed())