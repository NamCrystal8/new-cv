// API configuration utility

/**
 * Get the base URL for API calls
 * In development: uses Vite proxy (/api)
 * In production: uses environment variable or falls back to relative path
 */
export const getApiBaseUrl = (): string => {
  // In development, use the proxy
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // In production, use environment variable or construct from current origin
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // Fallback: assume API is on same domain (for cases where frontend and backend are on same service)
  return '/api';
};

/**
 * Make an API call with the correct base URL
 */
export const apiCall = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
};

/**
 * Helper for form data API calls
 */
export const apiCallFormData = async (endpoint: string, formData: FormData): Promise<Response> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  return fetch(url, {
    method: 'POST',
    body: formData,
  });
};
