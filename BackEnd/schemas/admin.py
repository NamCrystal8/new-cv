"""
Admin-specific Pydantic schemas
"""
import uuid
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from .user import UserRead
from .cv import CVRead
from .subscription import UserSubscriptionRead, SubscriptionPlanRead


# Dashboard Metrics
class DashboardMetrics(BaseModel):
    total_users: int
    active_users: int
    total_cvs: int
    total_subscriptions: int
    active_subscriptions: int
    monthly_revenue: float
    recent_registrations: int  # Last 30 days
    recent_cv_uploads: int  # Last 30 days


# User Management
class AdminUserRead(UserRead):
    """Extended user read schema for admin with additional fields"""
    created_at: Optional[datetime] = None  # Optional since User model may not have this field
    last_login: Optional[datetime] = None
    cv_count: int = 0
    subscription_status: Optional[str] = None

    class Config:
        from_attributes = True


class UserUpdateAdmin(BaseModel):
    """Schema for admin to update user information"""
    email: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    role_id: Optional[int] = None


class BulkUserAction(BaseModel):
    """Schema for bulk user operations"""
    user_ids: List[uuid.UUID]
    action: str  # 'activate', 'deactivate', 'delete'


# CV Management
class AdminCVRead(CVRead):
    """Extended CV read schema for admin"""
    owner_email: str
    owner_name: Optional[str] = None
    upload_date: datetime
    file_size: Optional[int] = None
    status: str = "active"  # active, deleted, flagged
    
    class Config:
        from_attributes = True


class CVUpdateAdmin(BaseModel):
    """Schema for admin to update CV information"""
    status: Optional[str] = None  # active, deleted, flagged


class BulkCVAction(BaseModel):
    """Schema for bulk CV operations"""
    cv_ids: List[int]
    action: str  # 'approve', 'reject', 'delete'


# Subscription Management
class AdminSubscriptionRead(UserSubscriptionRead):
    """Extended subscription read schema for admin"""
    user_email: str
    user_name: Optional[str] = None
    plan_name: str
    revenue: float
    
    class Config:
        from_attributes = True


class SubscriptionUpdateAdmin(BaseModel):
    """Schema for admin to update subscription"""
    plan_id: Optional[int] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    auto_renewal: Optional[bool] = None


# Analytics and Reports
class UserAnalytics(BaseModel):
    """User analytics data"""
    registration_trend: Dict[str, int]  # Date -> count
    user_activity: Dict[str, int]  # Activity type -> count
    geographic_distribution: Dict[str, int]  # Country -> count


class CVAnalytics(BaseModel):
    """CV analytics data"""
    upload_trend: Dict[str, int]  # Date -> count
    template_usage: Dict[str, int]  # Template -> count
    file_size_distribution: Dict[str, int]  # Size range -> count


class SubscriptionAnalytics(BaseModel):
    """Subscription analytics data"""
    revenue_trend: Dict[str, float]  # Date -> revenue
    plan_distribution: Dict[str, int]  # Plan -> count
    churn_rate: float
    conversion_rate: float


class AdminAnalyticsOverview(BaseModel):
    """Complete analytics overview for admin"""
    dashboard_metrics: DashboardMetrics
    user_analytics: UserAnalytics
    cv_analytics: CVAnalytics
    subscription_analytics: SubscriptionAnalytics


# Search and Filter
class UserSearchFilter(BaseModel):
    """Search and filter parameters for users"""
    search: Optional[str] = None  # Search in name, email
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    created_after: Optional[date] = None
    created_before: Optional[date] = None
    page: int = 1
    page_size: int = 20


class CVSearchFilter(BaseModel):
    """Search and filter parameters for CVs"""
    search: Optional[str] = None  # Search in owner name, email
    status: Optional[str] = None
    uploaded_after: Optional[date] = None
    uploaded_before: Optional[date] = None
    page: int = 1
    page_size: int = 20


class SubscriptionSearchFilter(BaseModel):
    """Search and filter parameters for subscriptions"""
    search: Optional[str] = None  # Search in user name, email
    plan_id: Optional[int] = None
    is_active: Optional[bool] = None
    created_after: Optional[date] = None
    created_before: Optional[date] = None
    page: int = 1
    page_size: int = 20


# Paginated Responses
class PaginatedResponse(BaseModel):
    """Base paginated response"""
    total: int
    page: int
    page_size: int
    total_pages: int


class PaginatedUsersResponse(PaginatedResponse):
    """Paginated users response"""
    items: List[AdminUserRead]


class PaginatedCVsResponse(PaginatedResponse):
    """Paginated CVs response"""
    items: List[AdminCVRead]


class PaginatedSubscriptionsResponse(PaginatedResponse):
    """Paginated subscriptions response"""
    items: List[AdminSubscriptionRead]


# Activity Log
class ActivityLog(BaseModel):
    """Activity log entry"""
    id: int
    admin_user_id: uuid.UUID
    admin_email: str
    action: str
    target_type: str  # user, cv, subscription
    target_id: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True


# Subscription Plan Management Schemas
class SubscriptionPlanCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    tier: str = Field(..., min_length=1, max_length=50)
    price_monthly: float = Field(..., ge=0)
    price_yearly: float = Field(..., ge=0)
    cv_analyses_per_month: int = Field(..., ge=-1)  # -1 for unlimited
    job_analyses_per_month: int = Field(..., ge=-1)  # -1 for unlimited
    cv_storage_limit: int = Field(..., ge=-1)  # -1 for unlimited
    advanced_analytics: bool = False
    priority_support: bool = False
    custom_templates: bool = False
    api_access: bool = False
    is_active: bool = True

class SubscriptionPlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    tier: Optional[str] = Field(None, min_length=1, max_length=50)
    price_monthly: Optional[float] = Field(None, ge=0)
    price_yearly: Optional[float] = Field(None, ge=0)
    cv_analyses_per_month: Optional[int] = Field(None, ge=-1)
    job_analyses_per_month: Optional[int] = Field(None, ge=-1)
    cv_storage_limit: Optional[int] = Field(None, ge=-1)
    advanced_analytics: Optional[bool] = None
    priority_support: Optional[bool] = None
    custom_templates: Optional[bool] = None
    api_access: Optional[bool] = None
    is_active: Optional[bool] = None

class SubscriptionPlanRead(BaseModel):
    id: int
    name: str
    tier: str
    price_monthly: float
    price_yearly: float
    cv_analyses_per_month: int
    job_analyses_per_month: int
    cv_storage_limit: int
    advanced_analytics: bool
    priority_support: bool
    custom_templates: bool
    api_access: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

class PlanUsageStats(BaseModel):
    plan_id: int
    plan_name: str
    active_subscriptions: int
    monthly_revenue: float
