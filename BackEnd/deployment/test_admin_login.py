#!/usr/bin/env python3
"""
Test admin user login functionality
"""
import asyncio
from passlib.context import CryptContext
from sqlalchemy import text
from core.database import get_async_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def test_admin_login():
    """Test admin user login"""
    print("🔐 Testing admin user login...")
    
    async for db in get_async_db():
        try:
            # Get admin user from database
            admin_result = await db.execute(
                text('''
                    SELECT u.email, u.hashed_password, u.is_active, u.is_superuser, u.is_verified, r.role_name
                    FROM "user" u
                    LEFT JOIN roles r ON u.role_id = r.id
                    WHERE u.email = :email
                '''),
                {'email': 'admin@cvbuilder.com'}
            )
            admin = admin_result.fetchone()
            
            if not admin:
                print("❌ Admin user not found!")
                return False
            
            print(f"✅ Admin user found:")
            print(f"   • Email: {admin[0]}")
            print(f"   • Active: {admin[2]}")
            print(f"   • Superuser: {admin[3]}")
            print(f"   • Verified: {admin[4]}")
            print(f"   • Role: {admin[5]}")
            
            # Test password verification
            test_password = "admin123"
            stored_hash = admin[1]
            
            print(f"\n🔑 Testing password verification...")
            print(f"   • Test password: {test_password}")
            print(f"   • Stored hash: {stored_hash[:50]}...")
            
            # Verify password
            is_valid = pwd_context.verify(test_password, stored_hash)
            
            if is_valid:
                print("✅ Password verification successful!")
            else:
                print("❌ Password verification failed!")
                return False
            
            # Test wrong password
            wrong_password = "wrongpassword"
            is_wrong_valid = pwd_context.verify(wrong_password, stored_hash)
            
            if not is_wrong_valid:
                print("✅ Wrong password correctly rejected!")
            else:
                print("❌ Wrong password incorrectly accepted!")
                return False
            
            print("\n🎉 Admin login test completed successfully!")
            print("\n📋 Login credentials:")
            print("   • Email: admin@cvbuilder.com")
            print("   • Password: admin123")
            print("   • Role: Admin")
            print("   • Permissions: Superuser, Active, Verified")
            
            return True
            
        except Exception as e:
            print(f"❌ Error testing admin login: {e}")
            import traceback
            print(f"Stack trace: {traceback.format_exc()}")
            return False
        finally:
            await db.close()
            break

if __name__ == "__main__":
    success = asyncio.run(test_admin_login())
    if success:
        print("\n✅ All tests passed! Admin user is ready for use.")
    else:
        print("\n❌ Tests failed! Check the errors above.")
