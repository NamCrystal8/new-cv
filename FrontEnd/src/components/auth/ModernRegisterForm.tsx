import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiBaseUrl } from '@/utils/api';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, UserPlus, Sparkles, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRegistrationErrorMessage } from '@/utils/errorMessages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ModernRegisterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Password validation
  const passwordValidation = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const doPasswordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!isPasswordValid) {
      toast({
        variant: "warning",
        title: "Password Requirements",
        description: "Please ensure your password meets all requirements.",
      });
      return;
    }

    if (!doPasswordsMatch) {
      toast({
        variant: "warning",
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
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
        try {
          const errorData = await response.json();
          throw new Error(getRegistrationErrorMessage(errorData));
        } catch (parseError) {
          console.error("Could not parse error response:", parseError);
          throw new Error('Registration failed. Please try again.');
        }
      }

      toast({
        variant: "success",
        title: "Account Created!",
        description: "Registration successful! You can now sign in to your account.",
      });

      // Reset form
      setEmail('');
      setPassword('');
      setConfirmPassword('');

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: err.message || 'An error occurred during registration.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-green-600' : 'text-gray-400'}`}>
      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="flex items-center justify-center p-2 sm:p-4 min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-6rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="backdrop-blur-lg bg-white/80 shadow-2xl border-0 overflow-hidden">
          <CardHeader className="space-y-3 sm:space-y-4 pb-4 sm:pb-6 pt-4 sm:pt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
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
              <CardTitle className="text-lg sm:text-xl font-bold">Create Account</CardTitle>
              <CardDescription className="text-purple-100 text-xs sm:text-sm">
                Join Smart CV Builder and create amazing resumes
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
                    className="pl-10 h-9 sm:h-10 transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 border-gray-200 text-sm focus-glow hover:border-purple-300"
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
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-9 sm:h-10 transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 border-gray-200 text-sm focus-glow hover:border-purple-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation icon-hover-bounce"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password requirements */}
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-1 p-2 bg-gray-50 rounded-lg border"
                  >
                    <div className="text-xs font-medium text-gray-600 mb-1">Password Requirements:</div>
                    <PasswordRequirement met={passwordValidation.minLength} text="At least 8 characters" />
                    <PasswordRequirement met={passwordValidation.hasUppercase} text="One uppercase letter" />
                    <PasswordRequirement met={passwordValidation.hasLowercase} text="One lowercase letter" />
                    <PasswordRequirement met={passwordValidation.hasNumber} text="One number" />
                    <PasswordRequirement met={passwordValidation.hasSpecial} text="One special character" />
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-1"
              >
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-10 pr-10 h-9 sm:h-10 transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 border-gray-200 text-sm focus-glow hover:border-purple-300 ${
                      confirmPassword && !doPasswordsMatch ? 'border-red-300 focus:ring-red-500/20' : ''
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation icon-hover-bounce"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && !doPasswordsMatch && (
                  <div className="text-xs text-red-600 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    Passwords do not match
                  </div>
                )}
                {confirmPassword && doPasswordsMatch && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Passwords match
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading || !email || !isPasswordValid || !doPasswordsMatch}
                  className="w-full h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl touch-manipulation text-sm"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="hidden sm:inline">Creating Account...</span>
                      <span className="sm:hidden">Creating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                      Create Account
                    </div>
                  )}
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center space-y-2 sm:space-y-3"
              >
                <div className="text-xs sm:text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-purple-600 hover:text-purple-700 transition-all duration-300 hover:underline inline-block"
                  >
                    Sign in here
                  </Link>
                </div>

                <div className="text-xs text-gray-500 leading-relaxed">
                  By creating an account, you agree to our terms of service and privacy policy.
                </div>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export { ModernRegisterForm };
export default ModernRegisterForm;
