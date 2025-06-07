import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Crown, 
  DollarSign, 
  TrendingUp, 
  Activity,
  UserPlus,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardMetrics {
  total_users: number;
  active_users: number;
  total_cvs: number;
  total_subscriptions: number;
  active_subscriptions: number;
  monthly_revenue: number;
  recent_registrations: number;
  recent_cv_uploads: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend,
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {description && (
          <p className="text-xs text-gray-600 mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp 
              className={`h-4 w-4 mr-1 ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`} 
            />
            <span 
              className={`text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-gray-600 ml-1">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }
      
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading dashboard: {error}</p>
            <button
              type="button"
              onClick={fetchDashboardMetrics}
              className="mt-2 text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  const userActivityRate = metrics.total_users > 0 
    ? (metrics.active_users / metrics.total_users * 100).toFixed(1)
    : '0';

  const subscriptionRate = metrics.total_users > 0
    ? (metrics.total_subscriptions / metrics.total_users * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of your CV application's performance and metrics
        </p>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={metrics.total_users}
          description={`${metrics.active_users} active users`}
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        
        <MetricCard
          title="Total CVs"
          value={metrics.total_cvs}
          description="CVs uploaded to platform"
          icon={<FileText className="h-5 w-5" />}
          color="green"
        />
        
        <MetricCard
          title="Active Subscriptions"
          value={metrics.active_subscriptions}
          description={`${subscriptionRate}% subscription rate`}
          icon={<Crown className="h-5 w-5" />}
          color="purple"
        />
        
        <MetricCard
          title="Monthly Revenue"
          value={`$${metrics.monthly_revenue.toFixed(2)}`}
          description="Current month revenue"
          icon={<DollarSign className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="User Activity Rate"
          value={`${userActivityRate}%`}
          description="Active vs total users"
          icon={<Activity className="h-5 w-5" />}
          color="blue"
        />
        
        <MetricCard
          title="Recent Registrations"
          value={metrics.recent_registrations}
          description="Last 30 days"
          icon={<UserPlus className="h-5 w-5" />}
          color="green"
        />
        
        <MetricCard
          title="Recent CV Uploads"
          value={metrics.recent_cv_uploads}
          description="Last 30 days"
          icon={<Upload className="h-5 w-5" />}
          color="purple"
        />
        
        <MetricCard
          title="Total Subscriptions"
          value={metrics.total_subscriptions}
          description="All time subscriptions"
          icon={<Crown className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button type="button" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
              <Users className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-medium">Manage Users</h3>
              <p className="text-sm text-gray-600">View and manage user accounts</p>
            </button>

            <button type="button" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
              <FileText className="h-6 w-6 text-green-600 mb-2" />
              <h3 className="font-medium">Review CVs</h3>
              <p className="text-sm text-gray-600">Monitor and manage CV uploads</p>
            </button>

            <button type="button" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
              <Crown className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-medium">Subscriptions</h3>
              <p className="text-sm text-gray-600">Manage user subscriptions</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
