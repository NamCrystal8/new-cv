import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SubscriptionStatus, UsageStats, UserSubscription } from '../types/subscription';
import { authenticatedFetch } from '../utils/auth';
import { useAuth } from '../App';

interface SubscriptionContextType {
  status: SubscriptionStatus | null;
  usage: UsageStats | null;
  subscription: UserSubscription | null;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  checkUsageLimit: (analysisType: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const fetchSubscriptionData = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!isAuthenticated) {
      setStatus(null);
      setUsage(null);
      setSubscription(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch subscription data in parallel
      const [statusRes, subscriptionRes] = await Promise.all([
        authenticatedFetch('/subscription/status'),
        authenticatedFetch('/subscription/current')
      ]);

      // Handle status (includes usage stats in correct format)
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
        // Extract usage stats from status response
        if (statusData.usage_stats) {
          setUsage(statusData.usage_stats);
        }
      }

      // Handle subscription
      if (subscriptionRes.ok) {
        const subscriptionData = await subscriptionRes.json();
        setSubscription(subscriptionData);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const refreshSubscription = useCallback(async () => {
    await fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const checkUsageLimit = useCallback((analysisType: string): boolean => {
    if (!usage) return true; // Allow if no usage data available

    switch (analysisType) {
      case 'cv_analysis':
        return usage.cv_analyses_remaining > 0;
      case 'job_analysis':
        return usage.job_analyses_remaining > 0;
      case 'cv_storage':
        return usage.cv_storage_remaining > 0;
      default:
        return true;
    }
  }, [usage]);

  // Fetch subscription data when authentication state changes
  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const value: SubscriptionContextType = {
    status,
    usage,
    subscription,
    loading,
    error,
    refreshSubscription,
    checkUsageLimit
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
