"""
Pydantic schemas for subscription system
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime, date
from subscription_models import SubscriptionTier, AnalysisType
import uuid


# Subscription Plan Schemas
class SubscriptionPlanBase(BaseModel):
    name: str
    tier: SubscriptionTier
    price_monthly: float = 0.0
    price_yearly: float = 0.0
    cv_analyses_per_month: Optional[int] = None
    job_analyses_per_month: Optional[int] = None
    cv_storage_limit: Optional[int] = None
    advanced_analytics: bool = False
    priority_support: bool = False
    custom_templates: bool = False
    api_access: bool = False


class SubscriptionPlanCreate(SubscriptionPlanBase):
    pass


class SubscriptionPlanRead(SubscriptionPlanBase):
    id: int
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


# User Subscription Schemas
class UserSubscriptionBase(BaseModel):
    plan_id: int
    start_date: date
    end_date: Optional[date] = None
    auto_renewal: bool = True


class UserSubscriptionCreate(UserSubscriptionBase):
    user_id: uuid.UUID


class UserSubscriptionRead(UserSubscriptionBase):
    id: int
    user_id: uuid.UUID
    is_active: bool
    stripe_subscription_id: Optional[str] = None
    last_payment_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    plan: SubscriptionPlanRead

    class Config:
        from_attributes = True


class UserSubscriptionUpdate(BaseModel):
    plan_id: Optional[int] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    auto_renewal: Optional[bool] = None


# Usage Tracking Schemas
class UsageTrackingRead(BaseModel):
    id: int
    user_id: uuid.UUID
    cv_analyses_count: int
    job_analyses_count: int
    cv_downloads_count: int
    tracking_month: int
    tracking_year: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UsageStatsResponse(BaseModel):
    current_month_usage: UsageTrackingRead
    subscription_limits: Dict[str, Optional[int]]
    usage_percentage: Dict[str, float]
    days_until_reset: int


# CV Analysis History Schemas
class CVAnalysisHistoryBase(BaseModel):
    analysis_type: AnalysisType
    analysis_version: str = "1.0"
    weaknesses: Optional[Dict[str, Any]] = None
    recommendations: Optional[Dict[str, Any]] = None
    section_completeness: Optional[Dict[str, Any]] = None
    job_description_hash: Optional[str] = None
    skill_matches: Optional[Dict[str, Any]] = None
    missing_skills: Optional[Dict[str, Any]] = None
    experience_analysis: Optional[Dict[str, Any]] = None
    overall_grade: Optional[Dict[str, Any]] = None
    recommended_courses: Optional[Dict[str, Any]] = None


class CVAnalysisHistoryCreate(CVAnalysisHistoryBase):
    user_id: uuid.UUID
    cv_id: Optional[int] = None


class CVAnalysisHistoryRead(CVAnalysisHistoryBase):
    id: int
    user_id: uuid.UUID
    cv_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# User interaction schemas removed - functionality not needed in clean subscription system


# Analytics Schemas
class AnalyticsOverview(BaseModel):
    total_analyses: int
    analyses_this_month: int
    improvement_trends: Dict[str, Any]
    skill_gaps_identified: List[str]
    courses_completed: int
    subscription_value_score: float


class SkillTrendAnalysis(BaseModel):
    skill_name: str
    demand_trend: str  # "increasing", "stable", "decreasing"
    gap_frequency: int
    recommended_courses_count: int
    avg_completion_rate: float


# Subscription Management Schemas
class SubscriptionUpgradeRequest(BaseModel):
    target_tier: SubscriptionTier
    billing_cycle: str = "monthly"  # "monthly" or "yearly"


class BillingHistoryItem(BaseModel):
    date: datetime
    amount: float
    description: str
    status: str
    invoice_url: Optional[str] = None


class SubscriptionStatus(BaseModel):
    current_plan: SubscriptionPlanRead
    usage_stats: UsageStatsResponse
    billing_history: List[BillingHistoryItem]
    next_billing_date: Optional[date] = None
    can_upgrade: bool
    can_downgrade: bool
