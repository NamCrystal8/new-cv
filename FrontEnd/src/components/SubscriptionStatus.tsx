import React from 'react';
import { Crown, Zap, Sparkles } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Badge } from './ui/badge';

interface SubscriptionStatusProps {
  className?: string;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ className }) => {
  const { status, loading, error } = useSubscription();

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-lg p-3 ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error || !status) {
    return null;
  }

  const getTierIcon = (tier: string) => {
    switch (tier.toUpperCase()) {
      case 'PRO':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'PREMIUM':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      default:
        return <Zap className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toUpperCase()) {
      case 'PRO':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'PREMIUM':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      default:
        return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    }
  };

  const usage = status.usage_stats;
  const cvUsagePercent = usage.cv_analyses_used > 0 ? 
    (usage.cv_analyses_used / (usage.cv_analyses_used + usage.cv_analyses_remaining)) * 100 : 0;
  const jobUsagePercent = usage.job_analyses_used > 0 ?
    (usage.job_analyses_used / (usage.job_analyses_used + usage.job_analyses_remaining)) * 100 : 0;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-3 space-y-3 ${className}`}>
      {/* Tier Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getTierIcon(status.current_tier)}
          <span className="font-medium text-gray-900 capitalize">
            {status.current_tier}
          </span>
        </div>
        <Badge 
          className={`text-white ${getTierColor(status.current_tier)} border-0`}
        >
          {status.current_tier.toUpperCase()}
        </Badge>
      </div>

      {/* Usage Stats */}
      <div className="space-y-2">
        {/* CV Analysis Usage */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>CV Analyses</span>
            <span>
              {usage.cv_analyses_used} / {usage.cv_analyses_used + usage.cv_analyses_remaining}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(cvUsagePercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Job Analysis Usage */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Job Analyses</span>
            <span>
              {usage.job_analyses_used} / {usage.job_analyses_used + usage.job_analyses_remaining}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(jobUsagePercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* CV Storage */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>CVs Stored</span>
            <span>
              {usage.cvs_stored} / {usage.cvs_stored + usage.cv_storage_remaining}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min((usage.cvs_stored / (usage.cvs_stored + usage.cv_storage_remaining)) * 100, 100)}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
