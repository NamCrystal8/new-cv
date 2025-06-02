import React from "react";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, LogOut, UserPlus, BadgeCheck, FileText, Home, Crown } from "lucide-react";
import { useAuth } from "@/App";
import { SubscriptionStatus } from "./SubscriptionStatus";

export function AppSidebar() {
  const { isAuthenticated, setIsAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/jwt/logout", { method: "POST" });
      setIsAuthenticated(false);
      navigate("/login");
    } catch (error) {
      // Optionally show error
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