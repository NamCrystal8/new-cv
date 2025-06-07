"""
Admin routes for managing users, CVs, and subscriptions
"""
import uuid
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_db
from core.security import current_admin_user
from models.user import User
from services.admin_service import get_admin_service
from schemas.admin import (
    DashboardMetrics, AdminUserRead, UserUpdateAdmin, BulkUserAction,
    UserSearchFilter, PaginatedUsersResponse, AdminAnalyticsOverview,
    CVSearchFilter, PaginatedCVsResponse, AdminCVRead,
    SubscriptionSearchFilter, PaginatedSubscriptionsResponse, AdminSubscriptionRead,
    SubscriptionUpdateAdmin, SubscriptionPlanCreate, SubscriptionPlanUpdate,
    SubscriptionPlanRead, PlanUsageStats
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Get dashboard metrics for admin overview"""
    return await admin_service.get_dashboard_metrics()


# User Management Routes
@router.get("/users", response_model=PaginatedUsersResponse)
async def get_users(
    search: str = Query(None, description="Search in email"),
    role_id: int = Query(None, description="Filter by role ID"),
    is_active: bool = Query(None, description="Filter by active status"),
    is_verified: bool = Query(None, description="Filter by verified status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Get paginated list of users with optional filters"""
    filters = UserSearchFilter(
        search=search,
        role_id=role_id,
        is_active=is_active,
        is_verified=is_verified,
        page=page,
        page_size=page_size
    )
    return await admin_service.get_users_paginated(filters)


@router.get("/users/{user_id}", response_model=AdminUserRead)
async def get_user(
    user_id: uuid.UUID,
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Get a specific user by ID"""
    user = await admin_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.patch("/users/{user_id}", response_model=AdminUserRead)
async def update_user(
    user_id: uuid.UUID,
    update_data: UserUpdateAdmin,
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Update user information"""
    # Convert to dict and remove None values
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields to update"
        )
    
    user = await admin_service.update_user(user_id, update_dict)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: uuid.UUID,
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Delete a user and their associated data"""
    success = await admin_service.delete_user(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return {"message": "User deleted successfully"}


@router.post("/users/bulk-action")
async def bulk_user_action(
    action_data: BulkUserAction,
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Perform bulk actions on multiple users"""
    if action_data.action not in ["activate", "deactivate", "delete"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Must be 'activate', 'deactivate', or 'delete'"
        )
    
    results = []
    for user_id in action_data.user_ids:
        try:
            if action_data.action == "activate":
                await admin_service.update_user(user_id, {"is_active": True})
                results.append({"user_id": user_id, "status": "activated"})
            elif action_data.action == "deactivate":
                await admin_service.update_user(user_id, {"is_active": False})
                results.append({"user_id": user_id, "status": "deactivated"})
            elif action_data.action == "delete":
                success = await admin_service.delete_user(user_id)
                if success:
                    results.append({"user_id": user_id, "status": "deleted"})
                else:
                    results.append({"user_id": user_id, "status": "not_found"})
        except Exception as e:
            results.append({"user_id": user_id, "status": "error", "error": str(e)})
    
    return {"results": results}


# CV Management Routes
@router.get("/cvs", response_model=PaginatedCVsResponse)
async def get_cvs(
    search: str = Query(None, description="Search in owner email"),
    status: str = Query(None, description="Filter by CV status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Get paginated list of CVs with optional filters"""
    filters = CVSearchFilter(
        search=search,
        status=status,
        page=page,
        page_size=page_size
    )
    return await admin_service.get_cvs_paginated(filters)


@router.get("/cvs/{cv_id}", response_model=AdminCVRead)
async def get_cv(
    cv_id: int,
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Get a specific CV by ID"""
    cv = await admin_service.get_cv_by_id(cv_id)
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV not found"
        )
    return cv


@router.delete("/cvs/{cv_id}")
async def delete_cv(
    cv_id: int,
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Delete a CV"""
    success = await admin_service.delete_cv(cv_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV not found"
        )
    return {"message": "CV deleted successfully"}


# Subscription Management Routes
@router.get("/subscriptions", response_model=PaginatedSubscriptionsResponse)
async def get_subscriptions(
    search: str = Query(None, description="Search in user email"),
    plan_id: int = Query(None, description="Filter by plan ID"),
    is_active: bool = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Get paginated list of subscriptions with optional filters"""
    filters = SubscriptionSearchFilter(
        search=search,
        plan_id=plan_id,
        is_active=is_active,
        page=page,
        page_size=page_size
    )
    return await admin_service.get_subscriptions_paginated(filters)


@router.get("/subscriptions/{subscription_id}", response_model=AdminSubscriptionRead)
async def get_subscription(
    subscription_id: int,
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Get a specific subscription by ID"""
    subscription = await admin_service.get_subscription_by_id(subscription_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    return subscription


@router.patch("/subscriptions/{subscription_id}")
async def update_subscription(
    subscription_id: int,
    update_data: SubscriptionUpdateAdmin,
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Update subscription information"""
    success = await admin_service.update_subscription(
        subscription_id,
        update_data.model_dump(exclude_unset=True)
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    return {"message": "Subscription updated successfully"}


@router.post("/subscriptions/{subscription_id}/cancel")
async def cancel_subscription(
    subscription_id: int,
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Cancel a subscription"""
    success = await admin_service.cancel_subscription(subscription_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    return {"message": "Subscription cancelled successfully"}


# Subscription Plan Management Routes
@router.get("/plans", response_model=list[dict])
async def get_subscription_plans(
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Get all subscription plans"""
    plans = await admin_service.get_subscription_plans()
    return plans


@router.post("/plans", response_model=SubscriptionPlanRead)
async def create_subscription_plan(
    plan_data: SubscriptionPlanCreate,
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Create a new subscription plan"""
    plan = await admin_service.create_subscription_plan(plan_data.model_dump())
    return plan


@router.patch("/plans/{plan_id}")
async def update_subscription_plan(
    plan_id: int,
    update_data: SubscriptionPlanUpdate,
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Update a subscription plan"""
    success = await admin_service.update_subscription_plan(
        plan_id,
        update_data.model_dump(exclude_unset=True)
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription plan not found"
        )
    return {"message": "Subscription plan updated successfully"}


@router.delete("/plans/{plan_id}")
async def delete_subscription_plan(
    plan_id: int,
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Delete (deactivate) a subscription plan"""
    success = await admin_service.delete_subscription_plan(plan_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription plan not found"
        )
    return {"message": "Subscription plan deleted successfully"}


@router.get("/plans/{plan_id}/stats", response_model=PlanUsageStats)
async def get_plan_usage_stats(
    plan_id: int,
    admin_user: User = Depends(current_admin_user),
    admin_service = Depends(get_admin_service)
):
    """Get usage statistics for a specific plan"""
    stats = await admin_service.get_plan_usage_stats(plan_id)
    return stats


# Analytics Routes (placeholder for now)
@router.get("/analytics")
async def get_analytics(
    admin_user: User = Depends(current_admin_user)
):
    """Get comprehensive analytics overview - TODO: Implement"""
    return {"message": "Analytics coming soon"}


# System Health Routes
@router.get("/health")
async def admin_health_check(
    admin_user: User = Depends(current_admin_user)
):
    """Admin-only health check with detailed system information"""
    return {
        "status": "healthy",
        "admin_access": True,
        "admin_user": admin_user.email,
        "timestamp": "2024-01-01T00:00:00Z"  # TODO: Use actual timestamp
    }
