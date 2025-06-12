import { useState, useEffect } from 'react';
import {
  SubscriptionPlan,
  UserSubscription,
  UsageStats,
  SubscriptionStatus,
  AnalyticsOverview,
  UpgradeRequest
} from '../types/subscription';
import { getApiBaseUrl } from '../utils/api';
import { shouldUseTokenAuth, fetchWithAuth } from '../utils/tokenAuth';

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  if (shouldUseTokenAuth()) {
    return fetchWithAuth(url, options);
  } else {
    return fetch(url, {
      ...options,
      credentials: 'include',
    });
  }
};

export const useSubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl();
        const response = await makeAuthenticatedRequest(`${apiBaseUrl}/subscription/plans`);
        if (!response.ok) throw new Error('Failed to fetch plans');
        const data = await response.json();
        setPlans(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return { plans, loading, error };
};

export const useUserSubscription = () => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = getApiBaseUrl();
      const response = await makeAuthenticatedRequest(`${apiBaseUrl}/subscription/current`);
      if (!response.ok) {
        if (response.status === 401) {
          setSubscription(null);
          return;
        }
        throw new Error('Failed to fetch subscription');
      }
      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  return { subscription, loading, error, refetch: fetchSubscription };
};

export const useUsageStats = () => {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = getApiBaseUrl();
      const response = await makeAuthenticatedRequest(`${apiBaseUrl}/subscription/usage`);
      if (!response.ok) {
        if (response.status === 401) {
          setUsage(null);
          return;
        }
        throw new Error('Failed to fetch usage stats');
      }
      const data = await response.json();
      setUsage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  return { usage, loading, error, refetch: fetchUsage };
};

export const useSubscriptionStatus = () => {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = getApiBaseUrl();
      const response = await makeAuthenticatedRequest(`${apiBaseUrl}/subscription/status`);
      if (!response.ok) {
        if (response.status === 401) {
          setStatus(null);
          return;
        }
        throw new Error('Failed to fetch subscription status');
      }
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return { status, loading, error, refetch: fetchStatus };
};

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = getApiBaseUrl();
      const response = await makeAuthenticatedRequest(`${apiBaseUrl}/subscription/analytics`);
      if (!response.ok) {
        if (response.status === 403) {
          setError('Premium subscription required for analytics');
          return;
        }
        if (response.status === 401) {
          setAnalytics(null);
          return;
        }
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return { analytics, loading, error, refetch: fetchAnalytics };
};

// Subscription actions
export const upgradeSubscription = async (request: UpgradeRequest) => {
  const apiBaseUrl = getApiBaseUrl();
  const response = await makeAuthenticatedRequest(`${apiBaseUrl}/subscription/upgrade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to upgrade subscription');
  }

  return response.json();
};

export const checkUsageLimits = async (analysisType: string) => {
  const apiBaseUrl = getApiBaseUrl();
  const response = await makeAuthenticatedRequest(`${apiBaseUrl}/subscription/check-limits/${analysisType}`, {
    method: 'POST',
  });

  if (!response.ok) {
    if (response.status === 429) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData.detail));
    }
    throw new Error('Failed to check usage limits');
  }

  return response.json();
};
