#!/usr/bin/env python3
"""
Test script to verify authentication configuration
"""
import os
import sys
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_environment_detection():
    """Test environment detection logic"""
    print("🔧 Environment Detection Test")
    print("=" * 50)
    
    database_url = os.getenv("DATABASE_URL", "")
    environment = os.getenv("ENVIRONMENT", "development")
    render_env = os.getenv("RENDER")
    
    print(f"DATABASE_URL: {database_url}")
    print(f"ENVIRONMENT: {environment}")
    print(f"RENDER: {render_env}")
    
    # Test production detection logic
    is_production = (
        environment == "production" or 
        "render.com" in database_url or
        render_env is not None
    )
    
    print(f"Is Production: {is_production}")
    print()

def test_jwt_secret():
    """Test JWT secret configuration"""
    print("🔐 JWT Secret Test")
    print("=" * 50)
    
    jwt_secret = os.getenv("JWT_SECRET", "")
    
    if not jwt_secret:
        print("❌ JWT_SECRET is not set!")
        return False
    elif jwt_secret == "DEFAULT_SECRET_KEY_CHANGE_ME":
        print("⚠️  JWT_SECRET is using default value!")
        return False
    elif len(jwt_secret) < 32:
        print(f"⚠️  JWT_SECRET is too short ({len(jwt_secret)} chars, should be at least 32)")
        return False
    else:
        print(f"✅ JWT_SECRET is properly configured ({len(jwt_secret)} chars)")
        return True

def test_cors_configuration():
    """Test CORS configuration"""
    print("🌐 CORS Configuration Test")
    print("=" * 50)
    
    frontend_url = os.getenv("FRONTEND_URL", "https://new-cv-fe.onrender.com")
    print(f"FRONTEND_URL: {frontend_url}")
    
    # Expected origins
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://new-cv-fe.onrender.com",
        frontend_url
    ]
    
    # Remove duplicates
    allowed_origins = list(set(filter(None, allowed_origins)))
    
    print("Allowed origins:")
    for origin in allowed_origins:
        print(f"  - {origin}")
    print()

async def test_database_connection():
    """Test database connection"""
    print("🗄️  Database Connection Test")
    print("=" * 50)
    
    try:
        from core.database import get_async_db
        from sqlalchemy import text
        
        async for db in get_async_db():
            try:
                result = await db.execute(text("SELECT 1"))
                row = result.scalar()
                if row == 1:
                    print("✅ Database connection successful")
                    return True
                else:
                    print("❌ Database connection failed - unexpected result")
                    return False
            except Exception as e:
                print(f"❌ Database connection failed: {e}")
                return False
            finally:
                await db.close()
                break
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return False

async def test_authentication_backends():
    """Test authentication backend configuration"""
    print("🔑 Authentication Backends Test")
    print("=" * 50)
    
    try:
        from core.security import fastapi_users, auth_backends, is_production
        
        print(f"Production mode: {is_production}")
        print(f"Number of auth backends: {len(auth_backends)}")
        
        for i, backend in enumerate(auth_backends):
            print(f"  {i+1}. {backend.name}")
            print(f"     Transport: {type(backend.transport).__name__}")
            if hasattr(backend.transport, 'tokenUrl'):
                print(f"     Token URL: {backend.transport.tokenUrl}")
        
        print("✅ Authentication backends configured")
        return True
        
    except Exception as e:
        print(f"❌ Authentication backend test failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("🧪 Authentication Configuration Tests")
    print("=" * 60)
    print()
    
    # Run tests
    test_environment_detection()
    jwt_ok = test_jwt_secret()
    test_cors_configuration()
    db_ok = await test_database_connection()
    auth_ok = await test_authentication_backends()
    
    print()
    print("📊 Test Summary")
    print("=" * 50)
    print(f"JWT Secret: {'✅' if jwt_ok else '❌'}")
    print(f"Database: {'✅' if db_ok else '❌'}")
    print(f"Auth Backends: {'✅' if auth_ok else '❌'}")
    
    if all([jwt_ok, db_ok, auth_ok]):
        print("\n🎉 All tests passed!")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the configuration.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
