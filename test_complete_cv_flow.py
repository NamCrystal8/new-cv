#!/usr/bin/env python3
"""
Test script specifically for the /complete-cv-flow endpoint authentication
"""

import requests
import json
import os

# Configuration
BASE_URL = "https://new-cv-9zoc.onrender.com"

def test_complete_cv_flow_endpoint():
    """Test the complete-cv-flow endpoint with proper authentication"""
    print("🧪 Testing /complete-cv-flow Endpoint Authentication")
    print("=" * 60)
    
    # Step 1: Login to get bearer token
    print("1. 🔐 Getting Bearer Token...")
    email = input("Enter your email: ").strip()
    password = input("Enter your password: ").strip()
    
    try:
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
        
        if not response.ok:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return
        
        token_data = response.json()
        access_token = token_data.get('access_token')
        print(f"✅ Login successful! Token: {access_token[:20]}...")
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Step 2: Test the complete-cv-flow endpoint
    print("\n2. 🧪 Testing /complete-cv-flow endpoint...")
    
    # Create test payload (this would normally come from a real CV analysis flow)
    test_payload = {
        "flow_id": "test-flow-id-12345",  # This would be a real flow ID
        "additional_inputs": {
            "header": json.dumps({
                "name": "John Doe",
                "email": "john.doe@example.com",
                "phone": "+1234567890",
                "location": "New York, NY"
            }),
            "experience": json.dumps([
                {
                    "company": "Tech Corp",
                    "position": "Software Engineer",
                    "duration": "2020-2023",
                    "description": "Developed web applications using Python and React"
                }
            ]),
            "education": json.dumps([
                {
                    "institution": "University of Technology",
                    "degree": "Bachelor of Computer Science",
                    "duration": "2016-2020",
                    "gpa": "3.8/4.0"
                }
            ])
        }
    }
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/complete-cv-flow",
            headers=headers,
            json=test_payload,
            timeout=30
        )
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 401:
            print("❌ 401 Unauthorized - Authentication failed!")
            print(f"Response: {response.text}")
            
            # Additional debugging
            print("\n🔍 Debugging Information:")
            print(f"   - Token used: {access_token[:20]}...")
            print(f"   - Authorization header: Bearer {access_token[:20]}...")
            print(f"   - Request headers: {headers}")
            
        elif response.status_code == 404:
            print("⚠️  404 Not Found - Flow ID doesn't exist (expected for test)")
            print("✅ Authentication worked! (The 404 is expected since we used a test flow ID)")
            print(f"Response: {response.text}")
            
        elif response.status_code == 200:
            print("✅ 200 Success - Endpoint works perfectly!")
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            
        else:
            print(f"⚠️  Unexpected status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request error: {e}")
    
    # Step 3: Test other protected endpoints for comparison
    print("\n3. 🔍 Testing Other Protected Endpoints for Comparison...")
    
    test_endpoints = [
        "/users/me",
        "/subscription/status", 
        "/subscription/current",
        "/user-cvs"
    ]
    
    for endpoint in test_endpoints:
        try:
            response = requests.get(
                f"{BASE_URL}{endpoint}",
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=10
            )
            
            status_icon = "✅" if response.ok else "❌"
            print(f"   {status_icon} {endpoint}: {response.status_code}")
            
            if response.status_code == 401:
                print(f"      ❌ Authentication failed for {endpoint}")
            
        except Exception as e:
            print(f"   ❌ {endpoint}: Error - {e}")
    
    # Step 4: Test debug endpoints
    print("\n4. 🔧 Testing Debug Endpoints...")
    
    debug_endpoints = [
        "/debug/auth-status",
        "/debug/protected-test",
        "/debug/auth-backends"
    ]
    
    for endpoint in debug_endpoints:
        try:
            if endpoint == "/debug/protected-test":
                # This one requires authentication
                response = requests.get(
                    f"{BASE_URL}{endpoint}",
                    headers={'Authorization': f'Bearer {access_token}'},
                    timeout=10
                )
            else:
                # These don't require authentication
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            
            status_icon = "✅" if response.ok else "❌"
            print(f"   {status_icon} {endpoint}: {response.status_code}")
            
            if response.ok and endpoint == "/debug/auth-backends":
                data = response.json()
                print(f"      Production mode: {data.get('is_production', 'Unknown')}")
                print(f"      Backend count: {data.get('backend_count', 'Unknown')}")
            
        except Exception as e:
            print(f"   ❌ {endpoint}: Error - {e}")

def main():
    """Main test function"""
    print("🧪 Complete CV Flow Authentication Test")
    print("This script tests the /complete-cv-flow endpoint authentication")
    print("that was causing 401 errors in production.")
    print()
    
    test_complete_cv_flow_endpoint()
    
    print("\n" + "=" * 60)
    print("🏁 Test Complete")
    print("\nExpected Results:")
    print("✅ Login should succeed and return a bearer token")
    print("✅ /complete-cv-flow should return 404 (flow not found) NOT 401 (unauthorized)")
    print("✅ Other protected endpoints should return 200 or appropriate responses")
    print("✅ Debug endpoints should show production mode and proper backends")
    print("\nIf you see 401 errors, the authentication fix needs more work.")
    print("If you see 404 errors for /complete-cv-flow, the authentication is working!")

if __name__ == "__main__":
    main()
