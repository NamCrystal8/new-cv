"""
Subscription management routes
"""
import uuid
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload

from core.database import get_async_db
from core.security import current_active_user
from models.user import User
from models.subscription import (
    SubscriptionPlan, UserSubscription, UsageTracking, 
    CVAnalysisHistory
)
from schemas.subscription import (
    SubscriptionPlanRead, UserSubscriptionRead, UserSubscriptionCreate,
    UserSubscriptionUpdate, UsageStatsResponse, AnalyticsOverview,
    SubscriptionUpgradeRequest, SubscriptionStatus, CVAnalysisHistoryRead
)
from services.subscription_service import SubscriptionService, get_subscription_service

router = APIRouter(prefix="/subscription", tags=["subscription"])


@router.get("/plans", response_model=List[SubscriptionPlanRead])
async def get_subscription_plans(db: AsyncSession = Depends(get_async_db)):
    """Get all available subscription plans"""
    result = await db.execute(
        select(SubscriptionPlan)
        .where(SubscriptionPlan.is_active == True)
        .order_by(SubscriptionPlan.price_monthly)
    )
    plans = result.scalars().all()
    return plans


@router.get("/current", response_model=Optional[UserSubscriptionRead])
async def get_current_subscription(
    user: User = Depends(current_active_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service)
):
    """Get user's current subscription"""
    subscription = await subscription_service.get_user_subscription(user.id)
    return subscription


@router.get("/usage", response_model=UsageStatsResponse)
async def get_usage_stats(
    user: User = Depends(current_active_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service)
):
    """Get user's usage statistics"""
    return await subscription_service.get_usage_stats(user.id)


@router.get("/analytics", response_model=AnalyticsOverview)
async def get_analytics_overview(
    user: User = Depends(current_active_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service),
    db: AsyncSession = Depends(get_async_db)
):
    """Get analytics overview (Premium/Pro feature)"""
    # Check if user has premium subscription
    subscription = await subscription_service.get_user_subscription(user.id)
    if not subscription or not subscription.plan.advanced_analytics:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Advanced analytics requires Premium or Pro subscription"
        )
    
    return await subscription_service.get_analytics_overview(user.id)


@router.post("/upgrade", response_model=dict)
async def upgrade_subscription(
    upgrade_request: SubscriptionUpgradeRequest,
    user: User = Depends(current_active_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service),
    db: AsyncSession = Depends(get_async_db)
):
    """Upgrade user subscription (demo version - no payment processing)"""
    # Get the target plan
    result = await db.execute(
        select(SubscriptionPlan).where(
            SubscriptionPlan.tier == upgrade_request.target_tier
        )
    )
    target_plan = result.scalar_one_or_none()
    
    if not target_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription plan not found"
        )
      # For demo purposes, simulate successful upgrade
    try:
        # Update or create user subscription
        current_subscription = await subscription_service.get_user_subscription(user.id)
        
        if current_subscription:
            # Update existing subscription
            current_subscription.plan_id = target_plan.id
            current_subscription.is_active = True
            current_subscription.start_date = date.today()
            # Set end date to one month from now (or one year for yearly billing)
            if upgrade_request.billing_cycle == "yearly":
                current_subscription.end_date = date.today().replace(year=date.today().year + 1)
            else:
                # Calculate next month safely
                current_date = date.today()
                if current_date.month == 12:
                    current_subscription.end_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_subscription.end_date = current_date.replace(month=current_date.month + 1)
            
            db.add(current_subscription)
        else:
            # Create new subscription
            end_date = date.today()
            if upgrade_request.billing_cycle == "yearly":
                end_date = end_date.replace(year=end_date.year + 1)
            else:
                # Calculate next month safely
                if end_date.month == 12:
                    end_date = end_date.replace(year=end_date.year + 1, month=1)
                else:
                    end_date = end_date.replace(month=end_date.month + 1)
                    new_subscription = UserSubscription(
                user_id=user.id,
                plan_id=target_plan.id,
                start_date=date.today(),
                end_date=end_date,
                is_active=True,
                auto_renewal=True
            )
            db.add(new_subscription)
        
        await db.commit()
        
        return {
            "success": True,
            "message": f"Successfully upgraded to {target_plan.name}!",
            "plan_name": target_plan.name,
            "tier": target_plan.tier,
            "billing_cycle": upgrade_request.billing_cycle,
            "price": target_plan.price_monthly if upgrade_request.billing_cycle == "monthly" else target_plan.price_yearly
        }
        
    except Exception as e:
        await db.rollback()
        print(f"Error upgrading subscription: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upgrade subscription: {str(e)}"
        )


