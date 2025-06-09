import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Shield, AlertTriangle } from 'lucide-react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { CVManagementTable } from '@/components/admin/CVManagementTable';
import { SubscriptionManagementTable } from '@/components/admin/SubscriptionManagementTable';
import { PlanManagementTable } from '@/components/admin/PlanManagementTable';
import { getApiBaseUrl } from '@/utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/App';
import { useNavigate } from 'react-router-dom';

const AdminPage: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, [isAuthenticated]);

  const checkAdminAccess = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      // Check if user has admin access by trying to access admin endpoint
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/admin/health`, {
        credentials: 'include', // Important for authentication
      });

      if (response.ok) {
        setIsAdmin(true);
      } else if (response.status === 403) {
        setIsAdmin(false);
      } else if (response.status === 401) {
        // User is not authenticated, redirect to login
        navigate('/login');
        return;
      } else {
        throw new Error(`Failed to check admin access: ${response.status}`);
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              This area is restricted to administrators only. If you believe this is an error, 
              please contact your system administrator.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-blue-600 hover:underline text-sm"
            >
              Return to Home
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-[1800px]">
      <Routes>
        {/* Default redirect to dashboard */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            <div className="space-y-8">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-8 w-8 text-red-600" />
                  <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
                </div>
                <p className="text-lg text-gray-600">Overview of system metrics and analytics</p>
              </div>
              <AdminDashboard />
            </div>
          }
        />

        {/* User Management Route */}
        <Route
          path="/users"
          element={
            <div className="space-y-8">
              <UserManagementTable />
            </div>
          }
        />

        {/* CV Management Route */}
        <Route
          path="/cvs"
          element={
            <div className="space-y-8">
              <CVManagementTable />
            </div>
          }
        />

        {/* Subscription Management Route */}
        <Route
          path="/subscriptions"
          element={
            <div className="space-y-8">
              <SubscriptionManagementTable />
            </div>
          }
        />

        {/* Plan Management Route */}
        <Route
          path="/plans"
          element={
            <div className="space-y-8">
              <PlanManagementTable />
            </div>
          }
        />

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default AdminPage;
