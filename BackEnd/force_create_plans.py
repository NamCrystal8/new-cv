"""
Force create subscription plans - manual script
"""
import asyncio
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from core.database import get_async_db


async def force_create_subscription_plans():
    """Force create subscription plans using raw SQL"""
    print("🚀 Force creating subscription plans...")
    
    async for db in get_async_db():
        try:
            # First, check if table exists
            check_table = """
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_name = 'subscription_plans' AND table_schema = 'public';
            """
            table_result = await db.execute(text(check_table))
            
            if table_result.scalar() == 0:
                print("❌ subscription_plans table doesn't exist!")
                return
            
            # Clear existing plans
            print("🗑️ Clearing existing plans...")
            await db.execute(text("DELETE FROM subscription_plans"))
            
            # Create plans using raw SQL
            print("📋 Creating subscription plans...")
            
            create_plans = """
                INSERT INTO subscription_plans (
                    id, name, tier, price_monthly, price_yearly,
                    cv_analyses_per_month, job_analyses_per_month, cv_storage_limit,
                    advanced_analytics, priority_support, custom_templates, api_access,
                    is_active, created_at
                ) VALUES 
                (1, 'Free', 'free', 0.0, 0.0, 3, 1, 2, false, false, false, false, true, NOW()),
                (2, 'Premium', 'premium', 9.99, 99.99, 50, 20, 10, true, false, true, false, true, NOW()),
                (3, 'Pro', 'pro', 19.99, 199.99, NULL, NULL, NULL, true, true, true, true, true, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    tier = EXCLUDED.tier,
                    price_monthly = EXCLUDED.price_monthly,
                    price_yearly = EXCLUDED.price_yearly,
                    cv_analyses_per_month = EXCLUDED.cv_analyses_per_month,
                    job_analyses_per_month = EXCLUDED.job_analyses_per_month,
                    cv_storage_limit = EXCLUDED.cv_storage_limit,
                    advanced_analytics = EXCLUDED.advanced_analytics,
                    priority_support = EXCLUDED.priority_support,
                    custom_templates = EXCLUDED.custom_templates,
                    api_access = EXCLUDED.api_access,
                    is_active = EXCLUDED.is_active;
            """
            
            await db.execute(text(create_plans))
            await db.commit()
            
            # Verify creation
            verify_query = "SELECT id, name, price_monthly, cv_analyses_per_month FROM subscription_plans ORDER BY id"
            result = await db.execute(text(verify_query))
            plans = result.fetchall()
            
            if len(plans) >= 3:
                print("✅ Subscription plans created successfully:")
                for plan in plans:
                    analyses = plan[3] if plan[3] is not None else "Unlimited"
                    print(f"   • {plan[1]} (id={plan[0]}): ${plan[2]}/month, {analyses} CV analyses")
            else:
                print("❌ Failed to create subscription plans")
                
        except Exception as exc:
            print(f"❌ Error creating subscription plans: {exc}")
            import traceback
            print(f"Stack trace: {traceback.format_exc()}")
            await db.rollback()
        finally:
            await db.close()
            break


async def check_database_status():
    """Check current database status"""
    print("🔍 Checking database status...")
    
    async for db in get_async_db():
        try:
            # Check tables
            tables_query = """
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """
            tables_result = await db.execute(text(tables_query))
            tables = [row[0] for row in tables_result.fetchall()]
            print(f"📋 Tables: {', '.join(tables)}")
            
            # Check subscription plans
            try:
                plans_query = "SELECT COUNT(*) FROM subscription_plans"
                plans_result = await db.execute(text(plans_query))
                plan_count = plans_result.scalar()
                print(f"💳 Subscription plans count: {plan_count}")
                
                if plan_count > 0:
                    details_query = "SELECT id, name, price_monthly FROM subscription_plans ORDER BY id"
                    details_result = await db.execute(text(details_query))
                    plans = details_result.fetchall()
                    print("📋 Existing plans:")
                    for plan in plans:
                        print(f"   • {plan[1]} (id={plan[0]}): ${plan[2]}/month")
                        
            except Exception as e:
                print(f"⚠️ Error checking subscription plans: {e}")
            
            # Check admin user
            try:
                admin_query = 'SELECT email, is_superuser FROM "user" WHERE email = \'admin@cvbuilder.com\''
                admin_result = await db.execute(text(admin_query))
                admin = admin_result.fetchone()
                if admin:
                    print(f"👤 Admin user: {admin[0]} (superuser: {admin[1]})")
                else:
                    print("❌ Admin user not found")
            except Exception as e:
                print(f"⚠️ Error checking admin user: {e}")
                
        except Exception as exc:
            print(f"❌ Error checking database: {exc}")
        finally:
            await db.close()
            break


async def main():
    """Main function"""
    print("🚀 Starting subscription plans force creation...")
    
    await check_database_status()
    await force_create_subscription_plans()
    
    print("\n🔍 Final verification...")
    await check_database_status()
    
    print("\n🎉 Force creation completed!")


if __name__ == "__main__":
    asyncio.run(main())
