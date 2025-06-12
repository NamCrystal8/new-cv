import React, { useState } from 'react';
import { 
  Crown, 
  Sparkles, 
  Zap, 
  Check, 
  TrendingUp, 
  BarChart3, 
  Headphones, 
  Palette,
  Settings,
  CreditCard
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { useToast } from '../hooks/use-toast';
import {
  useSubscriptionPlans,
  useUserSubscription,
  useUsageStats,
  useAnalytics,
  upgradeSubscription
} from '../hooks/useSubscription';
import { UpgradeRequest } from '../types/subscription';

const SubscriptionPage: React.FC = () => {
  const { plans, loading: plansLoading } = useSubscriptionPlans();
  const { subscription, loading: subLoading, refetch: refetchSubscription } = useUserSubscription();
  const { usage, loading: usageLoading } = useUsageStats();
  const { analytics, loading: analyticsLoading } = useAnalytics();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { toast } = useToast();
  const handleUpgrade = async (targetTier: string) => {
    try {
      setUpgrading(targetTier);
      const request: UpgradeRequest = {
        target_tier: targetTier as any, // Allow any tier string
        billing_cycle: billingCycle
      };

      const result = await upgradeSubscription(request);

      // Show success notification
      if (result.success) {
        toast({
          title: "🎉 Upgrade Successful!",
          description: `${result.message} You now have access to ${result.plan_name} features!`,
          variant: "success",
        });

        // Refresh subscription data
        await refetchSubscription();
      }

    } catch (error) {
      toast({
        title: "Upgrade Failed",
        description: "Failed to upgrade subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpgrading(null);
    }
  };

  const getTierIcon = (planName: string) => {
    // Dynamic icon assignment based on plan name
    const name = planName.toUpperCase();

    if (name.includes('PRO') || name.includes('ULTIMATE')) {
      return <Crown className="h-6 w-6 text-yellow-500" />;
    } else if (name.includes('PREMIUM') || name.includes('BUSINESS')) {
      return <Sparkles className="h-6 w-6 text-purple-500" />;
    } else if (name.includes('ENTERPRISE')) {
      return <Settings className="h-6 w-6 text-red-500" />;
    } else if (name.includes('BASIC')) {
      return <Zap className="h-6 w-6 text-blue-500" />;
    } else {
      return <Zap className="h-6 w-6 text-blue-500" />; // Default for Free and others
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'analytics':
        return <BarChart3 className="h-4 w-4" />;
      case 'support':
        return <Headphones className="h-4 w-4" />;
      case 'templates':
        return <Palette className="h-4 w-4" />;
      case 'api':
        return <Settings className="h-4 w-4" />;
      default:
        return <Check className="h-4 w-4" />;
    }
  };

  if (plansLoading || subLoading || usageLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentPlanName = subscription?.plan?.name || 'Free';

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Choose the perfect plan for your CV enhancement needs. Upgrade anytime to unlock more features and increase your limits.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <Badge className="ml-2 bg-green-100 text-green-800">Save 20%</Badge>
          </button>
        </div>
      </div>

      {/* Current Usage Stats */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Current Usage
            </CardTitle>
            <CardDescription>
              Your usage for the current billing period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>CV Analyses</span>
                  <span className="font-medium">
                    {usage.cv_analyses_used} / {usage.cv_analyses_used + usage.cv_analyses_remaining}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((usage.cv_analyses_used / (usage.cv_analyses_used + usage.cv_analyses_remaining)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Job Analyses</span>
                  <span className="font-medium">
                    {usage.job_analyses_used} / {usage.job_analyses_used + usage.job_analyses_remaining}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((usage.job_analyses_used / (usage.job_analyses_used + usage.job_analyses_remaining)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>CVs Stored</span>
                  <span className="font-medium">
                    {usage.cvs_stored} / {usage.cvs_stored + usage.cv_storage_remaining}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((usage.cvs_stored / (usage.cvs_stored + usage.cv_storage_remaining)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div className={`grid gap-6 ${
        plans.length <= 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' :
        plans.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
        plans.length === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }`}>
        {plans.map((plan) => {
          const isCurrentPlan = plan.name === currentPlanName;
          const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
          // Make the middle plan popular for odd numbers, or the second plan for even numbers
          const popularIndex = Math.floor(plans.length / 2);
          const isPopular = plans.indexOf(plan) === popularIndex;
          
          return (
            <Card 
              key={plan.id} 
              className={`relative ${
                isCurrentPlan ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
              } ${
                isPopular ? 'border-purple-500 shadow-lg scale-105' : ''
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-blue-500 text-white">Current Plan</Badge>
                </div>
              )}
              
              <CardHeader className="text-center space-y-4">
                <div className="flex justify-center">
                  {getTierIcon(plan.name)}
                </div>
                <div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${price}</span>
                    <span className="text-gray-600">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  {billingCycle === 'yearly' && plan.price_yearly < plan.price_monthly * 12 && (
                    <div className="text-sm text-green-600 mt-1">
                      Save ${(plan.price_monthly * 12 - plan.price_yearly).toFixed(2)} annually
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Features List */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      {plan.cv_analyses_per_month === -1 ? 'Unlimited' : plan.cv_analyses_per_month} CV analyses per month
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      {plan.job_analyses_per_month === -1 ? 'Unlimited' : plan.job_analyses_per_month} job analyses per month
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      Store up to {plan.cv_storage_limit === -1 ? 'unlimited' : plan.cv_storage_limit} CVs
                    </span>
                  </div>
                  
                  {plan.advanced_analytics && (
                    <div className="flex items-center gap-2">
                      {getFeatureIcon('analytics')}
                      <span className="text-sm">Advanced analytics & insights</span>
                    </div>
                  )}
                  
                  {plan.priority_support && (
                    <div className="flex items-center gap-2">
                      {getFeatureIcon('support')}
                      <span className="text-sm">Priority customer support</span>
                    </div>
                  )}
                  
                  {plan.custom_templates && (
                    <div className="flex items-center gap-2">
                      {getFeatureIcon('templates')}
                      <span className="text-sm">Custom CV templates</span>
                    </div>
                  )}
                  
                  {plan.api_access && (
                    <div className="flex items-center gap-2">
                      {getFeatureIcon('api')}
                      <span className="text-sm">API access</span>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Action Button */}
                <div className="pt-2">
                  {isCurrentPlan ? (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      disabled
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Current Plan
                    </Button>
                  ) : plan.name.toUpperCase().includes('FREE') ? (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      disabled
                    >
                      Free Forever
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full ${
                        isPopular 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                          : ''
                      }`}
                      onClick={() => handleUpgrade(plan.tier)}
                      disabled={upgrading === plan.tier}
                    >
                      {upgrading === plan.tier ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Upgrading...
                        </>
                      ) : (
                        <>
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade to {plan.name}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Section for Premium Users */}
      {analytics && !analyticsLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics & Insights
            </CardTitle>
            <CardDescription>
              Your premium analytics dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analytics.total_analyses}</div>
                <div className="text-sm text-gray-600">Total Analyses</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analytics.analyses_this_month}</div>
                <div className="text-sm text-gray-600">This Month</div>
              </div>
                <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.most_common_weaknesses?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Common Issues</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.skill_gap_insights?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Skill Gaps</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionPage;
