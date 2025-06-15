import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogIn, LogOut, UserPlus, BadgeCheck, FileText, Home, Crown, Shield, ChevronDown, BarChart3, Users, Settings, Code } from "lucide-react";
import { useAuth } from "@/App";
import { SubscriptionStatus } from "./SubscriptionStatus";
import { useState, useEffect } from "react";
import { logoutUser, authenticatedFetch } from "@/utils/auth";

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
      const response = await authenticatedFetch('/admin/health');
      setIsAdmin(response.ok);
    } catch {
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsAuthenticated(false);
      navigate("/login");
    } catch (error) {
      // Optionally show error
      console.error('Logout error:', error);
      // Still set authenticated to false even if logout request fails
      setIsAuthenticated(false);
      navigate("/login");
    }
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 h-full">
          {/* App name/logo */}
          <div className="flex items-center gap-2 mb-1 sm:mb-2 text-lg sm:text-xl font-bold text-primary fade-in">
            <BadgeCheck className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 icon-hover-bounce" />
            <span className="group-data-[collapsible=icon]:hidden transition-opacity duration-300">Smart CV Builder</span>
          </div>

          {/* Main navigation items */}
          {isAuthenticated && (
            <div className="flex flex-col gap-1 sm:gap-2 slide-in-left">
              <Link
                to="/"
                className="group flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-300 ease-out w-full touch-manipulation min-h-[44px] hover:shadow-md hover:[&>svg]:!text-blue-600"
              >
                <Home className="h-5 w-5 flex-shrink-0 icon-hover-bounce text-gray-400 transition-colors duration-300" />
                <span className="group-data-[collapsible=icon]:hidden transition-all duration-300">Home</span>
              </Link>
              <Link
                to="/my-cvs"
                className="group flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-300 ease-out w-full touch-manipulation min-h-[44px] hover:shadow-md hover:[&>svg]:!text-blue-600"
              >
                <FileText className="h-5 w-5 flex-shrink-0 icon-hover-bounce text-gray-400 transition-colors duration-300" />
                <span className="group-data-[collapsible=icon]:hidden transition-all duration-300">My CVs</span>
              </Link>
              <Link
                to="/subscription"
                className="group flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-300 ease-out w-full touch-manipulation min-h-[44px] hover:shadow-md hover:[&>svg]:!text-yellow-500"
              >
                <Crown className="h-5 w-5 flex-shrink-0 icon-hover-rotate text-gray-400 transition-colors duration-300" />
                <span className="group-data-[collapsible=icon]:hidden transition-all duration-300">Subscription</span>
              </Link>
              <Link
                to="/testing-apis"
                className="group flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-300 ease-out w-full touch-manipulation min-h-[44px] hover:shadow-md hover:[&>svg]:!text-green-600"
              >
                <Code className="h-5 w-5 flex-shrink-0 icon-hover-bounce text-gray-400 transition-colors duration-300" />
                <span className="group-data-[collapsible=icon]:hidden transition-all duration-300">API Testing</span>
              </Link>
              {isAdmin && (
                <div className="border border-red-200 rounded-lg overflow-hidden fade-in hover:shadow-lg transition-all duration-300">
                  {/* Admin Section Header */}
                  <button
                    type="button"
                    onClick={() => setAdminSectionOpen(!adminSectionOpen)}
                    className="group flex items-center justify-between w-full px-3 sm:px-4 py-2 sm:py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-300 ease-out touch-manipulation min-h-[44px] hover:[&>div>svg]:!text-red-600"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 flex-shrink-0 icon-hover-bounce text-gray-400 transition-colors duration-300" />
                      <span className="font-medium group-data-[collapsible=icon]:hidden transition-all duration-300">Admin Panel</span>
                    </div>
                    <div className="group-data-[collapsible=icon]:hidden">
                      <div className={`transition-transform duration-300 ease-out ${adminSectionOpen ? 'rotate-180' : 'rotate-0'}`}>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </button>

                  {/* Admin Sub-navigation */}
                  <div className={`bg-gray-50 border-t border-red-200 group-data-[collapsible=icon]:hidden transition-all duration-300 ease-out overflow-hidden ${
                    adminSectionOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="space-y-1 p-1">
                      <Link
                        to="/admin/dashboard"
                        className={`group flex items-center gap-3 px-4 sm:px-6 py-2 sm:py-2.5 text-sm transition-all duration-300 ease-out touch-manipulation min-h-[40px] rounded-md hover:[&>svg]:!text-red-600 ${
                          location.pathname === '/admin/dashboard' || location.pathname === '/admin'
                            ? 'bg-red-100 text-red-700 border-r-2 border-red-500 shadow-sm'
                            : 'text-gray-600 hover:bg-red-50 hover:text-red-600 hover:shadow-sm'
                        }`}
                      >
                        <BarChart3 className="h-4 w-4 flex-shrink-0 icon-hover-bounce text-gray-400 transition-colors duration-300" />
                        <span className="transition-all duration-300">Dashboard</span>
                      </Link>
                      <Link
                        to="/admin/users"
                        className={`group flex items-center gap-3 px-4 sm:px-6 py-2 sm:py-2.5 text-sm transition-all duration-300 ease-out touch-manipulation min-h-[40px] rounded-md hover:[&>svg]:!text-red-600 ${
                          location.pathname === '/admin/users'
                            ? 'bg-red-100 text-red-700 border-r-2 border-red-500 shadow-sm'
                            : 'text-gray-600 hover:bg-red-50 hover:text-red-600 hover:shadow-sm'
                        }`}
                      >
                        <Users className="h-4 w-4 flex-shrink-0 icon-hover-bounce text-gray-400 transition-colors duration-300" />
                        <span className="transition-all duration-300">User Management</span>
                      </Link>
                      <Link
                        to="/admin/cvs"
                        className={`group flex items-center gap-3 px-4 sm:px-6 py-2 sm:py-2.5 text-sm transition-all duration-300 ease-out touch-manipulation min-h-[40px] rounded-md hover:[&>svg]:!text-red-600 ${
                          location.pathname === '/admin/cvs'
                            ? 'bg-red-100 text-red-700 border-r-2 border-red-500 shadow-sm'
                            : 'text-gray-600 hover:bg-red-50 hover:text-red-600 hover:shadow-sm'
                        }`}
                      >
                        <FileText className="h-4 w-4 flex-shrink-0 icon-hover-bounce text-gray-400 transition-colors duration-300" />
                        <span className="transition-all duration-300">CV Management</span>
                      </Link>
                      <Link
                        to="/admin/subscriptions"
                        className={`group flex items-center gap-3 px-4 sm:px-6 py-2 sm:py-2.5 text-sm transition-all duration-300 ease-out touch-manipulation min-h-[40px] rounded-md hover:[&>svg]:!text-yellow-500 ${
                          location.pathname === '/admin/subscriptions'
                            ? 'bg-red-100 text-red-700 border-r-2 border-red-500 shadow-sm'
                            : 'text-gray-600 hover:bg-red-50 hover:text-red-600 hover:shadow-sm'
                        }`}
                      >
                        <Crown className="h-4 w-4 flex-shrink-0 icon-hover-rotate text-gray-400 transition-colors duration-300" />
                        <span className="transition-all duration-300">Subscriptions</span>
                      </Link>
                      <Link
                        to="/admin/plans"
                        className={`group flex items-center gap-3 px-4 sm:px-6 py-2 sm:py-2.5 text-sm transition-all duration-300 ease-out touch-manipulation min-h-[40px] rounded-md hover:[&>svg]:!text-gray-700 ${
                          location.pathname === '/admin/plans'
                            ? 'bg-red-100 text-red-700 border-r-2 border-red-500 shadow-sm'
                            : 'text-gray-600 hover:bg-red-50 hover:text-red-600 hover:shadow-sm'
                        }`}
                      >
                        <Settings className="h-4 w-4 flex-shrink-0 icon-hover-rotate text-gray-400 transition-colors duration-300" />
                        <span className="transition-all duration-300">Plan Management</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Subscription Status */}
          {isAuthenticated && (
            <div className="mt-3 sm:mt-4 fade-in">
              <SubscriptionStatus />
            </div>
          )}

          <div className="flex-1"></div>

          {/* Auth buttons at bottom */}
          <div className="flex flex-col gap-3 sm:gap-4 fade-in">
            {isAuthenticated === null ? (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pulse-slow">
                <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
                <span>Loading...</span>
              </div>
            ) : isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="group flex items-center justify-center gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 ease-out shadow-md hover:shadow-xl w-full touch-manipulation min-h-[44px]"
              >
                <LogOut className="h-5 w-5 flex-shrink-0 icon-hover-bounce" />
                <span className="group-data-[collapsible=icon]:hidden transition-all duration-300">Logout</span>
              </button>
            ) : (
              <>
                <Link to="/login" className="group flex items-center justify-center gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 ease-out shadow-md hover:shadow-xl w-full mb-2 touch-manipulation min-h-[44px]">
                  <LogIn className="h-5 w-5 flex-shrink-0 icon-hover-bounce" />
                  <span className="group-data-[collapsible=icon]:hidden transition-all duration-300">Login</span>
                </Link>
                <Link to="/register" className="group flex items-center justify-center gap-3 px-3 sm:px-4 py-2 sm:py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-medium rounded-lg transition-all duration-300 ease-out hover:shadow-lg w-full touch-manipulation min-h-[44px]">
                  <UserPlus className="h-5 w-5 flex-shrink-0 icon-hover-bounce" />
                  <span className="group-data-[collapsible=icon]:hidden transition-all duration-300">Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}