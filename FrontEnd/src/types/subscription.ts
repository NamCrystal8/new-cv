// Types for subscription management
export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'FREE' | 'PREMIUM' | 'PRO';
  price_monthly: number;
  price_yearly: number;
  cv_analyses_per_month: number;
  job_analyses_per_month: number;
  cv_storage_limit: number;
  advanced_analytics: boolean;
  priority_support: boolean;
  custom_templates: boolean;
  api_access: boolean;
  is_active: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  plan: SubscriptionPlan;
}

export interface UsageStats {
  cv_analyses_used: number;
  job_analyses_used: number;
  cvs_stored: number;
  cv_analyses_remaining: number;
  job_analyses_remaining: number;
  cv_storage_remaining: number;
  billing_period_start: string;
  billing_period_end: string;
}

export interface AnalyticsOverview {
  total_analyses: number;
  analyses_this_month: number;
  most_common_weaknesses: string[];
  improvement_trends: {
    month: string;
    score: number;
  }[];
  skill_gap_insights: {
    skill: string;
    frequency: number;
  }[];
}

export interface SubscriptionStatus {
  has_subscription: boolean;
  current_tier: string;
  usage_stats: UsageStats;
  features_available: {
    advanced_analytics: boolean;
    priority_support: boolean;
    custom_templates: boolean;
    api_access: boolean;
  };
}

export interface UpgradeRequest {
  target_tier: 'PREMIUM' | 'PRO';
  billing_cycle: 'monthly' | 'yearly';
}