@router.get("/history", response_model=List[CVAnalysisHistoryRead])
async def get_analysis_history(
    limit: int = 20,
    offset: int = 0,
    analysis_type: Optional[str] = None,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get user's analysis history"""
    query = select(CVAnalysisHistory).where(CVAnalysisHistory.user_id == user.id)
    
    if analysis_type:
        query = query.where(CVAnalysisHistory.analysis_type == analysis_type)
    
    query = query.order_by(desc(CVAnalysisHistory.created_at)).offset(offset).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/check-limits/{analysis_type}")
async def check_usage_limits(
    analysis_type: str,
    user: User = Depends(current_active_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service)
):
    """Check if user can perform the requested analysis"""
    can_proceed = await subscription_service.check_usage_limits(user.id, analysis_type)
    
    if not can_proceed:
        usage_stats = await subscription_service.get_usage_stats(user.id)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": f"Usage limit exceeded for {analysis_type}",
                "usage_stats": usage_stats,
                "upgrade_required": True
            }
        )
    
    return {"can_proceed": True}


@router.get("/status", response_model=dict)
async def get_subscription_status(
    user: User = Depends(current_active_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service)
):
    """Get comprehensive subscription status"""
    subscription = await subscription_service.get_user_subscription(user.id)
    usage_stats_response = await subscription_service.get_usage_stats(user.id)
    
    # Transform usage stats to match frontend interface
    current_usage = usage_stats_response.current_month_usage
    limits = usage_stats_response.subscription_limits
    
    # Calculate remaining counts
    cv_limit = limits.get("cv_analyses", 3)  # Default to free tier limit
    job_limit = limits.get("job_analyses", 1)  # Default to free tier limit

    # Handle None (unlimited) vs numeric limits
    if cv_limit is None:
        cv_remaining = 999999  # Unlimited
    else:
        cv_remaining = max(0, cv_limit - current_usage.cv_analyses_count)

    if job_limit is None:
        job_remaining = 999999  # Unlimited
    else:
        job_remaining = max(0, job_limit - current_usage.job_analyses_count)
    
    # Format dates
    from datetime import datetime, date
    today = date.today()
    first_day = today.replace(day=1)
    
    # Calculate next month first day
    if today.month == 12:
        next_month = today.replace(year=today.year + 1, month=1, day=1)
    else:
        next_month = today.replace(month=today.month + 1, day=1)
    
    # Calculate CV storage usage and remaining
    cv_download_limit = limits.get("cv_downloads", 5)  # Default to free tier limit

    if cv_download_limit is None:
        cv_download_remaining = 999999  # Unlimited
    else:
        cv_download_remaining = max(0, cv_download_limit - current_usage.cv_downloads_count)

    usage_stats = {
        "cv_analyses_used": current_usage.cv_analyses_count,
        "job_analyses_used": current_usage.job_analyses_count,
        "cvs_stored": current_usage.cv_downloads_count,  # Use cv_downloads_count as cvs_stored
        "cv_analyses_remaining": cv_remaining,
        "job_analyses_remaining": job_remaining,
        "cv_storage_remaining": cv_download_remaining,
        "billing_period_start": first_day.isoformat(),
        "billing_period_end": next_month.isoformat()
    }
    
    status_info = {
        "has_subscription": subscription is not None,
        "current_tier": subscription.plan.name if subscription else "Free",
        "usage_stats": usage_stats,
        "features_available": {
            "advanced_analytics": subscription.plan.advanced_analytics if subscription else False,
            "priority_support": subscription.plan.priority_support if subscription else False,
            "custom_templates": subscription.plan.custom_templates if subscription else False,
            "api_access": subscription.plan.api_access if subscription else False,
        }
    }
    
    return status_info
