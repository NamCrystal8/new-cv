#!/usr/bin/env python3
"""
Fresh PostgreSQL Deployment Verification Script
Verifies that the fresh deployment is working correctly
"""
import asyncio
import sys
from sqlalchemy import text
from core.database import get_async_db

async def verify_deployment():
    """Verify fresh PostgreSQL deployment"""
    print("🔍 Verifying Fresh PostgreSQL Deployment")
    print("=" * 45)
    
    success = True
    
    try:
        async for db in get_async_db():
            try:
                # Test 1: Database connection
                print("1️⃣ Testing database connection...")
                await db.execute(text("SELECT 1"))
                print("   ✅ Database connection successful")
                
                # Test 2: Check tables exist
                print("2️⃣ Checking database schema...")
                tables_result = await db.execute(text("""
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    ORDER BY table_name
                """))
                tables = [row[0] for row in tables_result.fetchall()]
                
                expected_tables = ['roles', 'subscription_plans', 'user', 'user_subscriptions', 'cvs']
                missing_tables = [t for t in expected_tables if t not in tables]
                
                if missing_tables:
                    print(f"   ❌ Missing tables: {missing_tables}")
                    success = False
                else:
                    print(f"   ✅ All required tables exist: {', '.join(tables)}")
                
                # Test 3: Check roles
                print("3️⃣ Checking roles...")
                roles_result = await db.execute(text("SELECT id, role_name FROM roles ORDER BY id"))
                roles = roles_result.fetchall()
                
                if len(roles) >= 2:
                    print(f"   ✅ Roles found: {', '.join([f'{r[1]} ({r[0]})' for r in roles])}")
                else:
                    print("   ❌ Insufficient roles found")
                    success = False
                
                # Test 4: Check subscription plans
                print("4️⃣ Checking subscription plans...")
                plans_result = await db.execute(text("SELECT id, name, price_monthly FROM subscription_plans ORDER BY id"))
                plans = plans_result.fetchall()
                
                if len(plans) >= 3:
                    print(f"   ✅ Plans found: {', '.join([f'{p[1]} (${p[2]})' for p in plans])}")
                else:
                    print("   ❌ Insufficient subscription plans found")
                    success = False
                
                # Test 5: Check admin user
                print("5️⃣ Checking admin user...")
                admin_result = await db.execute(text("""
                    SELECT u.email, u.is_superuser, u.is_active, u.is_verified, r.role_name
                    FROM "user" u
                    LEFT JOIN roles r ON u.role_id = r.id
                    WHERE u.email = 'admin@cvbuilder.com'
                """))
                admin = admin_result.fetchone()
                
                if admin:
                    if admin[1] and admin[2] and admin[3]:  # superuser, active, verified
                        print(f"   ✅ Admin user verified: {admin[0]} ({admin[4]})")
                    else:
                        print(f"   ⚠️ Admin user found but not properly configured")
                        print(f"      Superuser: {admin[1]}, Active: {admin[2]}, Verified: {admin[3]}")
                        success = False
                else:
                    print("   ❌ Admin user not found")
                    success = False
                
                # Test 6: Check foreign key relationships
                print("6️⃣ Checking foreign key relationships...")
                fk_result = await db.execute(text("""
                    SELECT COUNT(*) FROM information_schema.table_constraints 
                    WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
                """))
                fk_count = fk_result.scalar()
                
                if fk_count > 0:
                    print(f"   ✅ Foreign key constraints found: {fk_count}")
                else:
                    print("   ⚠️ No foreign key constraints found")
                
                # Summary
                print("\n📊 Deployment Verification Summary:")
                if success:
                    print("   🎉 All tests passed! Fresh deployment is successful.")
                    print("\n📋 Ready for use:")
                    print("   • Database: PostgreSQL (Fresh)")
                    print("   • Admin Login: admin@cvbuilder.com / admin123")
                    print("   • Health Check: /health endpoint")
                    print("   • API Documentation: /docs endpoint")
                else:
                    print("   ❌ Some tests failed. Check the issues above.")
                
                return success
                
            except Exception as e:
                print(f"❌ Error during verification: {e}")
                return False
            finally:
                await db.close()
                break
                
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        return False

async def quick_health_check():
    """Quick health check for monitoring"""
    try:
        async for db in get_async_db():
            await db.execute(text("SELECT 1"))
            await db.close()
            return True
    except:
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--quick":
        # Quick health check mode
        success = asyncio.run(quick_health_check())
        print("OK" if success else "FAIL")
        sys.exit(0 if success else 1)
    else:
        # Full verification mode
        success = asyncio.run(verify_deployment())
        sys.exit(0 if success else 1)
