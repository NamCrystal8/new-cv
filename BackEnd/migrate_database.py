"""
Complete database migration script for Render deployment
This will update your old database to match the current models
"""
import asyncio
import sys
import os
import uuid

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from core.database import get_async_db, engine, Base
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def migrate_database():
    """Complete database migration"""
    print("🚀 Starting database migration...")
    
    async for db in get_async_db():
        try:
            # Step 1: Create all tables from current models
            print("📋 Creating/updating tables from models...")
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print("✅ Tables created/updated successfully")
            
            # Step 2: Check current schema
            print("\n🔍 Checking current database schema...")
            
            # Get all tables
            tables_query = """
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """
            tables_result = await db.execute(text(tables_query))
            tables = [row[0] for row in tables_result.fetchall()]
            
            print(f"Found tables: {', '.join(tables)}")
            
            # Step 3: Handle user table specifically
            if 'user' in tables:
                print("\n👤 Checking user table schema...")
                user_schema_query = """
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns 
                    WHERE table_name = 'user' AND table_schema = 'public'
                    ORDER BY ordinal_position;
                """
                user_schema_result = await db.execute(text(user_schema_query))
                user_columns = {row[0]: row for row in user_schema_result.fetchall()}
                
                print("User table columns:")
                for col_name, col_info in user_columns.items():
                    nullable = "NULL" if col_info[2] == "YES" else "NOT NULL"
                    print(f"  - {col_name}: {col_info[1]} {nullable}")
                
                # Handle role column migration
                await migrate_user_roles(db, user_columns)
            
            # Step 4: Create missing tables
            await create_missing_tables(db, tables)
            
            # Step 5: Create admin user
            await create_admin_user(db)
            
            # Step 6: Create default subscription plans
            await create_default_plans(db)
            
            await db.commit()
            print("\n🎉 Database migration completed successfully!")
            
        except Exception as exc:
            print(f"❌ Migration error: {exc}")
            import traceback
            print(f"Stack trace: {traceback.format_exc()}")
            await db.rollback()
        finally:
            await db.close()
            break


async def migrate_user_roles(db, user_columns):
    """Handle user role column migration"""
    print("\n🔧 Handling user role migration...")

    try:
        # First, ensure roles table exists
        roles_check = """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_name = 'roles' AND table_schema = 'public';
        """
        roles_exists = await db.execute(text(roles_check))

        if roles_exists.scalar() == 0:
            print("Creating roles table...")
            create_roles = """
                CREATE TABLE roles (
                    id SERIAL PRIMARY KEY,
                    role_name VARCHAR(50) UNIQUE NOT NULL
                );
            """
            await db.execute(text(create_roles))

            # Insert default roles
            insert_roles = """
                INSERT INTO roles (id, role_name) VALUES
                (1, 'Admin'),
                (2, 'User')
                ON CONFLICT (id) DO NOTHING;
            """
            await db.execute(text(insert_roles))
            print("✅ Roles table created with default roles")
        else:
            print("✅ Roles table already exists")

            # Ensure default roles exist even if table exists
            print("Ensuring default roles exist...")
            ensure_roles = """
                INSERT INTO roles (id, role_name) VALUES
                (1, 'Admin'),
                (2, 'User')
                ON CONFLICT (id) DO NOTHING;
            """
            await db.execute(text(ensure_roles))
            print("✅ Default roles ensured")

        # Handle role column migration
        if 'role' in user_columns and 'role_id' not in user_columns:
            print("Found string 'role' column, migrating to role_id...")

            # Add role_id column
            add_role_id = """
                ALTER TABLE "user"
                ADD COLUMN role_id INTEGER;
            """
            await db.execute(text(add_role_id))

            # Migrate data from role to role_id
            migrate_data = """
                UPDATE "user"
                SET role_id = CASE
                    WHEN role = 'Admin' THEN 1
                    ELSE 2
                END;
            """
            await db.execute(text(migrate_data))

            # Add foreign key constraint
            add_fk = """
                ALTER TABLE "user"
                ADD CONSTRAINT fk_user_role_id
                FOREIGN KEY (role_id) REFERENCES roles(id);
            """
            await db.execute(text(add_fk))

            # Drop old role column
            drop_role = 'ALTER TABLE "user" DROP COLUMN role;'
            await db.execute(text(drop_role))

            print("✅ Migrated from role to role_id column")

        elif 'role_id' not in user_columns:
            print("Adding role_id column...")

            # Add role_id column with default value
            add_role_id = """
                ALTER TABLE "user"
                ADD COLUMN role_id INTEGER NOT NULL DEFAULT 2;
            """
            await db.execute(text(add_role_id))

            # Add foreign key constraint
            add_fk = """
                ALTER TABLE "user"
                ADD CONSTRAINT fk_user_role_id
                FOREIGN KEY (role_id) REFERENCES roles(id);
            """
            await db.execute(text(add_fk))

            print("✅ Added role_id column with foreign key")
        else:
            print("✅ role_id column already exists")

    except Exception as e:
        print(f"⚠️ Role migration warning: {e}")
        import traceback
        print(f"Stack trace: {traceback.format_exc()}")


