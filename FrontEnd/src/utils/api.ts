// API configuration utility

/**
 * Get the base URL for API calls
 * In development: uses Vite proxy (/api)
 * In production: uses hardcoded backend URL
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
    origin: window.location.origin
  });

  // In development, use the proxy
  if (isDevelopment) {
    console.log('Using development proxy: /api');
    return '/api';
  }

  // In production, use your backend URL
  const productionApiUrl = 'https://new-cv-7jve.onrender.com';
  console.log('Using production API URL:', productionApiUrl);
  return productionApiUrl;
};

/**
 * Make an API call with the correct base URL
 */
export const apiCall = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  return fetch(url, {
    ...options,
    mode: 'cors',
    credentials: 'include',
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
    credentials: 'include', // Important for authentication
    body: formData,
  });
};
