#!/usr/bin/env python3
"""
Initialize default subscription plans in the database.
This script should be run after database migration to set up the default plans.
"""
import asyncio
import sys
import os
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import get_async_db
from models.subscription import SubscriptionPlan, SubscriptionTier


async def create_default_subscription_plans():
    """Create default subscription plans if they don't exist"""
    print("🔄 Initializing default subscription plans...")
    
    async for db in get_async_db():
        try:
            # Check if plans already exist
            result = await db.execute(select(func.count(SubscriptionPlan.id)))
            plan_count = result.scalar()
            
            if plan_count > 0:
                print(f"ℹ️  Found {plan_count} existing subscription plans. Skipping initialization.")
                return
            
            print("📝 Creating default subscription plans...")
            
            # Define default plans
            plans = [
                SubscriptionPlan(
                    name="Free",
                    tier=SubscriptionTier.FREE,
                    price_monthly=0.0,
                    price_yearly=0.0,
                    cv_analyses_per_month=3,
                    job_analyses_per_month=1,
                    cv_storage_limit=2,
                    advanced_analytics=False,
                    priority_support=False,
                    custom_templates=False,
                    api_access=False,
                    is_active=True
                ),
                SubscriptionPlan(
                    name="Premium",
                    tier=SubscriptionTier.PREMIUM,
                    price_monthly=9.99,
                    price_yearly=99.99,
                    cv_analyses_per_month=50,
                    job_analyses_per_month=20,
                    cv_storage_limit=10,
                    advanced_analytics=True,
                    priority_support=False,
                    custom_templates=True,
                    api_access=False,
                    is_active=True
                ),
                SubscriptionPlan(
                    name="Pro",
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
                print(f"  ✅ Added {plan.name} plan (${plan.price_monthly}/month)")
            
            await db.commit()
            print("🎉 Default subscription plans created successfully!")
            
            # Verify creation
            result = await db.execute(select(SubscriptionPlan).order_by(SubscriptionPlan.price_monthly))
            created_plans = result.scalars().all()
            
            print("\n📋 Created Plans Summary:")
            for plan in created_plans:
                analyses_limit = plan.cv_analyses_per_month if plan.cv_analyses_per_month else "Unlimited"
                print(f"  • {plan.name} (ID: {plan.id}) - {analyses_limit} CV analyses/month")
            
        except Exception as e:
            print(f"❌ Error creating subscription plans: {e}")
            await db.rollback()
            raise
        finally:
            await db.close()
            break


async def main():
    """Main function"""
    print("🚀 Starting subscription plans initialization...")
    try:
        await create_default_subscription_plans()
        print("✅ Subscription plans initialization completed successfully!")
    except Exception as e:
        print(f"❌ Failed to initialize subscription plans: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
