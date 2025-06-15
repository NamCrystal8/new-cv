#!/usr/bin/env python3
"""
Test script to verify usage tracking functionality
"""
import asyncio
import sys
import os
import uuid
from datetime import datetime

# Add the BackEnd directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'BackEnd'))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from core.database import get_async_db
from services.subscription_service import SubscriptionService
from models.subscription import UsageTracking
from models.user import User

async def test_usage_tracking():
    """Test the usage tracking functionality"""
    print("🔍 Testing Usage Tracking System...")
    print("=" * 50)

    # Get database session
    async for db in get_async_db():
        subscription_service = SubscriptionService(db)

        # Find the admin user to test with
        query = select(User).where(User.email == "admin@cvbuilder.com")
        result = await db.execute(query)
        admin_user = result.scalar_one_or_none()

        if not admin_user:
            print("❌ Admin user (admin@cvbuilder.com) not found in database.")
            print("   Please make sure the admin user exists.")
            return

        test_user_id = admin_user.id
        print(f"📝 Using user ID: {test_user_id}")
        print(f"📧 User email: {admin_user.email}")
        print(f"👤 User role: {'Admin' if admin_user.is_superuser else 'Regular User'}")

        try:
            # Test 1: Check initial usage stats
            print("\n1️⃣ Testing initial usage stats...")
            usage_stats = await subscription_service.get_usage_stats(test_user_id)
            print(f"   Initial CV analyses: {usage_stats.current_month_usage.cv_analyses_count}")
            print(f"   Initial job analyses: {usage_stats.current_month_usage.job_analyses_count}")
            print(f"   Initial CV downloads: {usage_stats.current_month_usage.cv_downloads_count}")
            
            # Test 2: Increment CV analysis usage
            print("\n2️⃣ Testing CV analysis usage increment...")
            await subscription_service.increment_usage(test_user_id, "cv_analysis")
            usage_stats = await subscription_service.get_usage_stats(test_user_id)
            print(f"   CV analyses after increment: {usage_stats.current_month_usage.cv_analyses_count}")
            assert usage_stats.current_month_usage.cv_analyses_count == 1, "CV analysis count should be 1"
            print("   ✅ CV analysis tracking works!")
            
            # Test 3: Increment job analysis usage
            print("\n3️⃣ Testing job analysis usage increment...")
            initial_job_count = usage_stats.current_month_usage.job_analyses_count
            await subscription_service.increment_usage(test_user_id, "job_analysis")
            usage_stats = await subscription_service.get_usage_stats(test_user_id)
            print(f"   Job analyses after increment: {usage_stats.current_month_usage.job_analyses_count}")
            assert usage_stats.current_month_usage.job_analyses_count == initial_job_count + 1, f"Job analysis count should be {initial_job_count + 1}"
            print("   ✅ Job analysis tracking works!")
            
            # Test 4: Increment CV download usage
            print("\n4️⃣ Testing CV download usage increment...")
            await subscription_service.increment_usage(test_user_id, "cv_download")
            usage_stats = await subscription_service.get_usage_stats(test_user_id)
            print(f"   CV downloads after increment: {usage_stats.current_month_usage.cv_downloads_count}")
            assert usage_stats.current_month_usage.cv_downloads_count == 1, "CV download count should be 1"
            print("   ✅ CV download tracking works!")
            
            # Test 5: Check usage limits
            print("\n5️⃣ Testing usage limit checking...")
            
            # Test CV analysis limit (free tier: 3)
            can_proceed = await subscription_service.check_usage_limits(test_user_id, "cv_analysis")
            print(f"   Can proceed with CV analysis (1/3 used): {can_proceed}")
            assert can_proceed == True, "Should be able to proceed with CV analysis"
            
            # Add more CV analyses to test limit
            await subscription_service.increment_usage(test_user_id, "cv_analysis")
            await subscription_service.increment_usage(test_user_id, "cv_analysis")
            
            # Now at limit (3/3)
            can_proceed = await subscription_service.check_usage_limits(test_user_id, "cv_analysis")
            print(f"   Can proceed with CV analysis (3/3 used): {can_proceed}")
            assert can_proceed == False, "Should NOT be able to proceed with CV analysis at limit"
            print("   ✅ CV analysis limit checking works!")
            
            # Test job analysis limit (free tier: 1)
            can_proceed = await subscription_service.check_usage_limits(test_user_id, "job_analysis")
            print(f"   Can proceed with job analysis (1/1 used): {can_proceed}")
            assert can_proceed == False, "Should NOT be able to proceed with job analysis at limit"
            print("   ✅ Job analysis limit checking works!")
            
            # Test 6: Final usage stats
            print("\n6️⃣ Final usage statistics...")
            usage_stats = await subscription_service.get_usage_stats(test_user_id)
            print(f"   Final CV analyses: {usage_stats.current_month_usage.cv_analyses_count}")
            print(f"   Final job analyses: {usage_stats.current_month_usage.job_analyses_count}")
            print(f"   Final CV downloads: {usage_stats.current_month_usage.cv_downloads_count}")
            print(f"   Subscription limits: {usage_stats.subscription_limits}")
            print(f"   Usage percentages: {usage_stats.usage_percentage}")
            print(f"   Days until reset: {usage_stats.days_until_reset}")
            
            print("\n🎉 All usage tracking tests passed!")
            
        except Exception as e:
            print(f"\n❌ Test failed with error: {str(e)}")
            import traceback
            traceback.print_exc()
            
        finally:
            # Clean up test data
            print("\n🧹 Cleaning up test data...")
            try:
                # Delete the test usage tracking record
                query = select(UsageTracking).where(UsageTracking.user_id == test_user_id)
                result = await db.execute(query)
                usage_record = result.scalar_one_or_none()
                
                if usage_record:
                    await db.delete(usage_record)
                    await db.commit()
                    print("   ✅ Test data cleaned up")
                else:
                    print("   ℹ️ No test data to clean up")
                    
            except Exception as cleanup_error:
                print(f"   ⚠️ Cleanup error: {cleanup_error}")
        
        break  # Exit the async generator

if __name__ == "__main__":
    print("🚀 Starting Usage Tracking Tests...")
    asyncio.run(test_usage_tracking())
