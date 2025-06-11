#!/usr/bin/env python3
"""
Check PostgreSQL schema and table structure
"""
import asyncio
from sqlalchemy import text
from core.database import get_async_db

async def check_schema():
    """Check the actual PostgreSQL schema"""
    print("🔍 Checking PostgreSQL schema...")
    
    async for db in get_async_db():
        try:
            # Check all tables
            tables_query = """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """
            tables_result = await db.execute(text(tables_query))
            tables = [row[0] for row in tables_result.fetchall()]
            
            print(f"📋 Tables found: {', '.join(tables)}")
            
            # Check user table columns
            user_columns_query = """
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'user' AND table_schema = 'public'
                ORDER BY ordinal_position;
            """
            user_columns_result = await db.execute(text(user_columns_query))
            user_columns = user_columns_result.fetchall()
            
            print("\n👤 User table columns:")
            for col in user_columns:
                print(f"   • {col[0]} ({col[1]}) - nullable: {col[2]}")
            
            # Check roles table
            roles_query = "SELECT id, role_name FROM roles ORDER BY id"
            roles_result = await db.execute(text(roles_query))
            roles = roles_result.fetchall()
            
            print(f"\n🔐 Roles in database:")
            for role in roles:
                print(f"   • {role[1]} (id={role[0]})")
            
            # Check subscription plans
            plans_query = "SELECT id, name, price_monthly FROM subscription_plans ORDER BY id"
            plans_result = await db.execute(text(plans_query))
            plans = plans_result.fetchall()
            
            print(f"\n💳 Subscription plans:")
            for plan in plans:
                print(f"   • {plan[1]} (id={plan[0]}): ${plan[2]}/month")
            
            # Try to check if any users exist
            try:
                user_count_query = 'SELECT COUNT(*) FROM "user"'
                user_count_result = await db.execute(text(user_count_query))
                user_count = user_count_result.scalar()
                print(f"\n👥 Users in database: {user_count}")
                
                if user_count > 0:
                    users_query = 'SELECT email, is_superuser, is_active FROM "user" LIMIT 5'
                    users_result = await db.execute(text(users_query))
                    users = users_result.fetchall()
                    print("   Users:")
                    for user in users:
                        print(f"   • {user[0]} (superuser: {user[1]}, active: {user[2]})")
            except Exception as e:
                print(f"   ⚠️ Could not check users: {e}")
            
        except Exception as e:
            print(f"❌ Error checking schema: {e}")
        finally:
            await db.close()
            break

if __name__ == "__main__":
    asyncio.run(check_schema())
