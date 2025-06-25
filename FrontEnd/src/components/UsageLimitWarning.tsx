import React from 'react';
import { AlertTriangle, Crown, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Link } from 'react-router-dom';

interface UsageLimitWarningProps {
  analysisType: string;
  usageStats: {
    cv_analyses_used: number;
    job_analyses_used: number;
    cvs_stored: number;
    cv_analyses_remaining: number;
    job_analyses_remaining: number;
    cv_storage_remaining: number;
  };
  currentTier: string;
  className?: string;
}

export const UsageLimitWarning: React.FC<UsageLimitWarningProps> = ({
  analysisType,
  usageStats,
  currentTier,
  className
}) => {
  const getUsageInfo = () => {
    switch (analysisType) {
      case 'cv_analysis':
        return {
          used: usageStats.cv_analyses_used,
          remaining: usageStats.cv_analyses_remaining,
          label: 'CV Analyses'
        };
      case 'job_analysis':
        return {
          used: usageStats.job_analyses_used,
          remaining: usageStats.job_analyses_remaining,
          label: 'Job Analyses'
        };
      case 'cv_storage':
        return {
          used: usageStats.cvs_stored,
          remaining: usageStats.cv_storage_remaining,
          label: 'CV Storage'
        };
      default:
        return {
          used: 0,
          remaining: 0,
          label: 'Unknown'
        };
    }
  };

  const usage = getUsageInfo();
  const total = usage.used + usage.remaining;
  const usagePercent = total > 0 ? (usage.used / total) * 100 : 0;
  const isNearLimit = usagePercent >= 80;
  const isAtLimit = usage.remaining === 0;

  if (!isNearLimit && !isAtLimit) {
    return null;
  }

  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          {isAtLimit ? 'Usage Limit Reached' : 'Approaching Usage Limit'}
        </CardTitle>
        <CardDescription className="text-orange-700">
          {isAtLimit 
            ? `You've reached your ${usage.label.toLowerCase()} limit for this billing period.`
            : `You're running low on ${usage.label.toLowerCase()}.`
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Usage Bar */}
        <div>
          <div className="flex justify-between text-sm text-orange-700 mb-2">
            <span>{usage.label}</span>
            <span>{usage.used} / {total}</span>
          </div>
          <div className="w-full bg-orange-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isAtLimit ? 'bg-red-500' : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Current Tier */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-orange-700">Current Plan:</span>
          <Badge className="bg-orange-200 text-orange-800">
            {currentTier.charAt(0).toUpperCase() + currentTier.slice(1).toLowerCase()}
          </Badge>
        </div>

        {/* Upgrade CTA */}
        <div className="pt-2 border-t border-orange-200">
          <div className="text-sm text-orange-700 mb-3">
            {isAtLimit 
              ? 'Upgrade your plan to continue using this feature.'
              : 'Upgrade to get more analyses and never worry about limits again.'
            }
          </div>
          
          <div className="flex gap-2">
            <Link to="/subscription" className="flex-1">
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                size="sm"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </Link>
            
            {currentTier === 'free' && (
              <Link to="/subscription" className="flex-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  View Plans
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
