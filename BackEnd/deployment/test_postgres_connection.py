#!/usr/bin/env python3
"""
Test PostgreSQL connection and create database if needed
"""
import asyncio
import asyncpg
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def test_postgres_connection():
    """Test PostgreSQL connection and create database if needed"""
    
    # Connection details
    host = "localhost"
    port = 5432
    user = "postgres"
    password = "sdgm2003"
    database = "new-cv"
    
    print(f"🔍 Testing PostgreSQL connection to {host}:{port}")
    
    try:
        # First, try to connect to postgres database to create our target database
        print("1️⃣ Connecting to PostgreSQL server...")
        conn = await asyncpg.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database="postgres"  # Connect to default postgres database first
        )
        
        print("✅ Connected to PostgreSQL server successfully!")
        
        # Check if our target database exists
        print(f"2️⃣ Checking if database '{database}' exists...")
        result = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1", database
        )
        
        if result:
            print(f"✅ Database '{database}' already exists")
        else:
            print(f"📋 Creating database '{database}'...")
            await conn.execute(f'CREATE DATABASE "{database}"')
            print(f"✅ Database '{database}' created successfully!")
        
        await conn.close()
        
        # Now test connection to our target database
        print(f"3️⃣ Testing connection to '{database}' database...")
        target_conn = await asyncpg.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database
        )
        
        print(f"✅ Connected to '{database}' database successfully!")
        
        # Test a simple query
        version = await target_conn.fetchval("SELECT version()")
        print(f"📋 PostgreSQL version: {version}")
        
        await target_conn.close()
        
        # Test SQLAlchemy async connection
        print("4️⃣ Testing SQLAlchemy async connection...")
        database_url = f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{database}"
        engine = create_async_engine(database_url, echo=False)
        
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1 as test"))
            test_value = result.scalar()
            if test_value == 1:
                print("✅ SQLAlchemy async connection working!")
            else:
                print("❌ SQLAlchemy async connection test failed")
        
        await engine.dispose()
        
        print("\n🎉 All PostgreSQL connection tests passed!")
        print(f"📋 Database URL: postgresql+asyncpg://{user}:***@{host}:{port}/{database}")
        return True
        
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        print("\n🔧 Troubleshooting tips:")
        print(f"1. Make sure PostgreSQL is running on {host}:{port}")
        print(f"2. Verify username '{user}' and password are correct")
        print(f"3. Check if PostgreSQL allows connections from localhost")
        print(f"4. Ensure the user has permission to create databases")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_postgres_connection())
    sys.exit(0 if success else 1)
