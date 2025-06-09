"""
Comprehensive test script to verify all database fixes
"""
import asyncio
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text, select
from core.database import get_async_db
from models.user import User
from models.role import Role
from models.subscription import SubscriptionPlan, UserSubscription


async def test_database_schema():
    """Test database schema and relationships"""
    print("🔍 Testing Database Schema...")
    
    async for db in get_async_db():
        try:
            # Test 1: Check if all tables exist
            print("\n1️⃣ Checking table existence...")
            tables_query = """
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """
            tables_result = await db.execute(text(tables_query))
            tables = [row[0] for row in tables_result.fetchall()]
            
            expected_tables = ['user', 'roles', 'subscription_plans', 'user_subscriptions', 'cvs']
            missing_tables = [table for table in expected_tables if table not in tables]
            
            if missing_tables:
                print(f"❌ Missing tables: {missing_tables}")
            else:
                print("✅ All expected tables exist")
            
            print(f"Found tables: {', '.join(tables)}")
            
            # Test 2: Check user table schema
            print("\n2️⃣ Checking user table schema...")
            user_schema_query = """
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'user' AND table_schema = 'public'
                ORDER BY ordinal_position;
            """
            user_schema_result = await db.execute(text(user_schema_query))
            user_columns = {row[0]: row for row in user_schema_result.fetchall()}
            
            required_columns = ['id', 'email', 'hashed_password', 'is_active', 'is_superuser', 'is_verified', 'role_id']
            missing_columns = [col for col in required_columns if col not in user_columns]
            
            if missing_columns:
                print(f"❌ Missing user columns: {missing_columns}")
            else:
                print("✅ User table has all required columns")
            
            # Test 3: Check foreign key relationships
            print("\n3️⃣ Checking foreign key relationships...")
            fk_query = """
                SELECT 
                    tc.table_name, 
                    kcu.column_name, 
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name 
                FROM 
                    information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                      AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_schema = 'public';
            """
            fk_result = await db.execute(text(fk_query))
            foreign_keys = fk_result.fetchall()
            
            print("Foreign key relationships:")
            for fk in foreign_keys:
                print(f"  • {fk[0]}.{fk[1]} → {fk[2]}.{fk[3]}")
            
            # Test 4: Test ORM relationships
            print("\n4️⃣ Testing ORM relationships...")
            
            # Test role query
            try:
                roles = await db.execute(select(Role))
                role_count = len(roles.fetchall())
                print(f"✅ Roles table accessible via ORM ({role_count} roles)")
            except Exception as e:
                print(f"❌ Role ORM error: {e}")
            
            # Test subscription plans query
            try:
                plans = await db.execute(select(SubscriptionPlan))
                plan_count = len(plans.fetchall())
                print(f"✅ Subscription plans accessible via ORM ({plan_count} plans)")
            except Exception as e:
                print(f"❌ Subscription plans ORM error: {e}")
            
            # Test user query with role relationship
            try:
                users = await db.execute(select(User).limit(1))
                user = users.scalar_one_or_none()
                if user:
                    print(f"✅ User ORM accessible (found user: {user.email})")
                    if hasattr(user, 'role_id'):
                        print(f"✅ User has role_id: {user.role_id}")
                    else:
                        print("❌ User missing role_id attribute")
                else:
                    print("ℹ️ No users found in database")
            except Exception as e:
                print(f"❌ User ORM error: {e}")
                
        except Exception as exc:
            print(f"❌ Schema test error: {exc}")
            import traceback
            print(f"Stack trace: {traceback.format_exc()}")
        finally:
            await db.close()
            break


