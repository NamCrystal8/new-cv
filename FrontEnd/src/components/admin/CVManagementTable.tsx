import React, { useState, useEffect } from 'react';
import { Eye, Trash2, Download, User } from 'lucide-react';
import { DataTable, Column } from './DataTable';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/utils/auth';

// CV data interface
interface AdminCV {
  id: number;
  file_url: string;
  cv_structure: any;
  user_id: string;
  owner_email: string;
  owner_name?: string;
  upload_date: string;
  file_size?: number;
  status: string;
}

// Pagination interface
interface Pagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface CVManagementTableProps {}

export const CVManagementTable: React.FC<CVManagementTableProps> = () => {
  const [cvs, setCvs] = useState<AdminCV[]>([]);
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

  // Fetch CVs from API
  const fetchCvs = async (page: number = 1, search: string = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pagination.pageSize.toString(),
      });

      if (search.trim()) {
        params.append('search', search.trim());
      }

      const response = await authenticatedFetch(`/admin/cvs?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch CVs');
      }

      const data = await response.json();
      setCvs(data.items || []);
      setPagination(prev => ({
        ...prev,
        currentPage: data.page || 1,
        totalPages: data.total_pages || 1,
        total: data.total || 0
      }));
    } catch (error) {
      console.error('Error fetching CVs:', error);
      toast({
        title: "Error",
        description: "Failed to load CVs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchCvs(1, query);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchCvs(page, searchQuery);
  };

  // Handle CV deletion
  const handleDeleteCV = async (cvId: number) => {
    if (!confirm('Are you sure you want to delete this CV? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/admin/cvs/${cvId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete CV');
      }

      toast({
        title: "Success",
        description: "CV deleted successfully.",
        variant: "default",
      });

      // Refresh the list
      fetchCvs(pagination.currentPage, searchQuery);
    } catch (error) {
      console.error('Error deleting CV:', error);
      toast({
        title: "Error",
        description: "Failed to delete CV. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle CV view
  const handleViewCV = (cv: AdminCV) => {
    if (cv.file_url) {
      window.open(cv.file_url, '_blank');
    } else {
      toast({
        title: "Error",
        description: "CV file not available.",
        variant: "destructive",
      });
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'flagged':
        return <Badge variant="destructive">Flagged</Badge>;
      case 'deleted':
        return <Badge variant="outline" className="bg-gray-100 text-gray-600">Deleted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Define table columns
  const columns: Column<AdminCV>[] = [
    {
      key: 'id',
      header: 'CV ID',
      width: '80px',
      render: (cv) => (
        <div className="font-mono text-sm">
          #{cv.id}
        </div>
      ),
    },
    {
      key: 'owner_email',
      header: 'Owner',
      width: '300px',
      render: (cv) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <div>
              <div className="font-medium text-gray-900">{cv.owner_email}</div>
              <div className="text-sm text-gray-500">ID: {cv.user_id.slice(0, 8)}...</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'upload_date',
      header: 'Upload Date',
      width: '160px',
      render: (cv) => (
        <div className="text-sm">
          {formatDate(cv.upload_date)}
        </div>
      ),
    },
    {
      key: 'file_size',
      header: 'File Size',
      width: '100px',
      render: (cv) => (
        <div className="text-sm text-gray-600">
          {formatFileSize(cv.file_size)}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (cv) => getStatusBadge(cv.status),
    },
  ];

  // Define actions
  const getActions = (cv: AdminCV) => [
    {
      label: 'View CV',
      onClick: () => handleViewCV(cv),
      icon: <Eye className="h-4 w-4" />,
      variant: 'outline' as const,
    },
    {
      label: 'Download',
      onClick: () => handleViewCV(cv), // Same as view for now
      icon: <Download className="h-4 w-4" />,
      variant: 'outline' as const,
    },
    {
      label: 'Delete',
      onClick: () => handleDeleteCV(cv.id),
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive' as const,
    },
  ];

  // Bulk actions
  const bulkActions = [
    {
      label: 'Delete Selected',
      onClick: (cvs: AdminCV[]) => {
        if (confirm(`Are you sure you want to delete ${cvs.length} CVs? This action cannot be undone.`)) {
          // TODO: Implement bulk delete
          console.log('Bulk delete CVs:', cvs.map(cv => cv.id));
        }
      },
      variant: 'destructive' as const,
    },
  ];

  // Load CVs on component mount
  useEffect(() => {
    fetchCvs();
  }, []);

  // Update pagination handler
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      onPageChange: handlePageChange
    }));
  }, [searchQuery]);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">CV Management</h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2">Manage user-uploaded CVs and documents</p>
        </div>
      </div>

      <div className="w-full">
        <DataTable
          data={cvs}
          columns={columns}
          title="All CVs"
          searchable
          searchPlaceholder="Search by owner email..."
          onSearch={handleSearch}
          pagination={pagination}
          actions={getActions}
          bulkActions={bulkActions}
          selectable
          loading={loading}
          emptyMessage="No CVs found"
          getItemId={(cv) => cv.id.toString()}
        />
      </div>
    </div>
  );
};
