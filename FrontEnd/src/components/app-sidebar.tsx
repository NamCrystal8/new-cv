import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogIn, LogOut, UserPlus, BadgeCheck, FileText, Home, Crown, Shield, ChevronDown, ChevronRight, BarChart3, Users, Settings } from "lucide-react";
import { useAuth } from "@/App";
import { SubscriptionStatus } from "./SubscriptionStatus";
import { useState, useEffect } from "react";
import { getApiBaseUrl } from "@/utils/api";

export function AppSidebar() {
  const { isAuthenticated, setIsAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminSectionOpen, setAdminSectionOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      checkAdminAccess();
    }
  }, [isAuthenticated]);

  // Auto-open admin section when on admin pages
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      setAdminSectionOpen(true);
    }
  }, [location.pathname]);

  const checkAdminAccess = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/admin/health`, {
        credentials: 'include', // Important for authentication
      });
      setIsAdmin(response.ok);
    } catch {
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      await fetch(`${apiBaseUrl}/auth/jwt/logout`, {
        method: "POST",
        credentials: 'include' // Important for cookie-based auth
      });
      setIsAuthenticated(false);
      navigate("/login");
    } catch (error) {
      // Optionally show error
      console.error('Logout error:', error);
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <div className="flex flex-col gap-6 p-4 h-full">
          {/* App name/logo */}
          <div className="flex items-center gap-2 mb-2 text-xl font-bold text-primary">
            <BadgeCheck className="h-7 w-7 text-blue-600" />
            <span>Smart CV Builder</span>
          </div>
          
          {/* Main navigation items */}
          {isAuthenticated && (
            <div className="flex flex-col gap-2">
              <Link 
                to="/" 
                className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors duration-200 w-full"
              >
                <Home className="h-5 w-5" /> Home
              </Link>
              <Link 
                to="/my-cvs" 
                className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors duration-200 w-full"
              >
                <FileText className="h-5 w-5" /> My CVs
              </Link>
              <Link
                to="/subscription"
                className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors duration-200 w-full"
              >
                <Crown className="h-5 w-5" /> Subscription
              </Link>
              {isAdmin && (
                <div className="border border-red-200 rounded-lg overflow-hidden">
                  {/* Admin Section Header */}
                  <button
                    type="button"
                    onClick={() => setAdminSectionOpen(!adminSectionOpen)}
                    className="flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      <span className="font-medium">Admin Panel</span>
                    </div>
                    {adminSectionOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {/* Admin Sub-navigation */}
                  {adminSectionOpen && (
                    <div className="bg-gray-50 border-t border-red-200">
                      <Link
                        to="/admin/dashboard"
                        className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors duration-200 ${
                          location.pathname === '/admin/dashboard' || location.pathname === '/admin'
                            ? 'bg-red-100 text-red-700 border-r-2 border-red-500'
                            : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        <BarChart3 className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link
                        to="/admin/users"
                        className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors duration-200 ${
                          location.pathname === '/admin/users'
                            ? 'bg-red-100 text-red-700 border-r-2 border-red-500'
                            : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        <Users className="h-4 w-4" />
                        User Management
                      </Link>
                      <Link
                        to="/admin/cvs"
                        className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors duration-200 ${
                          location.pathname === '/admin/cvs'
                            ? 'bg-red-100 text-red-700 border-r-2 border-red-500'
                            : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        <FileText className="h-4 w-4" />
                        CV Management
                      </Link>
                      <Link
                        to="/admin/subscriptions"
                        className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors duration-200 ${
                          location.pathname === '/admin/subscriptions'
                            ? 'bg-red-100 text-red-700 border-r-2 border-red-500'
                            : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        <Crown className="h-4 w-4" />
                        Subscriptions
                      </Link>
                      <Link
                        to="/admin/plans"
                        className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors duration-200 ${
                          location.pathname === '/admin/plans'
                            ? 'bg-red-100 text-red-700 border-r-2 border-red-500'
                            : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        <Settings className="h-4 w-4" />
                        Plan Management
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Subscription Status */}
          {isAuthenticated && (
            <div className="mt-4">
              <SubscriptionStatus />
            </div>
          )}
          
          <div className="flex-1"></div>
          
          {/* Auth buttons at bottom */}
          <div className="flex flex-col gap-4">
            {isAuthenticated === null ? (
              <span>Loading...</span>
            ) : isAuthenticated ? (              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full"
              >
                <LogOut className="h-5 w-5" /> Logout
              </button>
            ) : (              <>
                <Link to="/login" className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full mb-2">
                  <LogIn className="h-5 w-5" /> Login
                </Link>
                <Link to="/register" className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-medium rounded-lg transition-all duration-200 w-full">
                  <UserPlus className="h-5 w-5" /> Register
                </Link>
              </>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}