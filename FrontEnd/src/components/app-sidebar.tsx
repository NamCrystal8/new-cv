import React from "react";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, LogOut, UserPlus, BadgeCheck, FileText, Home } from "lucide-react";
import { useAuth } from "@/App";

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
                className="btn btn-ghost justify-start w-full flex items-center gap-2"
              >
                <Home className="h-5 w-5" /> Home
              </Link>
              <Link 
                to="/my-cvs" 
                className="btn btn-ghost justify-start w-full flex items-center gap-2"
              >
                <FileText className="h-5 w-5" /> My CVs
              </Link>
            </div>
          )}
          
          <div className="flex-1"></div>
          
          {/* Auth buttons at bottom */}
          <div className="flex flex-col gap-4">
            {isAuthenticated === null ? (
              <span>Loading...</span>
            ) : isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="btn btn-primary w-full flex items-center gap-2"
              >
                <LogOut className="h-5 w-5" /> Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary w-full flex items-center gap-2 mb-2">
                  <LogIn className="h-5 w-5" /> Login
                </Link>
                <Link to="/register" className="btn btn-outline w-full flex items-center gap-2">
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