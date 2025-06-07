"""
Admin service for managing users, CVs, and subscriptions
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, text
from sqlalchemy.orm import selectinload

from models.user import User, CV
from models.subscription import UserSubscription
from schemas.admin import (
    DashboardMetrics, AdminUserRead, AdminCVRead, AdminSubscriptionRead,
    UserSearchFilter, CVSearchFilter, SubscriptionSearchFilter,
    PaginatedUsersResponse, PaginatedCVsResponse, PaginatedSubscriptionsResponse
)


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def get_subscription_plan_name(self, user) -> str:
        """Get the subscription plan name for a user"""
        # Check if user has any active subscriptions
        if hasattr(user, 'subscriptions') and user.subscriptions:
            for subscription in user.subscriptions:
                if subscription.is_active and subscription.end_date > datetime.now(timezone.utc).date():
                    # Return the actual plan name from the database
                    if hasattr(subscription, 'plan') and subscription.plan:
                        return subscription.plan.name
                    return "Unknown"

        # Default to Free if no active subscription
        return "Free"

    async def get_dashboard_metrics(self) -> DashboardMetrics:
        """Get dashboard metrics for admin overview"""
        # Total users
        total_users_result = await self.db.execute(select(func.count(User.id)))
        total_users = total_users_result.scalar() or 0

        # Active users (verified and active)
        active_users_result = await self.db.execute(
            select(func.count(User.id)).where(
                and_(User.is_active == True, User.is_verified == True)
            )
        )
        active_users = active_users_result.scalar() or 0

        # Total CVs
        total_cvs_result = await self.db.execute(select(func.count(CV.id)))
        total_cvs = total_cvs_result.scalar() or 0

        # Total subscriptions
        total_subs_result = await self.db.execute(select(func.count(UserSubscription.id)))
        total_subscriptions = total_subs_result.scalar() or 0

        # Active subscriptions
        active_subs_result = await self.db.execute(
            select(func.count(UserSubscription.id)).where(
                and_(
                    UserSubscription.is_active == True,
                    UserSubscription.end_date > datetime.now(timezone.utc).date()
                )
            )
        )
        active_subscriptions = active_subs_result.scalar() or 0

        # Monthly revenue (current month) - simplified calculation
        # For now, we'll calculate based on active subscriptions
        # Premium = $10/month, Pro = $20/month (example pricing)
        premium_count_result = await self.db.execute(
            select(func.count(UserSubscription.id)).where(
                and_(
                    UserSubscription.is_active == True,
                    UserSubscription.plan_id == 2,  # Premium
                    UserSubscription.end_date > datetime.now(timezone.utc).date()
                )
            )
        )
        premium_count = premium_count_result.scalar() or 0

        pro_count_result = await self.db.execute(
            select(func.count(UserSubscription.id)).where(
                and_(
                    UserSubscription.is_active == True,
                    UserSubscription.plan_id == 3,  # Pro
                    UserSubscription.end_date > datetime.now(timezone.utc).date()
                )
            )
        )
        pro_count = pro_count_result.scalar() or 0

        # Calculate estimated monthly revenue (example pricing)
        monthly_revenue = float((premium_count * 10) + (pro_count * 20))

        # Recent registrations (last 30 days)
        # Note: User model may not have created_at field, so we'll set this to 0 for now
        # TODO: Add created_at field to User model or use alternative tracking
        recent_registrations = 0

        # Recent CV uploads (last 30 days) - using created_at if available
        # Note: CV model doesn't have created_at, so we'll use a placeholder
        recent_cv_uploads = 0  # TODO: Add created_at to CV model

        return DashboardMetrics(
            total_users=total_users,
            active_users=active_users,
            total_cvs=total_cvs,
            total_subscriptions=total_subscriptions,
            active_subscriptions=active_subscriptions,
            monthly_revenue=monthly_revenue,
            recent_registrations=recent_registrations,
            recent_cv_uploads=recent_cv_uploads
        )

    async def get_users_paginated(
        self, filters: UserSearchFilter
    ) -> PaginatedUsersResponse:
        """Get paginated list of users with filters"""
        # Build query with subscription data
        query = select(User).options(
            selectinload(User.role),
            selectinload(User.cvs),
            selectinload(User.subscriptions)
        )
        
        # Apply filters
        conditions = []
        if filters.search:
            search_term = f"%{filters.search}%"
            conditions.append(
                or_(
                    User.email.ilike(search_term),
                    # Add name search if User model has name field
                )
            )
        
        if filters.role_id is not None:
            conditions.append(User.role_id == filters.role_id)
        
        if filters.is_active is not None:
            conditions.append(User.is_active == filters.is_active)
        
        if filters.is_verified is not None:
            conditions.append(User.is_verified == filters.is_verified)
        
        # Note: User model doesn't have created_at field, so we skip date filtering for now
        # TODO: Add created_at field to User model or use alternative date tracking
        if filters.created_after:
            pass  # Skip date filtering until created_at field is added

        if filters.created_before:
            pass  # Skip date filtering until created_at field is added

        if conditions:
            query = query.where(and_(*conditions))

        # Count total
        count_query = select(func.count(User.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))
        
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination
        offset = (filters.page - 1) * filters.page_size
        # Order by email since created_at is not available
        query = query.offset(offset).limit(filters.page_size).order_by(User.email)

        # Execute query
        result = await self.db.execute(query)
        users = result.scalars().all()

        # Convert to admin user read format
        admin_users = []
        for user in users:
            admin_user = AdminUserRead(
                id=user.id,
                email=user.email,
                is_active=user.is_active,
                is_superuser=user.is_superuser,
                is_verified=user.is_verified,
                role_id=user.role_id,
                created_at=None,  # User model doesn't have created_at field
                cv_count=len(user.cvs) if user.cvs else 0,
                subscription_status=self.get_subscription_plan_name(user),
                # TODO: Add last_login
            )
            admin_users.append(admin_user)

        total_pages = (total + filters.page_size - 1) // filters.page_size

        return PaginatedUsersResponse(
            items=admin_users,
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=total_pages
        )

    async def get_user_by_id(self, user_id: uuid.UUID) -> Optional[AdminUserRead]:
        """Get a specific user by ID"""
        query = select(User).options(
            selectinload(User.role),
            selectinload(User.cvs),
            selectinload(User.subscriptions)
        ).where(User.id == user_id)
        
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            return None
        
        return AdminUserRead(
            id=user.id,
            email=user.email,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            is_verified=user.is_verified,
            role_id=user.role_id,
            created_at=None,  # User model doesn't have created_at field
            cv_count=len(user.cvs) if user.cvs else 0,
            subscription_status=self.get_subscription_plan_name(user),
        )

    async def update_user(
        self, user_id: uuid.UUID, update_data: Dict[str, Any]
    ) -> Optional[AdminUserRead]:
        """Update user information"""
        query = select(User).where(User.id == user_id)
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            return None
        
        # Update fields
        for field, value in update_data.items():
            if hasattr(user, field):
                setattr(user, field, value)
        
        await self.db.commit()
        await self.db.refresh(user)
        
        return await self.get_user_by_id(user_id)

    async def delete_user(self, user_id: uuid.UUID) -> bool:
        """Delete a user and their associated data"""
        query = select(User).where(User.id == user_id)
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            return False
        
        # Delete associated CVs first
        await self.db.execute(
            text("DELETE FROM cvs WHERE user_id = :user_id"),
            {"user_id": str(user_id)}
        )
        
        # Delete user
        await self.db.delete(user)
        await self.db.commit()
        
        return True

    # CV Management Methods
    async def get_cvs_paginated(self, filters: CVSearchFilter) -> PaginatedCVsResponse:
        """Get paginated list of CVs with filters"""
        # Build query with user relationship
        query = select(CV).options(selectinload(CV.owner))

        # Apply filters
        conditions = []

        if filters.search:
            # Search in owner email
            conditions.append(
                CV.owner.has(User.email.ilike(f"%{filters.search}%"))
            )

        if filters.status:
            # For now, we'll assume all CVs are "active" since status field doesn't exist in model
            # This can be extended when status field is added to CV model
            pass

        if filters.uploaded_after:
            # CV model doesn't have created_at field, skip for now
            pass

        if filters.uploaded_before:
            # CV model doesn't have created_at field, skip for now
            pass

        if conditions:
            query = query.where(and_(*conditions))

        # Get total count
        count_query = select(func.count(CV.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))

        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        offset = (filters.page - 1) * filters.page_size
        query = query.offset(offset).limit(filters.page_size)

        # Order by ID descending (newest first)
        query = query.order_by(CV.id.desc())

        result = await self.db.execute(query)
        cvs = result.scalars().all()

        # Convert to admin CV read format
        admin_cvs = []
        for cv in cvs:
            admin_cv = AdminCVRead(
                id=cv.id,
                file_url=cv.file_url,
                cv_structure=cv.cv_structure,
                user_id=cv.user_id,
                owner_email=cv.owner.email if cv.owner else "Unknown",
                owner_name=None,  # User model doesn't have name field
                upload_date=datetime.now(timezone.utc),  # Placeholder since CV model doesn't have created_at
                file_size=None,  # Not stored in current model
                status="active"  # Default status
            )
            admin_cvs.append(admin_cv)

        total_pages = (total + filters.page_size - 1) // filters.page_size

        return PaginatedCVsResponse(
            items=admin_cvs,
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=total_pages
        )

    async def get_cv_by_id(self, cv_id: int) -> Optional[AdminCVRead]:
        """Get a specific CV by ID"""
        query = select(CV).options(selectinload(CV.owner)).where(CV.id == cv_id)
        result = await self.db.execute(query)
        cv = result.scalar_one_or_none()

        if not cv:
            return None

        return AdminCVRead(
            id=cv.id,
            file_url=cv.file_url,
            cv_structure=cv.cv_structure,
            user_id=cv.user_id,
            owner_email=cv.owner.email if cv.owner else "Unknown",
            owner_name=None,
            upload_date=datetime.now(timezone.utc),  # Placeholder
            file_size=None,
            status="active"
        )

    async def delete_cv(self, cv_id: int) -> bool:
        """Delete a CV"""
        query = select(CV).where(CV.id == cv_id)
        result = await self.db.execute(query)
        cv = result.scalar_one_or_none()

        if not cv:
            return False

        await self.db.delete(cv)
        await self.db.commit()
        return True

    # Subscription Management Methods
    async def get_subscriptions_paginated(self, filters: SubscriptionSearchFilter) -> PaginatedSubscriptionsResponse:
        """Get paginated list of subscriptions with filters"""
        # Import SubscriptionPlan here to avoid circular imports
        from models.subscription import SubscriptionPlan

        # Build query with user and plan relationships
        query = select(UserSubscription).options(
            selectinload(UserSubscription.user),
            selectinload(UserSubscription.plan)
        )

        # Apply filters
        conditions = []

        if filters.search:
            # Search in user email
            conditions.append(
                UserSubscription.user.has(User.email.ilike(f"%{filters.search}%"))
            )

        if filters.plan_id:
            conditions.append(UserSubscription.plan_id == filters.plan_id)

        if filters.is_active is not None:
            conditions.append(UserSubscription.is_active == filters.is_active)

        if filters.created_after:
            conditions.append(UserSubscription.created_at >= filters.created_after)

        if filters.created_before:
            conditions.append(UserSubscription.created_at <= filters.created_before)

        if conditions:
            query = query.where(and_(*conditions))

        # Get total count
        count_query = select(func.count(UserSubscription.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))

        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        offset = (filters.page - 1) * filters.page_size
        query = query.offset(offset).limit(filters.page_size)

        # Order by creation date descending (newest first)
        query = query.order_by(UserSubscription.created_at.desc())

        result = await self.db.execute(query)
        subscriptions = result.scalars().all()

        # Convert to admin subscription read format
        admin_subscriptions = []
        for subscription in subscriptions:
            # Calculate revenue based on plan pricing
            revenue = 0.0
            if subscription.plan:
                # Assume monthly billing for now
                revenue = subscription.plan.price_monthly

            admin_subscription = AdminSubscriptionRead(
                id=subscription.id,
                user_id=subscription.user_id,
                plan_id=subscription.plan_id,
                start_date=subscription.start_date,
                end_date=subscription.end_date,
                is_active=subscription.is_active,
                auto_renewal=subscription.auto_renewal,
                stripe_subscription_id=subscription.stripe_subscription_id,
                last_payment_date=subscription.last_payment_date,
                created_at=subscription.created_at,
                updated_at=subscription.updated_at,
                plan=subscription.plan,
                user_email=subscription.user.email if subscription.user else "Unknown",
                user_name=None,  # User model doesn't have name field
                plan_name=subscription.plan.name if subscription.plan else "Unknown",
                revenue=revenue
            )
            admin_subscriptions.append(admin_subscription)

        total_pages = (total + filters.page_size - 1) // filters.page_size

        return PaginatedSubscriptionsResponse(
            items=admin_subscriptions,
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=total_pages
        )

    async def get_subscription_by_id(self, subscription_id: int) -> Optional[AdminSubscriptionRead]:
        """Get a specific subscription by ID"""
        query = select(UserSubscription).options(
            selectinload(UserSubscription.user),
            selectinload(UserSubscription.plan)
        ).where(UserSubscription.id == subscription_id)

        result = await self.db.execute(query)
        subscription = result.scalar_one_or_none()

        if not subscription:
            return None

        revenue = 0.0
        if subscription.plan:
            revenue = subscription.plan.price_monthly

        return AdminSubscriptionRead(
            id=subscription.id,
            user_id=subscription.user_id,
            plan_id=subscription.plan_id,
            start_date=subscription.start_date,
            end_date=subscription.end_date,
            is_active=subscription.is_active,
            auto_renewal=subscription.auto_renewal,
            stripe_subscription_id=subscription.stripe_subscription_id,
            last_payment_date=subscription.last_payment_date,
            created_at=subscription.created_at,
            updated_at=subscription.updated_at,
            plan=subscription.plan,
            user_email=subscription.user.email if subscription.user else "Unknown",
            user_name=None,
            plan_name=subscription.plan.name if subscription.plan else "Unknown",
            revenue=revenue
        )

    async def update_subscription(self, subscription_id: int, update_data: dict) -> bool:
        """Update a subscription"""
        query = select(UserSubscription).where(UserSubscription.id == subscription_id)
        result = await self.db.execute(query)
        subscription = result.scalar_one_or_none()

        if not subscription:
            return False

        for field, value in update_data.items():
            if hasattr(subscription, field):
                setattr(subscription, field, value)

        subscription.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        return True

    async def cancel_subscription(self, subscription_id: int) -> bool:
        """Cancel a subscription"""
        return await self.update_subscription(subscription_id, {
            'is_active': False,
            'auto_renewal': False,
            'end_date': datetime.now(timezone.utc).date()
        })

    # Subscription Plan Management Methods
    async def get_subscription_plans(self) -> List[dict]:
        """Get all subscription plans"""
        from models.subscription import SubscriptionPlan

        query = select(SubscriptionPlan).order_by(SubscriptionPlan.price_monthly.asc())
        result = await self.db.execute(query)
        plans = result.scalars().all()

        return [
            {
                'id': plan.id,
                'name': plan.name,
                'tier': plan.tier.value if hasattr(plan.tier, 'value') else str(plan.tier),
                'price_monthly': plan.price_monthly,
                'price_yearly': plan.price_yearly,
                'cv_analyses_per_month': plan.cv_analyses_per_month or -1,  # Convert None to -1 for unlimited
                'job_analyses_per_month': plan.job_analyses_per_month or -1,  # Convert None to -1 for unlimited
                'cv_storage_limit': plan.cv_storage_limit or -1,  # Convert None to -1 for unlimited
                'advanced_analytics': plan.advanced_analytics,
                'priority_support': plan.priority_support,
                'custom_templates': plan.custom_templates,
                'api_access': plan.api_access,
                'is_active': plan.is_active,
                'created_at': plan.created_at.isoformat() if plan.created_at else None,
                'updated_at': plan.created_at.isoformat() if plan.created_at else None  # Use created_at since updated_at doesn't exist
            }
            for plan in plans
        ]

    async def create_subscription_plan(self, plan_data: dict) -> dict:
        """Create a new subscription plan"""
        from models.subscription import SubscriptionPlan, SubscriptionTier

        # Convert -1 to None for unlimited values
        cv_analyses = plan_data['cv_analyses_per_month'] if plan_data['cv_analyses_per_month'] != -1 else None
        job_analyses = plan_data['job_analyses_per_month'] if plan_data['job_analyses_per_month'] != -1 else None
        cv_storage = plan_data['cv_storage_limit'] if plan_data['cv_storage_limit'] != -1 else None

        # Convert tier string to enum
        tier_value = plan_data['tier'].upper()
        if hasattr(SubscriptionTier, tier_value):
            tier = getattr(SubscriptionTier, tier_value)
        else:
            # If tier doesn't exist in enum, use the string value
            tier = plan_data['tier']

        new_plan = SubscriptionPlan(
            name=plan_data['name'],
            tier=tier,
            price_monthly=plan_data['price_monthly'],
            price_yearly=plan_data['price_yearly'],
            cv_analyses_per_month=cv_analyses,
            job_analyses_per_month=job_analyses,
            cv_storage_limit=cv_storage,
            advanced_analytics=plan_data.get('advanced_analytics', False),
            priority_support=plan_data.get('priority_support', False),
            custom_templates=plan_data.get('custom_templates', False),
            api_access=plan_data.get('api_access', False),
            is_active=plan_data.get('is_active', True)
        )

        self.db.add(new_plan)
        await self.db.commit()
        await self.db.refresh(new_plan)

        return {
            'id': new_plan.id,
            'name': new_plan.name,
            'tier': new_plan.tier.value if hasattr(new_plan.tier, 'value') else str(new_plan.tier),
            'price_monthly': new_plan.price_monthly,
            'price_yearly': new_plan.price_yearly,
            'cv_analyses_per_month': new_plan.cv_analyses_per_month or -1,  # Convert None to -1 for unlimited
            'job_analyses_per_month': new_plan.job_analyses_per_month or -1,  # Convert None to -1 for unlimited
            'cv_storage_limit': new_plan.cv_storage_limit or -1,  # Convert None to -1 for unlimited
            'advanced_analytics': new_plan.advanced_analytics,
            'priority_support': new_plan.priority_support,
            'custom_templates': new_plan.custom_templates,
            'api_access': new_plan.api_access,
            'is_active': new_plan.is_active,
            'created_at': new_plan.created_at.isoformat() if new_plan.created_at else None,
            'updated_at': new_plan.created_at.isoformat() if new_plan.created_at else None  # Use created_at since updated_at doesn't exist
        }

    async def update_subscription_plan(self, plan_id: int, update_data: dict) -> bool:
        """Update a subscription plan"""
        from models.subscription import SubscriptionPlan, SubscriptionTier

        query = select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id)
        result = await self.db.execute(query)
        plan = result.scalar_one_or_none()

        if not plan:
            return False

        for field, value in update_data.items():
            if hasattr(plan, field):
                # Handle special conversions
                if field == 'tier' and isinstance(value, str):
                    # Convert tier string to enum
                    tier_value = value.upper()
                    if hasattr(SubscriptionTier, tier_value):
                        value = getattr(SubscriptionTier, tier_value)
                elif field in ['cv_analyses_per_month', 'job_analyses_per_month', 'cv_storage_limit']:
                    # Convert -1 to None for unlimited values
                    value = value if value != -1 else None

                setattr(plan, field, value)

        # Note: SubscriptionPlan model doesn't have updated_at field
        await self.db.commit()
        return True

    async def delete_subscription_plan(self, plan_id: int) -> bool:
        """Delete a subscription plan (soft delete by setting is_active=False)"""
        return await self.update_subscription_plan(plan_id, {'is_active': False})

    async def get_plan_usage_stats(self, plan_id: int) -> dict:
        """Get usage statistics for a specific plan"""
        # Count active subscriptions for this plan
        active_subs_result = await self.db.execute(
            select(func.count(UserSubscription.id)).where(
                and_(
                    UserSubscription.plan_id == plan_id,
                    UserSubscription.is_active == True
                )
            )
        )
        active_subscriptions = active_subs_result.scalar() or 0

        # Calculate monthly revenue
        from models.subscription import SubscriptionPlan
        plan_result = await self.db.execute(
            select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id)
        )
        plan = plan_result.scalar_one_or_none()

        monthly_revenue = 0.0
        if plan:
            monthly_revenue = float(active_subscriptions * plan.price_monthly)

        return {
            'plan_id': plan_id,
            'active_subscriptions': active_subscriptions,
            'monthly_revenue': monthly_revenue,
            'plan_name': plan.name if plan else 'Unknown'
        }


# Dependency to get admin service
from fastapi import Depends
from core.database import get_async_db

async def get_admin_service(db: AsyncSession = Depends(get_async_db)) -> AdminService:
    return AdminService(db)
