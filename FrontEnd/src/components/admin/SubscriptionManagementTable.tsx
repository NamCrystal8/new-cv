import React, { useState, useEffect } from 'react';
import { Eye, Ban, Edit, User, Crown, Calendar, DollarSign } from 'lucide-react';
import { DataTable, Column } from './DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Subscription data interface
interface AdminSubscription {
  id: number;
  user_id: string;
  plan_id: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  auto_renewal: boolean;
  stripe_subscription_id?: string;
  last_payment_date?: string;
  created_at: string;
  updated_at: string;
  plan: {
    id: number;
    name: string;
    tier: string;
    price_monthly: number;
    price_yearly: number;
  };
  user_email: string;
  user_name?: string;
  plan_name: string;
  revenue: number;
}

// Pagination interface
interface Pagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface SubscriptionManagementTableProps {}

export const SubscriptionManagementTable: React.FC<SubscriptionManagementTableProps> = () => {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    pageSize: 20,
    total: 0,
    onPageChange: (page: number) => {
      setPagination(prev => ({ ...prev, currentPage: page }));
    }
  });
  const { toast } = useToast();

  // Fetch subscriptions from API
  const fetchSubscriptions = async (page: number = 1, search: string = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pagination.pageSize.toString(),
      });

      if (search.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetch(`/api/admin/subscriptions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data.items || []);
      setPagination(prev => ({
        ...prev,
        currentPage: data.page || 1,
        totalPages: data.total_pages || 1,
        total: data.total || 0
      }));
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load subscriptions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchSubscriptions(1, query);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchSubscriptions(page, searchQuery);
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async (subscriptionId: number) => {
    if (!confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      toast({
        title: "Success",
        description: "Subscription cancelled successfully.",
        variant: "default",
      });

      // Refresh the list
      fetchSubscriptions(pagination.currentPage, searchQuery);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle subscription view
  const handleViewSubscription = (subscription: AdminSubscription) => {
    // TODO: Implement subscription detail view
    console.log('View subscription:', subscription);
    toast({
      title: "Info",
      description: "Subscription detail view coming soon.",
      variant: "default",
    });
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Get status badge
  const getStatusBadge = (subscription: AdminSubscription) => {
    if (!subscription.is_active) {
      return <Badge variant="destructive">Cancelled</Badge>;
    }

    if (subscription.end_date) {
      const endDate = new Date(subscription.end_date);
      const now = new Date();
      if (endDate < now) {
        return <Badge variant="outline" className="bg-gray-100 text-gray-600">Expired</Badge>;
      }
    }

    return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
  };

  // Get plan badge with support for more than 3 plans
  const getPlanBadge = (plan: AdminSubscription['plan']) => {
    // Dynamic color assignment based on plan tier
    const getPlanColor = (tier: string) => {
      const colors = [
        'bg-gray-100 text-gray-600 border-gray-300',      // FREE
        'bg-blue-100 text-blue-800 border-blue-200',      // BASIC
        'bg-purple-100 text-purple-800 border-purple-200', // PREMIUM
        'bg-indigo-100 text-indigo-800 border-indigo-200', // PRO
        'bg-yellow-100 text-yellow-800 border-yellow-200', // BUSINESS
        'bg-red-100 text-red-800 border-red-200',         // ENTERPRISE
        'bg-green-100 text-green-800 border-green-200',   // ULTIMATE
      ];

      // Map common tier names to colors
      const tierMap: { [key: string]: string } = {
        'FREE': colors[0],
        'BASIC': colors[1],
        'PREMIUM': colors[2],
        'PRO': colors[3],
        'BUSINESS': colors[4],
        'ENTERPRISE': colors[5],
        'ULTIMATE': colors[6],
      };

      return tierMap[tier.toUpperCase()] || colors[Math.abs(tier.length) % colors.length];
    };

    return (
      <Badge variant="outline" className={`${getPlanColor(plan.tier)} font-medium`}>
        {plan.name}
      </Badge>
    );
  };

  // Define table columns
  const columns: Column<AdminSubscription>[] = [
    {
      key: 'id',
      header: 'Sub ID',
      width: '80px',
      render: (subscription) => (
        <div className="font-mono text-sm">
          #{subscription.id}
        </div>
      ),
    },
    {
      key: 'user_email',
      header: 'User',
      width: '280px',
      render: (subscription) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <div>
              <div className="font-medium text-gray-900">{subscription.user_email}</div>
              <div className="text-sm text-gray-500">ID: {subscription.user_id.slice(0, 8)}...</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      width: '140px',
      render: (subscription) => getPlanBadge(subscription.plan),
    },
    {
      key: 'revenue',
      header: 'Monthly Revenue',
      width: '120px',
      render: (subscription) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-semibold text-green-600">
            {formatCurrency(subscription.revenue)}
          </span>
        </div>
      ),
    },
    {
      key: 'start_date',
      header: 'Start Date',
      width: '120px',
      render: (subscription) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          {formatDate(subscription.start_date)}
        </div>
      ),
    },
    {
      key: 'end_date',
      header: 'End Date',
      width: '120px',
      render: (subscription) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          {formatDate(subscription.end_date)}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      width: '120px',
      render: (subscription) => getStatusBadge(subscription),
    },
  ];

  // Define actions
  const getActions = (subscription: AdminSubscription) => [
    {
      label: 'View Details',
      onClick: () => handleViewSubscription(subscription),
      icon: <Eye className="h-4 w-4" />,
      variant: 'outline' as const,
    },
    {
      label: 'Edit',
      onClick: () => {
        // TODO: Implement subscription edit
        console.log('Edit subscription:', subscription);
        toast({
          title: "Info",
          description: "Subscription editing coming soon.",
          variant: "default",
        });
      },
      icon: <Edit className="h-4 w-4" />,
      variant: 'outline' as const,
    },
    ...(subscription.is_active ? [{
      label: 'Cancel',
      onClick: () => handleCancelSubscription(subscription.id),
      icon: <Ban className="h-4 w-4" />,
      variant: 'destructive' as const,
    }] : []),
  ];

  // Bulk actions
  const bulkActions = [
    {
      label: 'Cancel Selected',
      onClick: (subscriptions: AdminSubscription[]) => {
        const activeSubscriptions = subscriptions.filter(s => s.is_active);
        if (activeSubscriptions.length === 0) {
          toast({
            title: "Info",
            description: "No active subscriptions selected.",
            variant: "default",
          });
          return;
        }

        if (confirm(`Are you sure you want to cancel ${activeSubscriptions.length} active subscriptions? This action cannot be undone.`)) {
          // TODO: Implement bulk cancel
          console.log('Bulk cancel subscriptions:', activeSubscriptions.map(s => s.id));
        }
      },
      variant: 'destructive' as const,
    },
  ];

  // Load subscriptions on component mount
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Update pagination handler
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      onPageChange: handlePageChange
    }));
  }, [searchQuery]);

  return (
    <div className="space-y-8 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Subscription Management</h2>
          <p className="text-lg text-gray-600 mt-2">Manage user subscriptions and billing</p>
        </div>
      </div>

      <div className="w-full">
        <DataTable
          data={subscriptions}
          columns={columns}
          title="All Subscriptions"
          searchable
          searchPlaceholder="Search by user email..."
          onSearch={handleSearch}
          pagination={pagination}
          actions={getActions}
          bulkActions={bulkActions}
          selectable
          loading={loading}
          emptyMessage="No subscriptions found"
          getItemId={(subscription) => subscription.id.toString()}
        />
      </div>
    </div>
  );
};
