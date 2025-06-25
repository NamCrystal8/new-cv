import React, { useState, useEffect } from 'react';
import { Trash2, Eye } from 'lucide-react';
import { DataTable, Column } from './DataTable';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/utils/auth';

// Toggle Switch Component
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-10 h-5'
  };

  const thumbClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4'
  };

  return (
    <button
      type="button"
      className={`
        ${sizeClasses[size]}
        ${checked ? 'bg-green-500' : 'bg-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
      `}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-label={checked ? 'Deactivate user' : 'Activate user'}
      title={checked ? 'Click to deactivate user' : 'Click to activate user'}
    >
      <span
        className={`
          ${thumbClasses[size]}
          ${checked ? `translate-x-${size === 'sm' ? '4' : '5'}` : 'translate-x-0.5'}
          inline-block transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out
        `}
      />
    </button>
  );
};

interface AdminUser {
  id: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  role_id: number;
  created_at: string | null;
  cv_count: number;
  subscription_status?: string;
}

interface PaginatedUsersResponse {
  items: AdminUser[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface UserFilters {
  search?: string;
  role_id?: number;
  is_active?: boolean;
  is_verified?: boolean;
  page: number;
  page_size: number;
}

export const UserManagementTable: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    page_size: 20,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await authenticatedFetch(`/admin/users?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data: PaginatedUsersResponse = await response.json();
      setUsers(data.items);
      setPagination({
        currentPage: data.page,
        totalPages: data.total_pages,
        pageSize: data.page_size,
        total: data.total,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleUpdateUser = async (userId: string, updates: Partial<AdminUser>) => {
    try {
      const response = await authenticatedFetch(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      toast({
        title: "Success",
        description: "User updated successfully",
        variant: "default",
      });

      fetchUsers(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
        variant: "default",
      });

      fetchUsers(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleBulkAction = async (selectedUsers: AdminUser[], action: string) => {
    const userIds = selectedUsers.map(user => user.id);

    try {
      const response = await authenticatedFetch(`/admin/users/bulk-action`, {
        method: 'POST',
        body: JSON.stringify({
          user_ids: userIds,
          action: action,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} users`);
      }

      toast({
        title: "Success",
        description: `Successfully ${action}d ${userIds.length} users`,
        variant: "default",
      });

      fetchUsers(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} users`,
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (roleId: number) => {
    switch (roleId) {
      case 1:
        return <Badge variant="destructive">Admin</Badge>;
      case 2:
        return <Badge variant="secondary">User</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };



  const columns: Column<AdminUser>[] = [
    {
      key: 'email',
      header: 'User Information',
      sortable: true,
      width: '450px',
      render: (user) => (
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="font-medium text-gray-900">{user.email}</div>
              <div className="text-sm text-gray-500 mt-1">
                ID: {user.id.slice(0, 8)}...
                {user.is_verified && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Verified
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
              <ToggleSwitch
                checked={user.is_active}
                onChange={(checked) => handleUpdateUser(user.id, { is_active: checked })}
                size="sm"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role_id',
      header: 'Role',
      width: '120px',
      render: (user) => getRoleBadge(user.role_id),
    },
    {
      key: 'cv_count',
      header: 'CVs Created',
      width: '120px',
      render: (user) => (
        <div className="text-center">
          <span className="font-semibold text-lg text-blue-600">{user.cv_count}</span>
          <div className="text-xs text-gray-500">CVs</div>
        </div>
      ),
    },
    {
      key: 'subscription_status',
      header: 'Subscription Plan',
      width: '180px',
      render: (user) => {
        const plan = user.subscription_status || 'Free';
        const getBadgeVariant = (planName: string) => {
          switch (planName) {
            case 'Pro':
              return 'default' as const; // Blue - highest tier
            case 'Premium':
              return 'secondary' as const; // Purple - middle tier
            case 'Free':
            default:
              return 'outline' as const; // Gray outline - free tier
          }
        };

        const getBadgeColor = (planName: string) => {
          switch (planName) {
            case 'Pro':
              return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Premium':
              return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Free':
            default:
              return 'bg-gray-100 text-gray-600 border-gray-300';
          }
        };

        return (
          <Badge
            variant={getBadgeVariant(plan)}
            className={`${getBadgeColor(plan)} font-medium`}
          >
            {plan}
          </Badge>
        );
      },
    },
  ];

  const getActions = (user: AdminUser) => [
    {
      label: 'View Details',
      onClick: () => {
        // TODO: Implement user detail view
        console.log('View user:', user);
      },
      icon: <Eye className="h-4 w-4" />,
      variant: 'outline' as const,
    },
    {
      label: 'Delete User',
      onClick: () => handleDeleteUser(user.id),
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive' as const,
    },
  ];

  const bulkActions = [
    {
      label: 'Delete Selected',
      onClick: (users: AdminUser[]) => {
        if (confirm(`Are you sure you want to delete ${users.length} users? This action cannot be undone.`)) {
          handleBulkAction(users, 'delete');
        }
      },
      variant: 'destructive' as const,
    },
  ];

  return (
    <div className="space-y-8 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
          <p className="text-lg text-gray-600 mt-2">Manage user accounts and permissions</p>
        </div>
      </div>

      <div className="w-full">
        <DataTable
          data={users}
          columns={columns}
          title="All Users"
          searchable
          searchPlaceholder="Search users by email address..."
          onSearch={handleSearch}
          pagination={{
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onPageChange: handlePageChange,
          }}
          actions={getActions}
          bulkActions={bulkActions}
          selectable
          loading={loading}
          emptyMessage="No users found"
          getItemId={(user) => user.id}
        />
      </div>
    </div>
  );
};
