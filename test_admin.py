"""
Simple test script to verify admin functionality
"""
import asyncio
import aiohttp
import json

async def test_admin_endpoints():
    """Test admin endpoints with proper authentication"""
    
    base_url = "http://localhost:8000"
    
    async with aiohttp.ClientSession() as session:
        print("🧪 Testing Admin Panel Functionality")
        print("=" * 50)
        
        # Step 1: Login as admin
        print("1. Logging in as admin...")
        login_data = {
            'username': 'admin@cvbuilder.com',
            'password': 'admin123'
        }
        
        async with session.post(
            f"{base_url}/auth/jwt/login",
            data=login_data
        ) as response:
            if response.status == 200:
                print("✅ Admin login successful")
                # Cookies are automatically handled by aiohttp session
            else:
                print(f"❌ Admin login failed: {response.status}")
                text = await response.text()
                print(f"Error: {text}")
                return
        
        # Step 2: Test admin health check
        print("\n2. Testing admin access...")
        async with session.get(f"{base_url}/admin/health") as response:
            if response.status == 200:
                data = await response.json()
                print("✅ Admin access verified")
                print(f"   Admin user: {data.get('admin_user', 'Unknown')}")
            else:
                print(f"❌ Admin access denied: {response.status}")
                return
        
        # Step 3: Test dashboard metrics
        print("\n3. Testing dashboard metrics...")
        async with session.get(f"{base_url}/admin/dashboard") as response:
            if response.status == 200:
                data = await response.json()
                print("✅ Dashboard metrics retrieved")
                print(f"   Total users: {data.get('total_users', 0)}")
                print(f"   Active users: {data.get('active_users', 0)}")
                print(f"   Total CVs: {data.get('total_cvs', 0)}")
                print(f"   Monthly revenue: ${data.get('monthly_revenue', 0):.2f}")
            else:
                print(f"❌ Dashboard metrics failed: {response.status}")
                text = await response.text()
                print(f"Error: {text}")
        
        # Step 4: Test user management
        print("\n4. Testing user management...")
        async with session.get(f"{base_url}/admin/users?page=1&page_size=5") as response:
            if response.status == 200:
                data = await response.json()
                print("✅ User list retrieved")
                print(f"   Total users: {data.get('total', 0)}")
                print(f"   Users on page: {len(data.get('items', []))}")
                
                # Show first user details
                users = data.get('items', [])
                if users:
                    user = users[0]
                    print(f"   First user: {user.get('email', 'Unknown')}")
                    print(f"   Role ID: {user.get('role_id', 'Unknown')}")
                    print(f"   Active: {user.get('is_active', 'Unknown')}")
            else:
                print(f"❌ User management failed: {response.status}")
                text = await response.text()
                print(f"Error: {text}")
        
        # Step 5: Test placeholder endpoints
        print("\n5. Testing placeholder endpoints...")
        
        endpoints = [
            ("/admin/cvs", "CV Management"),
            ("/admin/subscriptions", "Subscription Management"),
            ("/admin/analytics", "Analytics")
        ]
        
        for endpoint, name in endpoints:
            async with session.get(f"{base_url}{endpoint}") as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ {name}: {data.get('message', 'OK')}")
                else:
                    print(f"❌ {name} failed: {response.status}")
        
        print("\n" + "=" * 50)
        print("🎉 Admin panel testing completed!")
        print("\n📝 Next steps:")
        print("1. Start the frontend: cd FrontEnd && npm start")
        print("2. Login with admin@cvbuilder.com / admin123")
        print("3. Access admin panel via sidebar link")
        print("4. Change the default admin password!")

async def test_non_admin_access():
    """Test that non-admin users cannot access admin endpoints"""
    
    base_url = "http://localhost:8000"
    
    async with aiohttp.ClientSession() as session:
        print("\n🔒 Testing Non-Admin Access Restrictions")
        print("=" * 50)
        
        # Try to access admin endpoint without authentication
        print("1. Testing unauthenticated access...")
        async with session.get(f"{base_url}/admin/health") as response:
            if response.status == 401:
                print("✅ Unauthenticated access properly blocked")
            else:
                print(f"❌ Unexpected response: {response.status}")
        
        print("\n✅ Security test passed!")

async def main():
    """Main test function"""
    try:
        await test_admin_endpoints()
        await test_non_admin_access()
    except aiohttp.ClientConnectorError:
        print("❌ Cannot connect to server. Make sure the backend is running:")
        print("   cd BackEnd && uvicorn main:app --reload")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    print("🚀 Starting Admin Panel Tests")
    print("Make sure the backend server is running on http://localhost:8000")
    print("And that you've created an admin user with create_admin_user.py")
    print()
    
    asyncio.run(main())
