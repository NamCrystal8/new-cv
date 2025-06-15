#!/usr/bin/env python3
"""
Test script to check the actual API response from /subscription/status
"""
import asyncio
import sys
import os
import json
import httpx

async def test_api_response():
    """Test the actual API response"""
    print("🔍 Testing /subscription/status API Response...")
    print("=" * 50)
    
    # First, let's test if the backend is running
    try:
        async with httpx.AsyncClient() as client:
            # Test if backend is running
            response = await client.get("http://localhost:8000/")
            print(f"✅ Backend is running: {response.status_code}")
    except Exception as e:
        print(f"❌ Backend is not running: {e}")
        print("Please start the backend with: cd BackEnd && uvicorn main:app --reload")
        return
    
    # Test login to get token
    try:
        async with httpx.AsyncClient() as client:
            login_data = {
                "username": "admin@cvbuilder.com",
                "password": "admin123"
            }
            
            print("\n🔐 Logging in...")
            response = await client.post(
                "http://localhost:8000/auth/bearer/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code != 200:
                print(f"❌ Login failed: {response.status_code}")
                print(f"Response: {response.text}")
                return
                
            token_data = response.json()
            access_token = token_data["access_token"]
            print(f"✅ Login successful, got token")
            
            # Test subscription status
            print("\n📊 Getting subscription status...")
            headers = {"Authorization": f"Bearer {access_token}"}
            response = await client.get(
                "http://localhost:8000/subscription/status",
                headers=headers
            )
            
            if response.status_code != 200:
                print(f"❌ Subscription status failed: {response.status_code}")
                print(f"Response: {response.text}")
                return
                
            status_data = response.json()
            print(f"✅ Subscription status successful")
            print("\n📱 API Response:")
            print(json.dumps(status_data, indent=2))
            
            # Check specific values
            usage_stats = status_data.get("usage_stats", {})
            print(f"\n🔍 Usage Stats Analysis:")
            print(f"   cv_analyses_used: {usage_stats.get('cv_analyses_used')} (type: {type(usage_stats.get('cv_analyses_used'))})")
            print(f"   cv_analyses_remaining: {usage_stats.get('cv_analyses_remaining')} (type: {type(usage_stats.get('cv_analyses_remaining'))})")
            print(f"   job_analyses_used: {usage_stats.get('job_analyses_used')} (type: {type(usage_stats.get('job_analyses_used'))})")
            print(f"   job_analyses_remaining: {usage_stats.get('job_analyses_remaining')} (type: {type(usage_stats.get('job_analyses_remaining'))})")
            print(f"   cvs_stored: {usage_stats.get('cvs_stored')} (type: {type(usage_stats.get('cvs_stored'))})")
            print(f"   cv_storage_remaining: {usage_stats.get('cv_storage_remaining')} (type: {type(usage_stats.get('cv_storage_remaining'))})")
            
            # Calculate totals like frontend would
            cv_used = usage_stats.get('cv_analyses_used') or 0
            cv_remaining = usage_stats.get('cv_analyses_remaining') or 0
            cv_total = cv_used + cv_remaining
            
            job_used = usage_stats.get('job_analyses_used') or 0
            job_remaining = usage_stats.get('job_analyses_remaining') or 0
            job_total = job_used + job_remaining
            
            storage_used = usage_stats.get('cvs_stored') or 0
            storage_remaining = usage_stats.get('cv_storage_remaining') or 0
            storage_total = storage_used + storage_remaining
            
            print(f"\n🧮 Frontend Calculations:")
            print(f"   CV: {cv_used} / {cv_total}")
            print(f"   Job: {job_used} / {job_total}")
            print(f"   Storage: {storage_used} / {storage_total}")
            
            if cv_total == 0 or job_total == 0 or storage_total == 0:
                print(f"\n❌ Found 0 totals - this is the issue!")
                print(f"   This means the API is returning 0 or null for remaining values")
            else:
                print(f"\n✅ All totals look good!")
                
    except Exception as e:
        print(f"❌ API test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Starting API Response Test...")
    asyncio.run(test_api_response())
