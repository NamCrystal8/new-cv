/**
 * Token-based authentication utilities for cross-domain authentication
 */

import { getApiBaseUrl } from './api';
import { getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from './localStorage';

const TOKEN_KEY = 'cv_auth_token';

/**
 * Store authentication token in localStorage
 */
export const setAuthToken = (token: string): void => {
  setLocalStorageItem(TOKEN_KEY, token);
};

/**
 * Get authentication token from localStorage
 */
export const getAuthToken = (): string | null => {
  return getLocalStorageItem(TOKEN_KEY);
};

/**
 * Remove authentication token from localStorage
 */
export const removeAuthToken = (): void => {
  removeLocalStorageItem(TOKEN_KEY);
};

/**
 * Check if user has a valid token
 */
export const hasAuthToken = (): boolean => {
  return getAuthToken() !== null;
};

/**
 * Login with bearer token authentication
 */
export const loginWithToken = async (email: string, password: string): Promise<{ access_token: string; token_type: string }> => {
  const apiBaseUrl = getApiBaseUrl();
  
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const response = await fetch(`${apiBaseUrl}/auth/bearer/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Login failed');
  }

  const tokenData = await response.json();
  setAuthToken(tokenData.access_token);
  return tokenData;
};

/**
 * Logout and clear token
 */
export const logoutWithToken = async (): Promise<void> => {
  const apiBaseUrl = getApiBaseUrl();
  const token = getAuthToken();
  
  if (token) {
    try {
      await fetch(`${apiBaseUrl}/auth/bearer/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.warn('Logout request failed:', error);
    }
  }
  
  removeAuthToken();
};

/**
 * Make authenticated API request with bearer token
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

/**
 * Get current user with token authentication
 */
export const getCurrentUserWithToken = async () => {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetchWithAuth(`${apiBaseUrl}/users/me`);
  
  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
      throw new Error('Authentication required');
    }
    throw new Error('Failed to get user data');
  }
  
  return response.json();
};

/**
 * Check if we should use token-based auth (now always true for localStorage compatibility)
 */
export const shouldUseTokenAuth = (): boolean => {
  // Always use token-based auth with localStorage for better compatibility
  // This ensures cookies are not used for authentication in any environment
  return true;
};
