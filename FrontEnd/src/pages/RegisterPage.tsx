import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernRegisterForm } from '@/components/auth/ModernRegisterForm';
import { useToast } from '@/hooks/use-toast';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (email: string, password: string): Promise<void> => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        is_active: true,
        is_superuser: false,
        is_verified: false,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Registration failed.';
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          if (errorData.detail === 'REGISTER_USER_ALREADY_EXISTS') {
            errorMessage = 'An account with this email already exists.';
          } else if (errorData.detail.includes('validation error')) {
            errorMessage = 'Invalid input. Please check your email and password.';
          } else {
            errorMessage = errorData.detail;
          }
        }
      } catch (parseError) {
        console.error("Could not parse error response:", parseError);
      }
      throw new Error(errorMessage);
    }

    toast({
      title: "Registration successful!",
      description: "Please check your email to verify your account (if required) or login.",
      variant: "success",
    });

    // Redirect to login page after successful registration
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <ModernRegisterForm onRegister={handleRegister} />
    </div>
  );
};

export default RegisterPage;