async def test_admin_user():
    """Test admin user creation and access"""
    print("\n👤 Testing Admin User...")
    
    async for db in get_async_db():
        try:
            # Check if admin user exists
            admin_query = select(User).where(User.email == "admin@cvbuilder.com")
            admin_result = await db.execute(admin_query)
            admin_user = admin_result.scalar_one_or_none()
            
            if admin_user:
                print("✅ Admin user exists")
                print(f"  • Email: {admin_user.email}")
                print(f"  • Is Active: {admin_user.is_active}")
                print(f"  • Is Superuser: {admin_user.is_superuser}")
                print(f"  • Is Verified: {admin_user.is_verified}")
                
                if hasattr(admin_user, 'role_id'):
                    print(f"  • Role ID: {admin_user.role_id}")
                    
                    # Check role relationship
                    if admin_user.role_id == 1:
                        print("✅ Admin user has correct role (Admin)")
                    else:
                        print(f"⚠️ Admin user has unexpected role_id: {admin_user.role_id}")
                else:
                    print("❌ Admin user missing role_id")
            else:
                print("❌ Admin user not found")
                
        except Exception as exc:
            print(f"❌ Admin test error: {exc}")
        finally:
            await db.close()
            break


async def test_subscription_plans():
    """Test subscription plans"""
    print("\n💳 Testing Subscription Plans...")
    
    async for db in get_async_db():
        try:
            # Get all subscription plans
            plans_query = select(SubscriptionPlan).order_by(SubscriptionPlan.id)
            plans_result = await db.execute(plans_query)
            plans = plans_result.fetchall()
            
            if plans:
                print(f"✅ Found {len(plans)} subscription plans:")
                for plan_row in plans:
                    plan = plan_row[0]
                    print(f"  • {plan.name} ({plan.tier}): ${plan.price_monthly}/month")
                    print(f"    - CV Analyses: {plan.cv_analyses_per_month or 'Unlimited'}")
                    print(f"    - Job Analyses: {plan.job_analyses_per_month or 'Unlimited'}")
                    print(f"    - Advanced Analytics: {plan.advanced_analytics}")
                
                # Check for expected plans
                plan_names = [plan_row[0].name for plan_row in plans]
                expected_plans = ['Free', 'Premium', 'Pro']
                missing_plans = [plan for plan in expected_plans if plan not in plan_names]
                
                if missing_plans:
                    print(f"⚠️ Missing expected plans: {missing_plans}")
                else:
                    print("✅ All expected plans exist")
            else:
                print("❌ No subscription plans found")
                
        except Exception as exc:
            print(f"❌ Subscription plans test error: {exc}")
        finally:
            await db.close()
            break


async def test_data_integrity():
    """Test data integrity and constraints"""
    print("\n🔒 Testing Data Integrity...")
    
    async for db in get_async_db():
        try:
            # Test role constraints
            print("Checking role constraints...")
            role_check = """
                SELECT COUNT(*) as role_count 
                FROM roles 
                WHERE role_name IN ('Admin', 'User');
            """
            role_result = await db.execute(text(role_check))
            role_count = role_result.scalar()
            
            if role_count >= 2:
                print("✅ Required roles (Admin, User) exist")
            else:
                print(f"⚠️ Missing required roles (found {role_count})")
            
            # Test user-role relationship integrity
            print("Checking user-role relationship integrity...")
            user_role_check = """
                SELECT COUNT(*) as invalid_users
                FROM "user" u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.role_id IS NOT NULL AND r.id IS NULL;
            """
            try:
                invalid_result = await db.execute(text(user_role_check))
                invalid_count = invalid_result.scalar()
                
                if invalid_count == 0:
                    print("✅ All users have valid role references")
                else:
                    print(f"❌ Found {invalid_count} users with invalid role references")
            except Exception as e:
                print(f"⚠️ Could not check user-role integrity: {e}")
            
        except Exception as exc:
            print(f"❌ Data integrity test error: {exc}")
        finally:
            await db.close()
            break


async def main():
    """Run all tests"""
    print("🚀 Starting Comprehensive Database Tests...")
    print("=" * 50)
    
    await test_database_schema()
    await test_admin_user()
    await test_subscription_plans()
    await test_data_integrity()
    
    print("\n" + "=" * 50)
    print("🎉 Database tests completed!")


if __name__ == "__main__":
    asyncio.run(main())
