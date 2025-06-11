/**
 * Authentication testing utilities to verify frontend-backend compatibility
 */

import { getApiBaseUrl } from './api';
import { shouldUseTokenAuth, loginWithToken, fetchWithAuth, getAuthToken } from './tokenAuth';
import { loginUser, getCurrentUser, authenticatedFetch } from './auth';

export interface AuthTestResult {
  test: string;
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Test environment detection
 */
export const testEnvironmentDetection = (): AuthTestResult => {
  const isDevelopment = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';
  const useTokenAuth = shouldUseTokenAuth();
  const apiBaseUrl = getApiBaseUrl();

  return {
    test: 'Environment Detection',
    success: true,
    message: `Environment: ${isDevelopment ? 'Development' : 'Production'}, Token Auth: ${useTokenAuth}`,
    details: {
      isDevelopment,
      useTokenAuth,
      apiBaseUrl,
      hostname: window.location.hostname,
      port: window.location.port
    }
  };
};

/**
 * Test API endpoints availability
 */
export const testApiEndpoints = async (): Promise<AuthTestResult> => {
  const apiBaseUrl = getApiBaseUrl();
  
  try {
    // Test health endpoint
    const healthResponse = await fetch(`${apiBaseUrl}/health`);
    const healthOk = healthResponse.ok;

    // Test auth endpoints
    const jwtLoginResponse = await fetch(`${apiBaseUrl}/auth/jwt/login`, { method: 'OPTIONS' });
    const bearerLoginResponse = await fetch(`${apiBaseUrl}/auth/bearer/login`, { method: 'OPTIONS' });

    return {
      test: 'API Endpoints',
      success: healthOk,
      message: healthOk ? 'API endpoints accessible' : 'API endpoints not accessible',
      details: {
        health: healthResponse.status,
        jwtLogin: jwtLoginResponse.status,
        bearerLogin: bearerLoginResponse.status,
        apiBaseUrl
      }
    };
  } catch (error) {
    return {
      test: 'API Endpoints',
      success: false,
      message: `API connection failed: ${error}`,
      details: { error: String(error), apiBaseUrl }
    };
  }
};

/**
 * Test authentication flow with test credentials
 */
export const testAuthenticationFlow = async (email: string, password: string): Promise<AuthTestResult[]> => {
  const results: AuthTestResult[] = [];

  try {
    // Test 1: Login
    try {
      await loginUser({ email, password });
      results.push({
        test: 'Login',
        success: true,
        message: 'Login successful',
        details: { useTokenAuth: shouldUseTokenAuth() }
      });
    } catch (error) {
      results.push({
        test: 'Login',
        success: false,
        message: `Login failed: ${error}`,
        details: { error: String(error) }
      });
      return results; // Stop if login fails
    }

    // Test 2: Get current user
    try {
      const user = await getCurrentUser();
      results.push({
        test: 'Get Current User',
        success: true,
        message: 'User data retrieved successfully',
        details: { userId: user.id, email: user.email }
      });
    } catch (error) {
      results.push({
        test: 'Get Current User',
        success: false,
        message: `Failed to get user data: ${error}`,
        details: { error: String(error) }
      });
    }

    // Test 3: Authenticated API call
    try {
      const response = await authenticatedFetch('/users/me');
      const success = response.ok;
      results.push({
        test: 'Authenticated API Call',
        success,
        message: success ? 'Authenticated request successful' : `Request failed with status ${response.status}`,
        details: { status: response.status, useTokenAuth: shouldUseTokenAuth() }
      });
    } catch (error) {
      results.push({
        test: 'Authenticated API Call',
        success: false,
        message: `Authenticated request failed: ${error}`,
        details: { error: String(error) }
      });
    }

    // Test 4: Token presence (if using token auth)
    if (shouldUseTokenAuth()) {
      const token = getAuthToken();
      results.push({
        test: 'Token Storage',
        success: !!token,
        message: token ? 'Token stored successfully' : 'No token found',
        details: { hasToken: !!token, tokenLength: token?.length || 0 }
      });
    }

  } catch (error) {
    results.push({
      test: 'Authentication Flow',
      success: false,
      message: `Unexpected error: ${error}`,
      details: { error: String(error) }
    });
  }

  return results;
};

/**
 * Test protected endpoint access
 */
export const testProtectedEndpoints = async (): Promise<AuthTestResult[]> => {
  const results: AuthTestResult[] = [];
  
  const endpoints = [
    '/users/me',
    '/subscription/status',
    '/cv/user-cvs',
    '/admin/health' // This might fail if user is not admin
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await authenticatedFetch(endpoint);
      const isAdminEndpoint = endpoint.includes('/admin/');
      const expectedToFail = isAdminEndpoint; // Admin endpoints might fail for non-admin users
      
      results.push({
        test: `Protected Endpoint: ${endpoint}`,
        success: response.ok || (expectedToFail && response.status === 403),
        message: response.ok ? 'Access granted' : 
                expectedToFail && response.status === 403 ? 'Access denied (expected for non-admin)' :
                `Access denied (${response.status})`,
        details: { 
          status: response.status, 
          endpoint,
          isAdminEndpoint,
          useTokenAuth: shouldUseTokenAuth()
        }
      });
    } catch (error) {
      results.push({
        test: `Protected Endpoint: ${endpoint}`,
        success: false,
        message: `Request failed: ${error}`,
        details: { error: String(error), endpoint }
      });
    }
  }

  return results;
};

/**
 * Run comprehensive authentication tests
 */
export const runAuthenticationTests = async (email?: string, password?: string): Promise<{
  summary: { total: number; passed: number; failed: number };
  results: AuthTestResult[];
}> => {
  const results: AuthTestResult[] = [];

  // Test 1: Environment Detection
  results.push(testEnvironmentDetection());

  // Test 2: API Endpoints
  results.push(await testApiEndpoints());

  // Test 3: Authentication Flow (if credentials provided)
  if (email && password) {
    const authResults = await testAuthenticationFlow(email, password);
    results.push(...authResults);

    // Test 4: Protected Endpoints (only if authenticated)
    const loginSuccess = authResults.find(r => r.test === 'Login')?.success;
    if (loginSuccess) {
      const protectedResults = await testProtectedEndpoints();
      results.push(...protectedResults);
    }
  }

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    summary: { total: results.length, passed, failed },
    results
  };
};

/**
 * Display test results in console
 */
export const displayTestResults = (testResults: { summary: any; results: AuthTestResult[] }) => {
  console.group('🧪 Authentication Test Results');
  
  console.log(`📊 Summary: ${testResults.summary.passed}/${testResults.summary.total} tests passed`);
  
  testResults.results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.test}: ${result.message}`);
    if (result.details) {
      console.log('   Details:', result.details);
    }
  });
  
  console.groupEnd();
  
  return testResults.summary.failed === 0;
};
