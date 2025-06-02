"""
Seed subscription plans into the database
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_async_db, engine
from models import User, CV  # Import main models first
from subscription_models import SubscriptionPlan, SubscriptionTier


async def seed_subscription_plans():
    """Create default subscription plans"""
    
    async with AsyncSession(engine) as db:
        try:
            # Check if plans already exist
            result = await db.execute(select(SubscriptionPlan))
            existing_plans = result.scalars().all()
            
            if existing_plans:
                print("Subscription plans already exist. Skipping seed.")
                return
            
            # Create subscription plans
            plans = [
                SubscriptionPlan(
                    name="FREE",
                    tier=SubscriptionTier.FREE,
                    price_monthly=0.0,
                    price_yearly=0.0,
                    cv_analyses_per_month=5,
                    job_analyses_per_month=3,
                    cv_storage_limit=3,
                    advanced_analytics=False,
                    priority_support=False,
                    custom_templates=False,
                    api_access=False,
                    is_active=True
                ),
                SubscriptionPlan(
                    name="PREMIUM",
                    tier=SubscriptionTier.PREMIUM,
                    price_monthly=9.99,
                    price_yearly=99.99,
                    cv_analyses_per_month=50,
                    job_analyses_per_month=30,
                    cv_storage_limit=20,
                    advanced_analytics=True,
                    priority_support=True,
                    custom_templates=False,
                    api_access=False,
                    is_active=True
                ),
                SubscriptionPlan(
                    name="PRO",
                    tier=SubscriptionTier.PRO,
                    price_monthly=19.99,
                    price_yearly=199.99,
                    cv_analyses_per_month=None,  # Unlimited
                    job_analyses_per_month=None,  # Unlimited
                    cv_storage_limit=None,  # Unlimited
                    advanced_analytics=True,
                    priority_support=True,
                    custom_templates=True,
                    api_access=True,
                    is_active=True
                )
            ]
            
            # Add plans to database
            for plan in plans:
                db.add(plan)
            
            await db.commit()
            print("Successfully seeded subscription plans:")
            for plan in plans:
                print(f"- {plan.name}: ${plan.price_monthly}/month, ${plan.price_yearly}/year")
                
        except Exception as e:
            await db.rollback()
            print(f"Error seeding subscription plans: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(seed_subscription_plans())
