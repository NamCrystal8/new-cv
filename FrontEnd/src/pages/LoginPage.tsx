import React from 'react';
import { ModernLoginForm } from '@/components/auth/ModernLoginForm';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <ModernLoginForm />
    </div>
  );
};

export default LoginPage;
