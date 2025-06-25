"""
Fix database sequence issues for subscription plans
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from core.config import settings

async def fix_subscription_plans_sequence():
    """Fix the subscription_plans sequence to prevent ID conflicts"""
    
    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=True
    )
    
    # Create session
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        try:
            # Get the maximum ID from subscription_plans table
            result = await session.execute(
                "SELECT COALESCE(MAX(id), 0) FROM subscription_plans"
            )
            max_id = result.scalar()
            
            # Reset the sequence to start from max_id + 1
            next_id = max_id + 1
            await session.execute(
                f"ALTER SEQUENCE subscription_plans_id_seq RESTART WITH {next_id}"
            )
            
            await session.commit()
            print(f"✅ Fixed subscription_plans sequence. Next ID will be: {next_id}")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error fixing sequence: {e}")
            raise
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_subscription_plans_sequence())
