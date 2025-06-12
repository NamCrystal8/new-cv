"""
Enhanced models for subscription system and data analytics
"""
import uuid
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from sqlalchemy import String, Boolean, ForeignKey, Integer, JSON, DateTime, Date, Text, Enum as SQLEnum, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base
import enum


class SubscriptionTier(str, enum.Enum):
    FREE = "FREE"
    BASIC = "BASIC"
    PREMIUM = "PREMIUM"
    PRO = "PRO"
    BUSINESS = "BUSINESS"
    ENTERPRISE = "ENTERPRISE"
    ULTIMATE = "ULTIMATE"


class AnalysisType(str, enum.Enum):
    CV_WEAKNESS = "cv_weakness"
    JOB_MATCHING = "job_matching"
    CV_OPTIMIZATION = "cv_optimization"
    CV_ANALYSIS = "cv_analysis"
    JOB_DESCRIPTION_ANALYSIS = "job_description_analysis"


class SubscriptionPlan(Base):
    """Subscription plans configuration"""
    __tablename__ = "subscription_plans"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)  # FREE, PREMIUM, PRO
    tier: Mapped[SubscriptionTier] = mapped_column(SQLEnum(SubscriptionTier), nullable=False)
    price_monthly: Mapped[float] = mapped_column(Float, default=0.0)
    price_yearly: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Feature limits
    cv_analyses_per_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # None = unlimited
    job_analyses_per_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cv_storage_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Feature access
    advanced_analytics: Mapped[bool] = mapped_column(Boolean, default=False)
    priority_support: Mapped[bool] = mapped_column(Boolean, default=False)
    custom_templates: Mapped[bool] = mapped_column(Boolean, default=False)
    api_access: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class UserSubscription(Base):
    """User subscription tracking"""
    __tablename__ = "user_subscriptions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"), nullable=False)
    plan_id: Mapped[int] = mapped_column(ForeignKey("subscription_plans.id"), nullable=False)
    
    # Subscription details
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_renewal: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Payment tracking
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    last_payment_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="subscriptions")
    plan: Mapped["SubscriptionPlan"] = relationship("SubscriptionPlan")


class UsageTracking(Base):
    """Track user usage for billing and analytics"""
    __tablename__ = "usage_tracking"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"), nullable=False)
    
    # Usage counters (reset monthly)
    cv_analyses_count: Mapped[int] = mapped_column(Integer, default=0)
    job_analyses_count: Mapped[int] = mapped_column(Integer, default=0)
    cv_downloads_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Tracking period
    tracking_month: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-12
    tracking_year: Mapped[int] = mapped_column(Integer, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship("User")


class CVAnalysisHistory(Base):
    """Store CV analysis results for analytics and subscription features"""
    __tablename__ = "cv_analysis_history"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"), nullable=False)
    cv_id: Mapped[Optional[int]] = mapped_column(ForeignKey("cvs.id"), nullable=True)
    
    # Analysis metadata
    analysis_type: Mapped[AnalysisType] = mapped_column(SQLEnum(AnalysisType), nullable=False)
    analysis_version: Mapped[str] = mapped_column(String(50), default="1.0")
    
    # CV analysis results
    weaknesses: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    recommendations: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    section_completeness: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Job matching results (if applicable)
    job_description_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # For caching
    skill_matches: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    missing_skills: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    experience_analysis: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    overall_grade: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Course recommendations
    recommended_courses: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship("User")
    cv: Mapped[Optional["CV"]] = relationship("CV")
