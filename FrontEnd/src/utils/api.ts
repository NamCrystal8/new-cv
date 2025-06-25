// API configuration utility

/**
 * Get the base URL for API calls
 * In development: uses Vite proxy (/api)
 * In production: uses environment variable or fallback URL
 */
export const getApiBaseUrl = (): string => {
  // Check if we're in development mode
  const isDevelopment = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.port === '5173';

  // Debug logging
  console.log('API Configuration:', {
    isDevelopment,
    hostname: window.location.hostname,
    port: window.location.port,
    origin: window.location.origin,
    envApiUrl: import.meta.env.VITE_API_BASE_URL
  });

  // In development, use the proxy
  if (isDevelopment) {
    console.log('Using development proxy: /api');
    return '/api';
  }

  // In production, use environment variable or fallback
  const productionApiUrl = import.meta.env.VITE_API_BASE_URL || 'https://new-cv-9zoc.onrender.com';
  console.log('Using production API URL:', productionApiUrl);
  return productionApiUrl;
};

/**
 * Make an API call with the correct base URL
 * @deprecated Use authenticatedFetch from utils/auth.ts for authenticated requests
 */
export const apiCall = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  return fetch(url, {
    ...options,
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
};

/**
 * Helper for form data API calls
 * @deprecated Use authenticatedFormDataFetch from utils/auth.ts instead for authenticated requests
 */
export const apiCallFormData = async (endpoint: string, formData: FormData): Promise<Response> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  return fetch(url, {
    method: 'POST',
    body: formData,
  });
};
