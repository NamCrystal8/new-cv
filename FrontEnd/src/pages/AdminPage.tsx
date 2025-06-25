import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Shield, AlertTriangle } from 'lucide-react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { CVManagementTable } from '@/components/admin/CVManagementTable';
import { SubscriptionManagementTable } from '@/components/admin/SubscriptionManagementTable';
import { PlanManagementTable } from '@/components/admin/PlanManagementTable';
import { authenticatedFetch } from '@/utils/auth';
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
      const response = await authenticatedFetch('/admin/health');

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm sm:max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900 text-lg sm:text-xl">Access Denied</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              You don't have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
              This area is restricted to administrators only. If you believe this is an error,
              please contact your system administrator.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium touch-manipulation"
            >
              Return to Home
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-wide mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <Routes>
        {/* Default redirect to dashboard */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <div className="mb-4 sm:mb-6 lg:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                  <Shield className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-red-600" />
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Admin Dashboard</h1>
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600">Overview of system metrics and analytics</p>
              </div>
              <AdminDashboard />
            </div>
          }
        />

        {/* User Management Route */}
        <Route
          path="/users"
          element={
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <UserManagementTable />
            </div>
          }
        />

        {/* CV Management Route */}
        <Route
          path="/cvs"
          element={
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <CVManagementTable />
            </div>
          }
        />

        {/* Subscription Management Route */}
        <Route
          path="/subscriptions"
          element={
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <SubscriptionManagementTable />
            </div>
          }
        />

        {/* Plan Management Route */}
        <Route
          path="/plans"
          element={
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
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
