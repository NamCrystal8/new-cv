import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  CreditCard,
  FileText,
  Briefcase,
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { useToast } from '../hooks/use-toast';
import {
  useSubscriptionPlans,
  useUserSubscription,
  useSubscriptionStatus,
  useAnalytics,
  upgradeSubscription
} from '../hooks/useSubscription';
import { UpgradeRequest } from '../types/subscription';

const SubscriptionPage: React.FC = () => {
  const { plans, loading: plansLoading } = useSubscriptionPlans();
  const { subscription, loading: subLoading, refetch: refetchSubscription } = useUserSubscription();
  const { status, loading: statusLoading } = useSubscriptionStatus();
  const { analytics, loading: analyticsLoading } = useAnalytics();

  // Extract usage stats from status
  const usage = status?.usage_stats || null;
  const usageLoading = statusLoading;
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
    <div className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center space-y-2 sm:space-y-3 lg:space-y-4 fade-in"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900"
        >
          Subscription Management
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed"
        >
          Choose the perfect plan for your CV enhancement needs. Upgrade anytime to unlock more features and increase your limits.
        </motion.p>
      </motion.div>

      {/* Billing Toggle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        className="flex justify-center"
      >
        <div className="bg-gray-100 rounded-lg p-1 flex hover:shadow-md transition-all duration-300">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-300 touch-manipulation ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-300 touch-manipulation ${
              billingCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <motion.div
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Badge className="ml-1 sm:ml-2 bg-green-100 text-green-800 text-xs">Save 20%</Badge>
            </motion.div>
          </motion.button>
        </div>
      </motion.div>

      {/* Current Usage Stats */}
      {usage && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          <Card className="hover:shadow-lg transition-all duration-300 card-entrance">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, delay: 0.6, ease: "easeInOut" }}
                >
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </motion.div>
                Current Usage
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Your usage for the current billing period
              </CardDescription>
            </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>CV Analyses</span>
                  </div>
                  <span className="font-medium">
                    {usage.cv_analyses_used || 0} / {(usage.cv_analyses_used || 0) + (usage.cv_analyses_remaining || 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        ((usage.cv_analyses_used || 0) > 0 && ((usage.cv_analyses_used || 0) + (usage.cv_analyses_remaining || 0)) > 0)
                          ? ((usage.cv_analyses_used || 0) / ((usage.cv_analyses_used || 0) + (usage.cv_analyses_remaining || 0))) * 100
                          : 0,
                        100
                      )}%`
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-green-500" />
                    <span>Job Analyses</span>
                  </div>
                  <span className="font-medium">
                    {usage.job_analyses_used || 0} / {(usage.job_analyses_used || 0) + (usage.job_analyses_remaining || 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        ((usage.job_analyses_used || 0) > 0 && ((usage.job_analyses_used || 0) + (usage.job_analyses_remaining || 0)) > 0)
                          ? ((usage.job_analyses_used || 0) / ((usage.job_analyses_used || 0) + (usage.job_analyses_remaining || 0))) * 100
                          : 0,
                        100
                      )}%`
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-purple-500" />
                    <span>CVs Stored</span>
                  </div>
                  <span className="font-medium">
                    {usage.cvs_stored || 0} / {(usage.cvs_stored || 0) + (usage.cv_storage_remaining || 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        ((usage.cvs_stored || 0) > 0 && ((usage.cvs_stored || 0) + (usage.cv_storage_remaining || 0)) > 0)
                          ? ((usage.cvs_stored || 0) / ((usage.cvs_stored || 0) + (usage.cv_storage_remaining || 0))) * 100
                          : 0,
                        100
                      )}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      )}

      {/* Pricing Plans */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className={`grid gap-4 sm:gap-6 ${
          plans.length <= 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto' :
          plans.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
          plans.length === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}
      >
        {plans.map((plan, index) => {
          const isCurrentPlan = plan.name === currentPlanName;
          const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
          // Make the middle plan popular for odd numbers, or the second plan for even numbers
          const popularIndex = Math.floor(plans.length / 2);
          const isPopular = plans.indexOf(plan) === popularIndex;
          
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.6 + (index * 0.1),
                ease: "easeOut",
                type: "spring",
                stiffness: 100
              }}
              whileHover={{
                y: -8,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              className="h-full"
            >
              <Card
                className={`relative h-full transition-all duration-300 hover:shadow-xl ${
                  isCurrentPlan ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
                } ${
                  isPopular ? 'border-purple-500 shadow-lg' : 'hover:shadow-lg'
                } card-entrance`}
              >
              {isPopular && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.8 + (index * 0.1),
                    type: "spring",
                    stiffness: 200
                  }}
                  className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2"
                >
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs sm:text-sm animate-pulse">
                    Most Popular
                  </Badge>
                </motion.div>
              )}

              {isCurrentPlan && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.9 + (index * 0.1),
                    type: "spring",
                    stiffness: 200
                  }}
                  className="absolute -top-2 sm:-top-3 right-2 sm:right-4"
                >
                  <Badge className="bg-blue-500 text-white text-xs sm:text-sm">Current Plan</Badge>
                </motion.div>
              )}

              <CardHeader className="text-center space-y-3 sm:space-y-4 p-4 sm:p-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 1.0 + (index * 0.1),
                    type: "spring",
                    stiffness: 150
                  }}
                  className="flex justify-center"
                >
                  {getTierIcon(plan.name)}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.1 + (index * 0.1) }}
                >
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl">{plan.name}</CardTitle>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.2 + (index * 0.1) }}
                    className="mt-2"
                  >
                    <span className="text-2xl sm:text-3xl font-bold">${price}</span>
                    <span className="text-sm sm:text-base text-gray-600">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                  </motion.div>
                  {billingCycle === 'yearly' && plan.price_yearly < plan.price_monthly * 12 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 1.3 + (index * 0.1) }}
                      className="text-xs sm:text-sm text-green-600 mt-1"
                    >
                      Save ${(plan.price_monthly * 12 - plan.price_yearly).toFixed(2)} annually
                    </motion.div>
                  )}
                </motion.div>
              </CardHeader>
              
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                {/* Features List */}
                <div className="space-y-2 sm:space-y-3">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.4 + (index * 0.1) }}
                    className="flex items-center gap-2"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 1.5 + (index * 0.1), type: "spring" }}
                    >
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 icon-hover-bounce" />
                    </motion.div>
                    <span className="text-xs sm:text-sm">
                      {plan.cv_analyses_per_month === -1 ? 'Unlimited' : plan.cv_analyses_per_month} CV analyses per month
                    </span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.5 + (index * 0.1) }}
                    className="flex items-center gap-2"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 1.6 + (index * 0.1), type: "spring" }}
                    >
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 icon-hover-bounce" />
                    </motion.div>
                    <span className="text-xs sm:text-sm">
                      {plan.job_analyses_per_month === -1 ? 'Unlimited' : plan.job_analyses_per_month} job analyses per month
                    </span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.6 + (index * 0.1) }}
                    className="flex items-center gap-2"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 1.7 + (index * 0.1), type: "spring" }}
                    >
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 icon-hover-bounce" />
                    </motion.div>
                    <span className="text-xs sm:text-sm">
                      Store up to {plan.cv_storage_limit === -1 ? 'unlimited' : plan.cv_storage_limit} CVs
                    </span>
                  </motion.div>
                  
                  {plan.advanced_analytics && (
                    <div className="flex items-center gap-2">
                      {getFeatureIcon('analytics')}
                      <span className="text-xs sm:text-sm">Advanced analytics & insights</span>
                    </div>
                  )}

                  {plan.priority_support && (
                    <div className="flex items-center gap-2">
                      {getFeatureIcon('support')}
                      <span className="text-xs sm:text-sm">Priority customer support</span>
                    </div>
                  )}

                  {plan.custom_templates && (
                    <div className="flex items-center gap-2">
                      {getFeatureIcon('templates')}
                      <span className="text-xs sm:text-sm">Custom CV templates</span>
                    </div>
                  )}

                  {plan.api_access && (
                    <div className="flex items-center gap-2">
                      {getFeatureIcon('api')}
                      <span className="text-xs sm:text-sm">API access</span>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Action Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.8 + (index * 0.1) }}
                  className="pt-2"
                >
                  {isCurrentPlan ? (
                    <Button
                      className="w-full text-xs sm:text-sm touch-manipulation"
                      variant="outline"
                      disabled
                      size="sm"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: 1.9 + (index * 0.1) }}
                      >
                        <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      </motion.div>
                      Current Plan
                    </Button>
                  ) : plan.name.toUpperCase().includes('FREE') ? (
                    <Button
                      className="w-full text-xs sm:text-sm touch-manipulation"
                      variant="outline"
                      disabled
                      size="sm"
                    >
                      Free Forever
                    </Button>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        className={`w-full text-xs sm:text-sm touch-manipulation transition-all duration-300 ripple ${
                          isPopular
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 gradient-shift'
                            : 'btn-hover-lift'
                        }`}
                        onClick={() => handleUpgrade(plan.tier)}
                        disabled={upgrading === plan.tier}
                        size="sm"
                      >
                        {upgrading === plan.tier ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"
                            />
                            <span className="hidden sm:inline">Upgrading...</span>
                            <span className="sm:hidden">...</span>
                          </motion.div>
                        ) : (
                          <>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.3, delay: 1.9 + (index * 0.1) }}
                            >
                              <Crown className="h-3 w-3 sm:h-4 sm:w-4 mr-2 icon-hover-bounce" />
                            </motion.div>
                            <span className="hidden sm:inline">Upgrade to {plan.name}</span>
                            <span className="sm:hidden">Upgrade</span>
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              </CardContent>
            </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Analytics Section for Premium Users */}
      {analytics && !analyticsLoading && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.0, ease: "easeOut" }}
        >
          <Card className="hover:shadow-lg transition-all duration-300 card-entrance">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, delay: 2.2, ease: "easeInOut" }}
                >
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </motion.div>
                Analytics & Insights
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Your premium analytics dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 2.3 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 2.4 }}
                    className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600"
                  >
                    {analytics.total_analyses}
                  </motion.div>
                  <div className="text-xs sm:text-sm text-gray-600">Total Analyses</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 2.4 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 2.5 }}
                    className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600"
                  >
                    {analytics.analyses_this_month}
                  </motion.div>
                  <div className="text-xs sm:text-sm text-gray-600">This Month</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 2.5 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 2.6 }}
                    className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600"
                  >
                    {analytics.most_common_weaknesses?.length || 0}
                  </motion.div>
                  <div className="text-xs sm:text-sm text-gray-600">Common Issues</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 2.6 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 2.7 }}
                    className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600"
                  >
                    {analytics.skill_gap_insights?.length || 0}
                  </motion.div>
                  <div className="text-xs sm:text-sm text-gray-600">Skill Gaps</div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default SubscriptionPage;
