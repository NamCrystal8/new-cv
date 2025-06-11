#!/usr/bin/env python3
"""
Create admin user using FastAPI Users password system
"""
import asyncio
import uuid
from sqlalchemy import text

from core.database import get_async_db
from core.security import get_user_manager
from models.user import User, get_user_db
from schemas.user import UserCreate

async def create_admin_user():
    """Create admin user using FastAPI Users system"""
    print("🚀 Creating admin user with FastAPI Users password system...")
    
    async for db in get_async_db():
        try:
            # Get user database and user manager
            async for user_db in get_user_db(db):
                async for user_manager in get_user_manager(user_db):
                    
                    # Check if admin already exists
                    admin_email = "admin@cvbuilder.com"
                    existing_admin = await user_manager.get_by_email(admin_email)
                    
                    if existing_admin:
                        print(f"✅ Admin user already exists: {admin_email}")
                        
                        # Test the password
                        print("\n🔑 Testing existing admin password...")
                        verified, _ = user_manager.password_helper.verify_and_update(
                            "admin123", existing_admin.hashed_password
                        )
                        
                        if verified:
                            print("✅ Password 'admin123' works correctly!")
                        else:
                            print("❌ Password 'admin123' does not work. Updating password...")
                            
                            # Update the password using FastAPI Users
                            new_hash = user_manager.password_helper.hash("admin123")
                            await user_manager.user_db.update(existing_admin, {"hashed_password": new_hash})
                            print("✅ Password updated successfully!")
                        
                        # Ensure admin has correct role
                        if existing_admin.role_id != 1:
                            await user_manager.user_db.update(existing_admin, {"role_id": 1})
                            print("✅ Updated admin role to role_id=1")
                        
                        # Ensure admin is superuser, active, and verified
                        updates = {}
                        if not existing_admin.is_superuser:
                            updates["is_superuser"] = True
                        if not existing_admin.is_active:
                            updates["is_active"] = True
                        if not existing_admin.is_verified:
                            updates["is_verified"] = True
                        
                        if updates:
                            await user_manager.user_db.update(existing_admin, updates)
                            print(f"✅ Updated admin permissions: {updates}")
                        
                        break
                    
                    # Create new admin user
                    print(f"📋 Creating new admin user: {admin_email}")
                    
                    user_create = UserCreate(
                        email=admin_email,
                        password="admin123",
                        is_superuser=True,
                        is_verified=True
                    )
                    
                    # Create the user
                    admin_user = await user_manager.create(user_create)
                    
                    # Update role to admin (role_id=1)
                    await user_manager.user_db.update(admin_user, {"role_id": 1})
                    
                    print("✅ Created admin user:")
                    print("   • Email: admin@cvbuilder.com")
                    print("   • Password: admin123")
                    print("   • Role: Admin (role_id=1)")
                    print("   • Superuser: True")
                    print("   • Active: True")
                    print("   • Verified: True")
                    
                    break
                break
            
            # Verify the admin user
            print("\n3️⃣ Verifying admin user...")
            admin_result = await db.execute(
                text('''
                    SELECT u.email, u.is_superuser, u.is_active, u.is_verified, u.role_id, r.role_name
                    FROM "user" u
                    LEFT JOIN roles r ON u.role_id = r.id
                    WHERE u.email = :email
                '''),
                {'email': 'admin@cvbuilder.com'}
            )
            admin = admin_result.fetchone()
            
            if admin:
                print("✅ Admin user verified:")
                print(f"   • Email: {admin[0]}")
                print(f"   • Superuser: {admin[1]}")
                print(f"   • Active: {admin[2]}")
                print(f"   • Verified: {admin[3]}")
                print(f"   • Role: {admin[5]} (id={admin[4]})")
            else:
                print("❌ Admin user verification failed")
                return False
            
            print("\n🎉 Admin user setup completed successfully!")
            print("\n📋 Login credentials:")
            print("   • Email: admin@cvbuilder.com")
            print("   • Password: admin123")
            print("   • Role: Admin")
            print("   • Access: Full admin panel access")
            
            return True
            
        except Exception as e:
            print(f"❌ Error creating admin user: {e}")
            import traceback
            print(f"Stack trace: {traceback.format_exc()}")
            return False
        finally:
            await db.close()
            break

if __name__ == "__main__":
    success = asyncio.run(create_admin_user())
    if success:
        print("\n✅ Admin user is ready for use!")
    else:
        print("\n❌ Admin user creation failed!")
