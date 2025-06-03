"""
Subscription service for managing user subscriptions, usage tracking, and billing
"""
import uuid
from datetime import datetime, date, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, extract, func, desc
from sqlalchemy.orm import selectinload
from fastapi import Depends
import hashlib
import calendar

from core.database import get_async_db
from models.user import User, CV
from models.subscription import (
    SubscriptionPlan, UserSubscription, UsageTracking, CVAnalysisHistory,
    SubscriptionTier, AnalysisType
)
from schemas.subscription import (
    UsageStatsResponse, AnalyticsOverview, SubscriptionStatus
)


class SubscriptionService:
    """Service for managing subscriptions and usage tracking"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_user_subscription(self, user_id: uuid.UUID) -> Optional[UserSubscription]:
        """Get user's current active subscription"""
        result = await self.db.execute(
            select(UserSubscription)
            .options(selectinload(UserSubscription.plan))
            .where(
                and_(
                    UserSubscription.user_id == user_id,
                    UserSubscription.is_active == True,
                    UserSubscription.end_date.is_(None) | 
                    (UserSubscription.end_date >= date.today())
                )
            )
            .order_by(desc(UserSubscription.created_at))
        )
        return result.scalar_one_or_none()
    
    async def get_or_create_usage_tracking(self, user_id: uuid.UUID) -> UsageTracking:
        """Get or create usage tracking for current month"""
        current_date = datetime.now()
        month = current_date.month
        year = current_date.year
        
        result = await self.db.execute(
            select(UsageTracking).where(
                and_(
                    UsageTracking.user_id == user_id,
                    UsageTracking.tracking_month == month,
                    UsageTracking.tracking_year == year
                )
            )
        )
        usage = result.scalar_one_or_none()
        
        if not usage:
            usage = UsageTracking(
                user_id=user_id,
                tracking_month=month,
                tracking_year=year
            )
            self.db.add(usage)
            await self.db.commit()
            await self.db.refresh(usage)
        
        return usage
    
    async def check_usage_limits(self, user_id: uuid.UUID, analysis_type: str) -> bool:
        """Check if user can perform the requested analysis based on their subscription"""
        subscription = await self.get_user_subscription(user_id)
        usage = await self.get_or_create_usage_tracking(user_id)
        
        if not subscription:
            # Free tier limits
            if analysis_type == "cv_analysis" and usage.cv_analyses_count >= 3:
                return False
            if analysis_type == "job_analysis" and usage.job_analyses_count >= 1:
                return False
            return True
        
        plan = subscription.plan
        
        # Check limits based on subscription plan
        if analysis_type == "cv_analysis":
            if plan.cv_analyses_per_month is not None and usage.cv_analyses_count >= plan.cv_analyses_per_month:
                return False
        elif analysis_type == "job_analysis":
            if plan.job_analyses_per_month is not None and usage.job_analyses_count >= plan.job_analyses_per_month:
                return False
        
        return True
    
    async def increment_usage(self, user_id: uuid.UUID, analysis_type: str):
        """Increment usage counter for the specified analysis type"""
        usage = await self.get_or_create_usage_tracking(user_id)
        
        if analysis_type == "cv_analysis":
            usage.cv_analyses_count += 1
        elif analysis_type == "job_analysis":
            usage.job_analyses_count += 1
        elif analysis_type == "cv_download":
            usage.cv_downloads_count += 1
        
        await self.db.commit()
    
    async def save_analysis_result(
        self, 
        user_id: uuid.UUID, 
        cv_id: Optional[int],
        analysis_type: AnalysisType,
        analysis_data: Dict[str, Any],
        job_description: Optional[str] = None
    ) -> CVAnalysisHistory:
        """Save analysis results for future reference and analytics"""
        
        # Create job description hash for caching
        job_hash = None
        if job_description:
            job_hash = hashlib.sha256(job_description.encode()).hexdigest()
        
        analysis = CVAnalysisHistory(
            user_id=user_id,
            cv_id=cv_id,
            analysis_type=analysis_type,
            job_description_hash=job_hash,
            **analysis_data
        )
        
        self.db.add(analysis)
        await self.db.commit()
        await self.db.refresh(analysis)
        return analysis
    
    async def track_user_interaction(
        self,
        user_id: uuid.UUID,
        analysis_id: int,
        interaction_type: str,
        recommendation_id: Optional[str] = None,
        section_modified: Optional[str] = None,
        old_content: Optional[str] = None,
        new_content: Optional[str] = None
    ):
        """Track user interactions with recommendations (placeholder for future functionality)"""
        # TODO: Implement user interactions tracking when UserInteractions model is created
        pass
    
    async def get_usage_stats(self, user_id: uuid.UUID) -> UsageStatsResponse:
        """Get detailed usage statistics for the user"""
        subscription = await self.get_user_subscription(user_id)
        usage = await self.get_or_create_usage_tracking(user_id)
        
        # Get subscription limits
        if subscription:
            limits = {
                "cv_analyses": subscription.plan.cv_analyses_per_month,
                "job_analyses": subscription.plan.job_analyses_per_month,
                "cv_downloads": None  # Usually unlimited
            }
        else:
            # Free tier limits
            limits = {
                "cv_analyses": 3,
                "job_analyses": 1,
                "cv_downloads": 5
            }
        
        # Calculate usage percentages
        usage_percentage = {}
        for key, limit in limits.items():
            if limit is not None:
                current_usage = getattr(usage, f"{key}_count", 0)
                usage_percentage[key] = (current_usage / limit) * 100
            else:
                usage_percentage[key] = 0.0
        
        # Calculate days until reset
        today = date.today()
        next_month = today.replace(day=28) + timedelta(days=4)
        next_month = next_month.replace(day=1)
        days_until_reset = (next_month - today).days
        
        return UsageStatsResponse(
            current_month_usage=usage,
            subscription_limits=limits,
            usage_percentage=usage_percentage,
            days_until_reset=days_until_reset
        )
    
    async def get_analytics_overview(self, user_id: uuid.UUID) -> AnalyticsOverview:
        """Get analytics overview for premium users"""
        # Total analyses
        total_result = await self.db.execute(
            select(func.count(CVAnalysisHistory.id))
            .where(CVAnalysisHistory.user_id == user_id)
        )
        total_analyses = total_result.scalar()
        
        # This month analyses
        current_month = datetime.now().month
        current_year = datetime.now().year
        month_result = await self.db.execute(
            select(func.count(CVAnalysisHistory.id))
            .where(
                and_(
                    CVAnalysisHistory.user_id == user_id,
                    extract('month', CVAnalysisHistory.created_at) == current_month,
                    extract('year', CVAnalysisHistory.created_at) == current_year
                )
            )
        )
        month_analyses = month_result.scalar()
        
        # Get recent analyses to extract skill gaps
        recent_analyses = await self.db.execute(
            select(CVAnalysisHistory)
            .where(CVAnalysisHistory.user_id == user_id)
            .order_by(desc(CVAnalysisHistory.created_at))
            .limit(10)
        )
        analyses = recent_analyses.scalars().all()
        
        # Extract skill gaps
        skill_gaps = set()
        for analysis in analyses:
            if analysis.missing_skills:
                missing = analysis.missing_skills.get('missing', [])
                skill_gaps.update(missing)
          # Count completed courses (placeholder for future functionality)
        courses_completed = 0
        
        # Calculate subscription value score (simplified)
        subscription_value = min(100.0, (total_analyses * 10) + (courses_completed * 20))
        
        return AnalyticsOverview(
            total_analyses=total_analyses,
            analyses_this_month=month_analyses,
            improvement_trends={},  # Could be enhanced with more complex analytics
            skill_gaps_identified=list(skill_gaps)[:10],  # Top 10 most common gaps
            courses_completed=courses_completed,
            subscription_value_score=subscription_value
        )
    
    async def create_default_subscription_plans(self):
        """Create default subscription plans if they don't exist"""
        # Check if plans already exist
        result = await self.db.execute(select(func.count(SubscriptionPlan.id)))
        if result.scalar() > 0:
            return
        
        plans = [
            SubscriptionPlan(
                name="Free",
                tier=SubscriptionTier.FREE,
                price_monthly=0.0,
                price_yearly=0.0,
                cv_analyses_per_month=3,
                job_analyses_per_month=1,
                cv_storage_limit=2,
                advanced_analytics=False,
                priority_support=False,
                custom_templates=False,
                api_access=False
            ),
            SubscriptionPlan(
                name="Premium",
                tier=SubscriptionTier.PREMIUM,
                price_monthly=9.99,
                price_yearly=99.99,
                cv_analyses_per_month=50,
                job_analyses_per_month=20,
                cv_storage_limit=10,
                advanced_analytics=True,
                priority_support=False,
                custom_templates=True,
                api_access=False
            ),
            SubscriptionPlan(
                name="Pro",
                tier=SubscriptionTier.PRO,
                price_monthly=19.99,
                price_yearly=199.99,
                cv_analyses_per_month=None,  # Unlimited
                job_analyses_per_month=None,  # Unlimited
                cv_storage_limit=None,  # Unlimited
                advanced_analytics=True,
                priority_support=True,
                custom_templates=True,
                api_access=True
            )
        ]
        
        for plan in plans:
            self.db.add(plan)
        
        await self.db.commit()
    
    async def get_cached_analysis(
        self, 
        user_id: uuid.UUID, 
        job_description_hash: str, 
        cv_id: Optional[int] = None
    ) -> Optional[CVAnalysisHistory]:
        """Get cached analysis result if available"""
        query = select(CVAnalysisHistory).where(
            and_(
                CVAnalysisHistory.user_id == user_id,
                CVAnalysisHistory.job_description_hash == job_description_hash,
                CVAnalysisHistory.analysis_type == AnalysisType.JOB_MATCHING
            )
        )
        
        if cv_id:
            query = query.where(CVAnalysisHistory.cv_id == cv_id)
        
        # Get most recent analysis within the last 24 hours
        recent_threshold = datetime.now() - timedelta(hours=24)
        query = query.where(CVAnalysisHistory.created_at >= recent_threshold)
        query = query.order_by(desc(CVAnalysisHistory.created_at))
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()


async def get_subscription_service(db: AsyncSession = Depends(get_async_db)) -> SubscriptionService:
    """Dependency to get subscription service"""
    return SubscriptionService(db)
