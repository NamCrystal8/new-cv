"""Schemas package for the CV application"""

from .user import UserRead, UserCreate, UserUpdate
from .role import RoleRead, RoleCreate, RoleUpdate
from .cv import CVRead, CVCreate, CVBase
from .subscription import (
    SubscriptionPlanRead, SubscriptionPlanCreate, UserSubscriptionRead,
    UserSubscriptionCreate, UsageStatsResponse, AnalyticsOverview,
    CVAnalysisHistoryRead
)
from .common import (
    MsgPayload, CVInput, CVWeaknessRequest,
    CVWeaknessResponse, CVEnhancementRequest
)
from .admin import (
    DashboardMetrics, AdminUserRead, UserUpdateAdmin, BulkUserAction,
    AdminCVRead, CVUpdateAdmin, BulkCVAction, AdminSubscriptionRead,
    SubscriptionUpdateAdmin, UserSearchFilter, CVSearchFilter,
    SubscriptionSearchFilter, PaginatedUsersResponse, PaginatedCVsResponse,
    PaginatedSubscriptionsResponse, AdminAnalyticsOverview
)

__all__ = [
    "UserRead", "UserCreate", "UserUpdate",
    "RoleRead", "RoleCreate", "RoleUpdate",
    "CVRead", "CVCreate", "CVBase",
    "SubscriptionPlanRead", "SubscriptionPlanCreate", "UserSubscriptionRead",
    "UserSubscriptionCreate", "UsageStatsResponse", "AnalyticsOverview",
    "CVAnalysisHistoryRead",
    "MsgPayload", "CVInput", "CVWeaknessRequest",
    "CVWeaknessResponse", "CVEnhancementRequest",
    "DashboardMetrics", "AdminUserRead", "UserUpdateAdmin", "BulkUserAction",
    "AdminCVRead", "CVUpdateAdmin", "BulkCVAction", "AdminSubscriptionRead",
    "SubscriptionUpdateAdmin", "UserSearchFilter", "CVSearchFilter",
    "SubscriptionSearchFilter", "PaginatedUsersResponse", "PaginatedCVsResponse",
    "PaginatedSubscriptionsResponse", "AdminAnalyticsOverview"
]
