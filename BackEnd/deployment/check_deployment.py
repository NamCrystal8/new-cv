#!/usr/bin/env python3
"""
Quick deployment check script
Run this after deployment to verify everything is working
"""
import asyncio
import os
from sqlalchemy import text
from core.database import get_async_db

async def check_deployment():
    """Check if deployment is working correctly"""
    print("🔍 Checking deployment status...")
    
    try:
        async for db in get_async_db():
            # Test database connection
            result = await db.execute(text("SELECT 1 as test"))
            if result.scalar() == 1:
                print("✅ Database connection: OK")
            else:
                print("❌ Database connection: FAILED")
                return False
            
            # Check tables exist
            tables_result = await db.execute(text("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """))
            tables = [row[0] for row in tables_result.fetchall()]
            
            if len(tables) >= 7:  # Expected number of tables
                print(f"✅ Database tables: {len(tables)} tables found")
                print(f"   Tables: {', '.join(tables)}")
            else:
                print(f"⚠️ Database tables: Only {len(tables)} tables found")
                print(f"   Tables: {', '.join(tables)}")
            
            # Check roles
            roles_result = await db.execute(text("SELECT COUNT(*) FROM roles"))
            roles_count = roles_result.scalar()
            print(f"✅ Roles: {roles_count} roles found")
            
            # Check subscription plans
            plans_result = await db.execute(text("SELECT COUNT(*) FROM subscription_plans"))
            plans_count = plans_result.scalar()
            print(f"✅ Subscription plans: {plans_count} plans found")
            
            # Check admin user
            admin_result = await db.execute(
                text('SELECT COUNT(*) FROM "user" WHERE email = :email'),
                {'email': 'admin@cvbuilder.com'}
            )
            admin_exists = admin_result.scalar() > 0
            
            if admin_exists:
                print("✅ Admin user: EXISTS")
            else:
                print("⚠️ Admin user: NOT FOUND")
                print("   Create admin user by calling: POST /setup/create-admin")
            
            # Check environment variables
            print("\n🔧 Environment check:")
            required_vars = [
                'DATABASE_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY',
                'CLOUDINARY_API_SECRET', 'GOOGLE_GEMINI_API_KEY', 'JWT_SECRET'
            ]
            
            for var in required_vars:
                value = os.getenv(var)
                if value:
                    print(f"   ✅ {var}: SET")
                else:
                    print(f"   ❌ {var}: NOT SET")
            
            print("\n🎉 Deployment check completed!")
            
            if admin_exists and len(tables) >= 7:
                print("✅ Deployment is FULLY READY!")
                return True
            else:
                print("⚠️ Deployment is PARTIALLY READY")
                print("   - Database and schema: OK")
                print("   - Admin user: Create via /setup/create-admin")
                return True
                
    except Exception as e:
        print(f"❌ Deployment check failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(check_deployment())
    exit(0 if success else 1)
