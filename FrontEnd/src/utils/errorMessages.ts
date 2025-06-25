/**
 * Utility functions for converting technical error messages to user-friendly ones
 */

export interface ErrorResponse {
  detail?: string;
  message?: string;
  error?: string;
}

/**
 * Convert technical error codes and messages to user-friendly messages
 */
export const getUserFriendlyErrorMessage = (
  error: string | ErrorResponse | null | undefined,
  defaultMessage: string = 'An error occurred. Please try again.'
): string => {
  if (!error) return defaultMessage;
  
  // Extract the error detail/message
  let errorDetail: string;
  if (typeof error === 'string') {
    errorDetail = error;
  } else if (error.detail) {
    errorDetail = error.detail;
  } else if (error.message) {
    errorDetail = error.message;
  } else if (error.error) {
    errorDetail = error.error;
  } else {
    return defaultMessage;
  }
  
  // Convert to lowercase for easier matching
  const lowerDetail = errorDetail.toLowerCase();
  
  // Authentication errors
  if (lowerDetail.includes('login_bad_credentials') || 
      lowerDetail.includes('bad_credentials') ||
      lowerDetail.includes('invalid credentials') ||
      lowerDetail.includes('incorrect')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (lowerDetail.includes('inactive') ||
      lowerDetail.includes('deactivated') ||
      lowerDetail.includes('disabled') ||
      lowerDetail.includes('account_inactive')) {
    return 'Your account has been deactivated. Please contact the administrator for assistance.';
  }
  
  if (lowerDetail.includes('not_verified') || 
      lowerDetail.includes('unverified') ||
      lowerDetail.includes('verify')) {
    return 'Please verify your email address before logging in.';
  }
  
  if (lowerDetail.includes('user_not_exists') || 
      lowerDetail.includes('not found') ||
      lowerDetail.includes('does not exist')) {
    return 'No account found with this email address.';
  }
  
  // Account status errors
  if (errorDetail === 'ACCOUNT_INACTIVE') {
    return 'Your account has been deactivated. Please contact the administrator for assistance.';
  }

  // Registration errors
  if (errorDetail === 'REGISTER_USER_ALREADY_EXISTS' ||
      lowerDetail.includes('already exists') ||
      lowerDetail.includes('user_already_exists')) {
    return 'An account with this email address already exists. Please try logging in instead.';
  }
  
  // Rate limiting
  if (lowerDetail.includes('too many') || 
      lowerDetail.includes('rate limit') ||
      lowerDetail.includes('attempts')) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  
  // Validation errors
  if (lowerDetail.includes('validation error') || 
      lowerDetail.includes('invalid') ||
      (lowerDetail.includes('email') && lowerDetail.includes('format'))) {
    return 'Please check your email format and try again.';
  }
  
  if (lowerDetail.includes('password') && lowerDetail.includes('weak')) {
    return 'Password is too weak. Please choose a stronger password.';
  }
  
  if (lowerDetail.includes('password') && lowerDetail.includes('short')) {
    return 'Password is too short. Please choose a longer password.';
  }
  
  // Permission errors
  if (lowerDetail.includes('forbidden') || 
      lowerDetail.includes('access denied') ||
      lowerDetail.includes('unauthorized')) {
    return 'You do not have permission to perform this action.';
  }
  
  // Server errors
  if (lowerDetail.includes('internal server error') || 
      lowerDetail.includes('500')) {
    return 'Server error. Please try again later.';
  }
  
  if (lowerDetail.includes('service unavailable') || 
      lowerDetail.includes('503')) {
    return 'Service is temporarily unavailable. Please try again later.';
  }
  
  // Network errors
  if (lowerDetail.includes('network') || 
      lowerDetail.includes('connection') ||
      lowerDetail.includes('timeout')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // If it's a technical error code (contains underscores or all caps), provide generic message
  if (errorDetail.includes('_') || errorDetail.toUpperCase() === errorDetail) {
    return defaultMessage;
  }
  
  // Return the original message if it seems user-friendly
  return errorDetail;
};

/**
 * Specific error message handlers for different contexts
 */
export const getLoginErrorMessage = (error: string | ErrorResponse | null | undefined): string => {
  return getUserFriendlyErrorMessage(error, 'Login failed. Please check your credentials and try again.');
};

export const getRegistrationErrorMessage = (error: string | ErrorResponse | null | undefined): string => {
  return getUserFriendlyErrorMessage(error, 'Registration failed. Please check your information and try again.');
};

export const getApiErrorMessage = (error: string | ErrorResponse | null | undefined): string => {
  return getUserFriendlyErrorMessage(error, 'An error occurred. Please try again.');
};

/**
 * Extract error message from fetch response
 */
export const extractErrorFromResponse = async (response: Response): Promise<string> => {
  try {
    const errorData = await response.json();
    return getUserFriendlyErrorMessage(errorData);
  } catch {
    return `Server error (${response.status}). Please try again.`;
  }
};

/**
 * Common error messages for specific scenarios
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  ACCOUNT_DEACTIVATED: 'Your account has been deactivated. Please contact the administrator for assistance.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before continuing.',
  RATE_LIMITED: 'Too many attempts. Please wait a few minutes and try again.',
} as const;
