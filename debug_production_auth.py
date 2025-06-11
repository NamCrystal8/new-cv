#!/usr/bin/env python3
"""
Production Authentication Debugging Script
Tests the authentication flow on the deployed Render application
"""

import requests
import json
import os
from urllib.parse import urljoin

# Configuration
BASE_URL = "https://new-cv-9zoc.onrender.com"
TEST_ENDPOINTS = [
    "/user-cvs",
    "/subscription/current", 
    "/subscription/status",
    "/users/me",
    "/admin/health"
]

def test_health_endpoint():
    """Test if the API is accessible"""
    print("🔍 Testing API Health...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        print(f"   Health Status: {response.status_code}")
        if response.ok:
            data = response.json()
            print(f"   Response: {data}")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"   Connection Error: {e}")
        return False

def test_auth_endpoints():
    """Test authentication endpoints availability"""
    print("\n🔍 Testing Authentication Endpoints...")
    
    auth_endpoints = [
        "/auth/jwt/login",
        "/auth/bearer/login", 
        "/auth/register"
    ]
    
    for endpoint in auth_endpoints:
        try:
            # Use OPTIONS to test endpoint availability
            response = requests.options(f"{BASE_URL}{endpoint}", timeout=10)
            print(f"   {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"   {endpoint}: Error - {e}")

def test_cors_headers():
    """Test CORS configuration"""
    print("\n🔍 Testing CORS Headers...")
    try:
        response = requests.options(
            f"{BASE_URL}/health",
            headers={
                'Origin': 'https://new-cv-fe.onrender.com',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Authorization'
            },
            timeout=10
        )
        
        print(f"   CORS Status: {response.status_code}")
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
            'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
        }
        
        for header, value in cors_headers.items():
            print(f"   {header}: {value}")
            
    except Exception as e:
        print(f"   CORS Test Error: {e}")

def test_bearer_login(email, password):
    """Test bearer token login"""
    print(f"\n🔍 Testing Bearer Token Login with {email}...")
    
    try:
        # Test bearer login
        login_data = {
            'username': email,
            'password': password
        }
        
        response = requests.post(
            f"{BASE_URL}/auth/bearer/login",
            data=login_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=10
        )
        
        print(f"   Login Status: {response.status_code}")
        
        if response.ok:
            token_data = response.json()
            access_token = token_data.get('access_token')
            print(f"   Token received: {access_token[:20]}..." if access_token else "   No token in response")
            return access_token
        else:
            print(f"   Login Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"   Login Exception: {e}")
        return None

def test_protected_endpoints(token):
    """Test protected endpoints with bearer token"""
    print(f"\n🔍 Testing Protected Endpoints...")
    
    if not token:
        print("   No token available, skipping protected endpoint tests")
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    for endpoint in TEST_ENDPOINTS:
        try:
            response = requests.get(
                f"{BASE_URL}{endpoint}",
                headers=headers,
                timeout=10
            )
            
            status_icon = "✅" if response.ok else "❌"
            print(f"   {status_icon} {endpoint}: {response.status_code}")
            
            if not response.ok:
                print(f"      Error: {response.text[:100]}...")
                
        except Exception as e:
            print(f"   ❌ {endpoint}: Exception - {e}")

def test_cookie_login(email, password):
    """Test cookie-based login (for comparison)"""
    print(f"\n🔍 Testing Cookie Login with {email}...")
    
    try:
        session = requests.Session()
        
        login_data = {
            'username': email,
            'password': password
        }
        
        response = session.post(
            f"{BASE_URL}/auth/jwt/login",
            data=login_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=10
        )
        
        print(f"   Cookie Login Status: {response.status_code}")
        
        if response.ok:
            print(f"   Cookies: {list(session.cookies.keys())}")
            
            # Test /users/me with cookies
            me_response = session.get(f"{BASE_URL}/users/me", timeout=10)
            print(f"   /users/me with cookies: {me_response.status_code}")
            
        else:
            print(f"   Cookie Login Error: {response.text}")
            
    except Exception as e:
        print(f"   Cookie Login Exception: {e}")

def test_debug_endpoints():
    """Test debug endpoints if available"""
    print(f"\n🔍 Testing Debug Endpoints...")
    
    debug_endpoints = [
        "/debug/auth-status",
        "/debug/auth-backends"
    ]
    
    for endpoint in debug_endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            print(f"   {endpoint}: {response.status_code}")
            if response.ok:
                data = response.json()
                print(f"      {json.dumps(data, indent=2)}")
        except Exception as e:
            print(f"   {endpoint}: Error - {e}")

def main():
    """Run all authentication tests"""
    print("🧪 Production Authentication Debugging")
    print("=" * 50)
    print(f"Testing: {BASE_URL}")
    
    # Test 1: Basic connectivity
    if not test_health_endpoint():
        print("\n❌ API is not accessible. Check deployment status.")
        return
    
    # Test 2: Auth endpoints
    test_auth_endpoints()
    
    # Test 3: CORS
    test_cors_headers()
    
    # Test 4: Debug endpoints
    test_debug_endpoints()
    
    # Test 5: Authentication flow
    email = input("\nEnter test email (or press Enter to skip auth tests): ").strip()
    if email:
        password = input("Enter password: ").strip()
        
        # Test bearer login
        token = test_bearer_login(email, password)
        
        # Test protected endpoints
        test_protected_endpoints(token)
        
        # Test cookie login for comparison
        test_cookie_login(email, password)
    
    print("\n" + "=" * 50)
    print("🏁 Debugging Complete")
    print("\nNext steps if issues found:")
    print("1. Check Render environment variables")
    print("2. Check backend logs in Render dashboard")
    print("3. Verify JWT_SECRET is set correctly")
    print("4. Ensure ENVIRONMENT=production is set")

if __name__ == "__main__":
    main()