async def create_missing_tables(db, existing_tables):
    """Create any missing tables"""
    print("\n📋 Checking for missing tables...")
    
    expected_tables = ['user', 'roles', 'subscription_plans', 'user_subscriptions', 'cv']
    missing_tables = [table for table in expected_tables if table not in existing_tables]
    
    if missing_tables:
        print(f"Creating missing tables: {', '.join(missing_tables)}")
        
        # Create subscription_plans if missing
        if 'subscription_plans' in missing_tables:
            create_plans_table = """
                CREATE TABLE subscription_plans (
                    id SERIAL PRIMARY KEY,
                    plan_name VARCHAR(100) NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    features TEXT,
                    max_cvs INTEGER,
                    is_active BOOLEAN DEFAULT true
                );
            """
            await db.execute(text(create_plans_table))
            print("✅ Created subscription_plans table")
        
        # Create user_subscriptions if missing
        if 'user_subscriptions' in missing_tables:
            create_user_subs_table = """
                CREATE TABLE user_subscriptions (
                    id SERIAL PRIMARY KEY,
                    user_id UUID REFERENCES "user"(id),
                    plan_id INTEGER REFERENCES subscription_plans(id),
                    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    end_date TIMESTAMP,
                    is_active BOOLEAN DEFAULT true
                );
            """
            await db.execute(text(create_user_subs_table))
            print("✅ Created user_subscriptions table")
    else:
        print("All expected tables exist")


async def create_admin_user(db):
    """Create admin user with proper role handling"""
    print("\n👤 Creating admin user...")

    admin_email = "admin@cvbuilder.com"

    # Check if admin exists
    check_admin = 'SELECT email FROM "user" WHERE email = :email'
    existing = await db.execute(text(check_admin), {"email": admin_email})

    if existing.fetchone():
        print(f"ℹ️ Admin user {admin_email} already exists")
        return

    admin_id = str(uuid.uuid4())
    hashed_password = pwd_context.hash("admin123")

    # Always use role_id = 1 for Admin (after migration, this column should exist)
    insert_query = """
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

    await db.execute(text(insert_query), values)
    print(f"✅ Created admin user: {admin_email} with role_id=1 (Admin)")


async def create_default_plans(db):
    """Create standardized default subscription plans"""
    print("\n💳 Creating standardized subscription plans...")

    # Check if plans exist
    check_plans = "SELECT COUNT(*) FROM subscription_plans"
    try:
        result = await db.execute(text(check_plans))
        if result.scalar() > 0:
            print("ℹ️ Subscription plans already exist")
            return
    except:
        print("⚠️ Subscription plans table doesn't exist, creating it...")
        # Create the table if it doesn't exist
        create_table = """
            CREATE TABLE subscription_plans (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                tier VARCHAR(20) NOT NULL,
                price_monthly DECIMAL(10,2) DEFAULT 0.0,
                price_yearly DECIMAL(10,2) DEFAULT 0.0,
                cv_analyses_per_month INTEGER,
                job_analyses_per_month INTEGER,
                cv_storage_limit INTEGER,
                advanced_analytics BOOLEAN DEFAULT FALSE,
                priority_support BOOLEAN DEFAULT FALSE,
                custom_templates BOOLEAN DEFAULT FALSE,
                api_access BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            );
        """
        await db.execute(text(create_table))
        print("✅ Created subscription_plans table")

    # Create standardized plans matching init_subscription_plans.py
    plans = [
        {
            'id': 1,
            'name': 'Free',
            'tier': 'free',
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
            'tier': 'premium',
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
            'tier': 'pro',
            'price_monthly': 19.99,
            'price_yearly': 199.99,
            'cv_analyses_per_month': None,  # Unlimited
            'job_analyses_per_month': None,  # Unlimited
            'cv_storage_limit': None,  # Unlimited
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
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (id) DO NOTHING
        """
        await db.execute(text(insert_plan), (
            plan['id'], plan['name'], plan['tier'],
            plan['price_monthly'], plan['price_yearly'],
            plan['cv_analyses_per_month'], plan['job_analyses_per_month'],
            plan['cv_storage_limit'],
            plan['advanced_analytics'], plan['priority_support'],
            plan['custom_templates'], plan['api_access'],
            True
        ))

    print("✅ Created standardized subscription plans:")
    print("  • Free: 3 CV analyses/month, 1 job analysis/month")
    print("  • Premium: 50 CV analyses/month, 20 job analyses/month, $9.99/month")
    print("  • Pro: Unlimited analyses, all features, $19.99/month")


if __name__ == "__main__":
    print("🚀 Starting complete database migration...")
    asyncio.run(migrate_database())
