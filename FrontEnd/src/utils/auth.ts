/**
 * Authentication utilities for handling login, logout, and auth state
 */
import { getApiBaseUrl } from './api';
import {
  loginWithToken,
  logoutWithToken,
  getCurrentUserWithToken,
  hasAuthToken,
  fetchWithAuth
} from './tokenAuth';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  role_id?: number;
}

/**
 * Login user with email and password
 */
export const loginUser = async (credentials: LoginCredentials): Promise<AuthUser> => {
  // Always use token-based authentication with localStorage
  await loginWithToken(credentials.email, credentials.password);
  return await getCurrentUser();
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<AuthUser> => {
  // Always use token-based authentication with localStorage
  return await getCurrentUserWithToken();
};

/**
 * Logout current user
 */
export const logoutUser = async (): Promise<void> => {
  // Always use token-based authentication with localStorage
  await logoutWithToken();
};

/**
 * Check if user is currently authenticated
 */
export const checkAuthStatus = async (): Promise<boolean> => {
  try {
    // Check if token exists first for performance
    if (!hasAuthToken()) {
      return false;
    }

    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
};

/**
 * Make authenticated API call
 */
export const authenticatedFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Always use token-based authentication with localStorage
  return fetchWithAuth(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};

/**
 * Make authenticated form data API call
 */
export const authenticatedFormDataFetch = async (
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<Response> => {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Always use token-based authentication with localStorage
  return fetchWithAuth(url, {
    method: 'POST',
    ...options,
    body: formData,
    // Don't set Content-Type for FormData - browser will set it with boundary
  });
};

/**
 * Get user-friendly error message from login response
 */
export const getLoginErrorMessage = (errorData: any): string => {
  if (errorData.detail) {
    switch (errorData.detail) {
      case 'LOGIN_BAD_CREDENTIALS':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'LOGIN_USER_NOT_VERIFIED':
        return 'Your account is not verified. Please check your email for verification instructions.';
      case 'ACCOUNT_INACTIVE':
        return 'Your account has been deactivated. Please contact the administrator for assistance.';
      default:
        return errorData.detail;
    }
  }
  return 'Login failed. Please try again.';
};

/**
 * Handle API response errors, especially authentication errors
 */
export const handleApiError = (response: Response, defaultMessage: string = 'An error occurred'): Error => {
  if (response.status === 401) {
    return new Error('Your session has expired. Please login again.');
  } else if (response.status === 403) {
    return new Error('You do not have permission to perform this action.');
  } else if (response.status === 429) {
    return new Error('Too many requests. Please try again later.');
  } else {
    return new Error(`${defaultMessage} (Status: ${response.status})`);
  }
};

/**
 * Retry API call with authentication
 */
export const retryWithAuth = async (
  apiCall: () => Promise<Response>,
  maxRetries: number = 1
): Promise<Response> => {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await apiCall();
      
      if (response.status === 401 && i < maxRetries) {
        // Try to refresh auth state
        await checkAuthStatus();
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      if (i === maxRetries) {
        throw lastError;
      }
    }
  }
  
  throw lastError!;
};
