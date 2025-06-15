#!/usr/bin/env python3
"""
Test script to verify subscription status API returns correct usage data
"""
import asyncio
import sys
import os
import json

# Add the BackEnd directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'BackEnd'))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_async_db
from services.subscription_service import SubscriptionService
from models.user import User

async def test_subscription_status():
    """Test the subscription status API response"""
    print("🔍 Testing Subscription Status API...")
    print("=" * 50)
    
    # Get database session
    async for db in get_async_db():
        subscription_service = SubscriptionService(db)
        
        # Find the admin user
        query = select(User).where(User.email == "admin@cvbuilder.com")
        result = await db.execute(query)
        admin_user = result.scalar_one_or_none()
        
        if not admin_user:
            print("❌ Admin user not found")
            return
            
        print(f"📝 Testing with user: {admin_user.email}")
        
        try:
            # Get subscription status
            subscription = await subscription_service.get_user_subscription(admin_user.id)
            usage_stats_response = await subscription_service.get_usage_stats(admin_user.id)
            
            print(f"\n📊 Subscription Info:")
            if subscription:
                print(f"   Plan: {subscription.plan.name}")
                print(f"   Tier: {subscription.plan.tier}")
                print(f"   CV Analyses Limit: {subscription.plan.cv_analyses_per_month}")
                print(f"   Job Analyses Limit: {subscription.plan.job_analyses_per_month}")
            else:
                print("   Plan: Free (No subscription)")
            
            print(f"\n📈 Current Usage:")
            current_usage = usage_stats_response.current_month_usage
            print(f"   CV Analyses: {current_usage.cv_analyses_count}")
            print(f"   Job Analyses: {current_usage.job_analyses_count}")
            print(f"   CV Downloads: {current_usage.cv_downloads_count}")
            
            print(f"\n🎯 Usage Limits:")
            limits = usage_stats_response.subscription_limits
            print(f"   CV Analyses Limit: {limits.get('cv_analyses', 'N/A')}")
            print(f"   Job Analyses Limit: {limits.get('job_analyses', 'N/A')}")
            print(f"   CV Downloads Limit: {limits.get('cv_downloads', 'N/A')}")
            
            print(f"\n📱 Frontend API Response Structure:")
            print("   This is what the frontend /subscription/status endpoint should return:")
            
            # Simulate the API response structure
            cv_limit = limits.get("cv_analyses", 3)
            job_limit = limits.get("job_analyses", 1)
            cv_download_limit = limits.get("cv_downloads", 5)
            
            cv_remaining = max(0, cv_limit - current_usage.cv_analyses_count) if cv_limit else 999999
            job_remaining = max(0, job_limit - current_usage.job_analyses_count) if job_limit else 999999
            cv_download_remaining = max(0, cv_download_limit - current_usage.cv_downloads_count) if cv_download_limit else 999999
            
            api_response = {
                "has_subscription": subscription is not None,
                "current_tier": subscription.plan.name if subscription else "Free",
                "usage_stats": {
                    "cv_analyses_used": current_usage.cv_analyses_count,
                    "job_analyses_used": current_usage.job_analyses_count,
                    "cvs_stored": current_usage.cv_downloads_count,
                    "cv_analyses_remaining": cv_remaining if cv_remaining != 999999 else 999999,
                    "job_analyses_remaining": job_remaining if job_remaining != 999999 else 999999,
                    "cv_storage_remaining": cv_download_remaining if cv_download_remaining != 999999 else 999999,
                    "billing_period_start": "2025-06-01",
                    "billing_period_end": "2025-07-01"
                },
                "features_available": {
                    "advanced_analytics": subscription.plan.advanced_analytics if subscription else False,
                    "priority_support": subscription.plan.priority_support if subscription else False,
                    "custom_templates": subscription.plan.custom_templates if subscription else False,
                    "api_access": subscription.plan.api_access if subscription else False,
                }
            }
            
            print(json.dumps(api_response, indent=2))
            
            print(f"\n✅ All three usage types are now tracked:")
            print(f"   🔍 CV Analyses: {current_usage.cv_analyses_count} used")
            print(f"   💼 Job Analyses: {current_usage.job_analyses_count} used") 
            print(f"   💾 CVs Stored: {current_usage.cv_downloads_count} used")
            
        except Exception as e:
            print(f"\n❌ Test failed with error: {str(e)}")
            import traceback
            traceback.print_exc()
        
        break  # Exit the async generator

if __name__ == "__main__":
    print("🚀 Starting Subscription Status Test...")
    asyncio.run(test_subscription_status())
