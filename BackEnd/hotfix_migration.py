"""
Hotfix migration script to resolve immediate deployment issues
"""
import asyncio
import sys
import os
import uuid
from passlib.context import CryptContext

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from core.database import get_async_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def hotfix_migration():
    """Quick hotfix for deployment issues"""
    print("🚀 Starting hotfix migration...")
    
    async for db in get_async_db():
        try:
            # Step 1: Ensure roles exist
            print("1️⃣ Ensuring roles exist...")
            ensure_roles = """
                INSERT INTO roles (id, role_name) VALUES 
                (1, 'Admin'),
                (2, 'User')
                ON CONFLICT (id) DO NOTHING;
            """
            await db.execute(text(ensure_roles))
            print("✅ Roles ensured")
            
            # Step 2: Check if role_id column exists
            print("2️⃣ Checking role_id column...")
            check_column = """
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'user' AND column_name = 'role_id' AND table_schema = 'public';
            """
            column_result = await db.execute(text(check_column))
            has_role_id = column_result.fetchone() is not None
            
            if not has_role_id:
                print("Adding role_id column...")
                add_column = """
                    ALTER TABLE "user" 
                    ADD COLUMN role_id INTEGER;
                """
                await db.execute(text(add_column))
                
                # Update existing users
                update_users = """
                    UPDATE "user" 
                    SET role_id = CASE 
                        WHEN role = 'Admin' THEN 1 
                        ELSE 2 
                    END;
                """
                await db.execute(text(update_users))
                print("✅ role_id column added and populated")
            else:
                print("✅ role_id column already exists")
            
            # Step 3: Add foreign key constraint if it doesn't exist
            print("3️⃣ Adding foreign key constraint...")
            try:
                add_fk = """
                    ALTER TABLE "user" 
                    ADD CONSTRAINT fk_user_role_id 
                    FOREIGN KEY (role_id) REFERENCES roles(id);
                """
                await db.execute(text(add_fk))
                print("✅ Foreign key constraint added")
            except Exception as e:
                if "already exists" in str(e) or "duplicate" in str(e):
                    print("✅ Foreign key constraint already exists")
                else:
                    print(f"⚠️ Foreign key constraint warning: {e}")
            
            # Step 4: Create admin user if not exists
            print("4️⃣ Creating admin user...")
            admin_email = "admin@cvbuilder.com"
            
            check_admin = 'SELECT email FROM "user" WHERE email = :email'
            existing = await db.execute(text(check_admin), {"email": admin_email})
            
            if not existing.fetchone():
                admin_id = str(uuid.uuid4())
                hashed_password = pwd_context.hash("admin123")
                
                insert_admin = """
                    INSERT INTO "user" (id, email, hashed_password, is_active, is_superuser, is_verified, role_id)
                    VALUES (:id, :email, :password, :active, :superuser, :verified, :role_id)
                """
                values = {
                    "id": admin_id,
                    "email": admin_email,
                    "password": hashed_password,
                    "active": True,
                    "superuser": True,
                    "verified": True,
                    "role_id": 1
                }
                
                await db.execute(text(insert_admin), values)
                print(f"✅ Created admin user: {admin_email}")
            else:
                print(f"✅ Admin user already exists: {admin_email}")
            
            # Step 5: Ensure subscription plans exist
            print("5️⃣ Ensuring subscription plans exist...")
            check_plans = "SELECT COUNT(*) FROM subscription_plans"
            try:
                result = await db.execute(text(check_plans))
                plan_count = result.scalar()
                
                if plan_count == 0:
                    print("Creating subscription plans...")
                    plans = [
                        {
                            'id': 1,
                            'name': 'Free',
                            'tier': 'FREE',
                            'price_monthly': 0.0,
                            'price_yearly': 0.0,
                            'cv_analyses_per_month': 3,
                            'job_analyses_per_month': 1,
                            'cv_storage_limit': 2,
                            'advanced_analytics': False,
                            'priority_support': False,
                            'custom_templates': False,
                            'api_access': False
                        },
                        {
                            'id': 2,
                            'name': 'Premium',
                            'tier': 'PREMIUM',
                            'price_monthly': 9.99,
                            'price_yearly': 99.99,
                            'cv_analyses_per_month': 50,
                            'job_analyses_per_month': 20,
                            'cv_storage_limit': 10,
                            'advanced_analytics': True,
                            'priority_support': False,
                            'custom_templates': True,
                            'api_access': False
                        },
                        {
                            'id': 3,
                            'name': 'Pro',
                            'tier': 'PRO',
                            'price_monthly': 19.99,
                            'price_yearly': 199.99,
                            'cv_analyses_per_month': None,
                            'job_analyses_per_month': None,
                            'cv_storage_limit': None,
                            'advanced_analytics': True,
                            'priority_support': True,
                            'custom_templates': True,
                            'api_access': True
                        }
                    ]
                    
                    for plan in plans:
                        insert_plan = """
                            INSERT INTO subscription_plans (
                                id, name, tier, price_monthly, price_yearly,
                                cv_analyses_per_month, job_analyses_per_month, cv_storage_limit,
                                advanced_analytics, priority_support, custom_templates, api_access,
                                is_active
                            ) VALUES (:id, :name, :tier, :price_monthly, :price_yearly, 
                                     :cv_analyses, :job_analyses, :cv_storage,
                                     :advanced, :priority, :templates, :api, :active)
                            ON CONFLICT (id) DO NOTHING
                        """
                        await db.execute(text(insert_plan), {
                            "id": plan['id'],
                            "name": plan['name'],
                            "tier": plan['tier'],
                            "price_monthly": plan['price_monthly'],
                            "price_yearly": plan['price_yearly'],
                            "cv_analyses": plan['cv_analyses_per_month'],
                            "job_analyses": plan['job_analyses_per_month'],
                            "cv_storage": plan['cv_storage_limit'],
                            "advanced": plan['advanced_analytics'],
                            "priority": plan['priority_support'],
                            "templates": plan['custom_templates'],
                            "api": plan['api_access'],
                            "active": True
                        })
                    
                    print("✅ Subscription plans created")
                else:
                    print(f"✅ Subscription plans already exist ({plan_count} plans)")
                    
            except Exception as e:
                print(f"⚠️ Subscription plans warning: {e}")
            
            await db.commit()
            print("\n🎉 Hotfix migration completed successfully!")
            
        except Exception as exc:
            print(f"❌ Hotfix migration error: {exc}")
            import traceback
            print(f"Stack trace: {traceback.format_exc()}")
            await db.rollback()
        finally:
            await db.close()
            break


if __name__ == "__main__":
    print("🚀 Starting hotfix migration...")
    asyncio.run(hotfix_migration())
