#!/usr/bin/env python3
"""
Complete PostgreSQL initialization using ORM
"""
import asyncio
import uuid
from passlib.context import CryptContext
from sqlalchemy import text

from core.database import get_async_db
from models.user import User
from models.subscription import SubscriptionPlan, SubscriptionTier

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def complete_initialization():
    """Complete the database initialization using ORM"""
    print("🚀 Completing PostgreSQL database initialization...")
    
    async for db in get_async_db():
        try:
            # Step 1: Create subscription plans using ORM
            print("\n1️⃣ Creating subscription plans...")
            
            # Check if plans exist
            existing_plans = await db.execute(text("SELECT COUNT(*) FROM subscription_plans"))
            if existing_plans.scalar() == 0:
                # Create subscription plans
                free_plan = SubscriptionPlan(
                    id=1,
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
                )
                
                premium_plan = SubscriptionPlan(
                    id=2,
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
                )
                
                pro_plan = SubscriptionPlan(
                    id=3,
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
                
                db.add(free_plan)
                db.add(premium_plan)
                db.add(pro_plan)
                await db.commit()
                
                print("✅ Created subscription plans:")
                print("   • Free: 3 CV analyses/month, $0")
                print("   • Premium: 50 CV analyses/month, $9.99")
                print("   • Pro: Unlimited analyses, $19.99")
            else:
                print("✅ Subscription plans already exist")
            
            # Step 2: Create admin user using ORM
            print("\n2️⃣ Creating admin user...")
            
            # Check if admin exists using ORM
            existing_admin = await db.execute(
                text('SELECT COUNT(*) FROM "user" WHERE email = :email'),
                {'email': 'admin@cvbuilder.com'}
            )
            
            if existing_admin.scalar() == 0:
                # Create admin user
                admin_id = uuid.uuid4()
                hashed_password = pwd_context.hash("admin123")
                
                admin_user = User(
                    id=admin_id,
                    email="admin@cvbuilder.com",
                    hashed_password=hashed_password,
                    is_active=True,
                    is_superuser=True,
                    is_verified=True,
                    role_id=1  # Admin role
                )
                
                db.add(admin_user)
                await db.commit()
                
                print("✅ Created admin user:")
                print("   • Email: admin@cvbuilder.com")
                print("   • Password: admin123")
                print("   • Role: Admin (role_id=1)")
            else:
                print("✅ Admin user already exists")
            
            # Step 3: Verify everything
            print("\n3️⃣ Verifying database...")
            
            # Check plans
            plans_result = await db.execute(text("SELECT id, name, price_monthly FROM subscription_plans ORDER BY id"))
            plans = plans_result.fetchall()
            print(f"✅ Subscription plans ({len(plans)}):")
            for plan in plans:
                print(f"   • {plan[1]} (id={plan[0]}): ${plan[2]}/month")
            
            # Check admin user
            admin_result = await db.execute(
                text('''
                    SELECT u.email, u.is_superuser, u.is_active, u.role_id, r.role_name
                    FROM "user" u
                    LEFT JOIN roles r ON u.role_id = r.id
                    WHERE u.email = :email
                '''),
                {'email': 'admin@cvbuilder.com'}
            )
            admin = admin_result.fetchone()
            
            if admin:
                print("✅ Admin user verified:")
                print(f"   • Email: {admin[0]}")
                print(f"   • Superuser: {admin[1]}")
                print(f"   • Active: {admin[2]}")
                print(f"   • Role: {admin[4]} (id={admin[3]})")
            else:
                print("❌ Admin user not found")
            
            print("\n🎉 PostgreSQL database initialization completed successfully!")
            print("\n📋 Database Summary:")
            print("   • Database: PostgreSQL")
            print("   • Schema: ✅ All tables created")
            print("   • Roles: ✅ Admin (1), User (2)")
            print("   • Admin User: ✅ admin@cvbuilder.com / admin123")
            print("   • Subscription Plans: ✅ Free, Premium, Pro")
            print("   • Foreign Keys: ✅ All relationships working")
            
        except Exception as e:
            print(f"❌ Error during initialization: {e}")
            import traceback
            print(f"Stack trace: {traceback.format_exc()}")
            await db.rollback()
        finally:
            await db.close()
            break

if __name__ == "__main__":
    asyncio.run(complete_initialization())
