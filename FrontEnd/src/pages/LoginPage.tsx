import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/App';
import { ModernLoginForm } from '@/components/auth/ModernLoginForm';
import { useToast } from '@/hooks/use-toast';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (email: string, password: string): Promise<void> => {
    // FastAPI Users login expects form data, not JSON
    const formData = new URLSearchParams();
    formData.append('username', email); // FastAPI Users uses 'username' for email by default
    formData.append('password', password);

    const response = await fetch('/api/auth/jwt/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Login failed');
    }

    setIsAuthenticated(true);
    toast({
      title: "Welcome back!",
      description: "You have successfully logged in.",
      variant: "success",
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <ModernLoginForm onLogin={handleLogin} />
    </div>
  );
};

export default LoginPage;
