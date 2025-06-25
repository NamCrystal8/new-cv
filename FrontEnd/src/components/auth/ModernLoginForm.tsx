import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '@/App';
import { useToast } from '@/hooks/use-toast';
import { loginUser } from '@/utils/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ModernLoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      // Use the environment-aware login function
      await loginUser({ email, password });

      setIsAuthenticated(true);

      toast({
        variant: "success",
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });

      // Small delay to show the success toast
      setTimeout(() => {
        navigate('/');
      }, 1000);

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: err.message || 'An error occurred during login.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-2 sm:p-4 min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-6rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="backdrop-blur-lg bg-white/80 shadow-2xl border-0 overflow-hidden">
          <CardHeader className="space-y-3 sm:space-y-4 pb-4 sm:pb-6 pt-4 sm:pt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-lg"
              >
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.div>
            </div>
            <div className="text-center space-y-1">
              <CardTitle className="text-lg sm:text-xl font-bold">Welcome Back</CardTitle>
              <CardDescription className="text-blue-100 text-xs sm:text-sm">
                Sign in to your Smart CV Builder account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-4 lg:p-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-1"
              >
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-9 sm:h-10 transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 border-gray-200 text-sm focus-glow hover:border-blue-300"
                    required
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-1"
              >
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-9 sm:h-10 transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 border-gray-200 text-sm focus-glow hover:border-blue-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation icon-hover-bounce"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full h-9 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl touch-manipulation text-sm"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="hidden sm:inline">Signing In...</span>
                      <span className="sm:hidden">Loading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
                      Sign In
                    </div>
                  )}
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center space-y-2 sm:space-y-3"
              >
                <div className="text-xs sm:text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-all duration-300 hover:underline inline-block"
                  >
                    Create one here
                  </Link>
                </div>

                <div className="text-xs text-gray-500 leading-relaxed">
                  By signing in, you agree to our terms of service and privacy policy.
                </div>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export { ModernLoginForm };
export default ModernLoginForm;
