/**
 * Debug component to test authentication status and API calls
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/App';
import { getApiBaseUrl } from '@/utils/api';

export const AuthDebug: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testAuthStatus = async () => {
    setLoading(true);
    addTestResult('🔍 Testing authentication status...');
    
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/users/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUserInfo(userData);
        addTestResult(`✅ Authentication successful: ${userData.email}`);
        addTestResult(`📋 User data: ${JSON.stringify(userData, null, 2)}`);
      } else {
        addTestResult(`❌ Authentication failed: ${response.status} ${response.statusText}`);
        setUserInfo(null);
      }
    } catch (error) {
      addTestResult(`❌ Network error: ${error}`);
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const testProtectedEndpoint = async () => {
    setLoading(true);
    addTestResult('🔍 Testing protected endpoint...');
    
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/subscription/status`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        addTestResult(`✅ Protected endpoint accessible`);
        addTestResult(`📋 Subscription data: ${JSON.stringify(data, null, 2)}`);
      } else {
        addTestResult(`❌ Protected endpoint failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      addTestResult(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setUserInfo(null);
  };

  useEffect(() => {
    addTestResult(`🚀 Auth Debug component loaded`);
    addTestResult(`📊 Auth context state: ${isAuthenticated}`);
  }, [isAuthenticated]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🔧 Authentication Debug Panel</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Panel */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Current Status</h3>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Auth Context:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  isAuthenticated === true ? 'bg-green-100 text-green-800' :
                  isAuthenticated === false ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {isAuthenticated === null ? 'Loading' : isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">API Base URL:</span>
                <span className="text-sm text-gray-600">{getApiBaseUrl()}</span>
              </div>
              
              {userInfo && (
                <div className="mt-4">
                  <span className="font-medium">User Info:</span>
                  <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-auto">
                    {JSON.stringify(userInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Test Buttons */}
          <div className="space-y-2">
            <button
              onClick={testAuthStatus}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Auth Status'}
            </button>
            
            <button
              onClick={testProtectedEndpoint}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Protected Endpoint'}
            </button>
            
            <button
              onClick={clearResults}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Test Results</h3>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-auto font-mono text-sm">
            {testResults.length === 0 ? (
              <div className="text-gray-500">No test results yet. Click a test button to start.</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">🔍 Debugging Tips:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• If auth status shows "Not Authenticated" but you're logged in, check cookie settings</li>
          <li>• 401 errors usually mean the authentication cookie is missing or expired</li>
          <li>• 403 errors mean you're authenticated but don't have permission</li>
          <li>• Check browser dev tools → Application → Cookies for "cvapp" cookie</li>
          <li>• Make sure all API calls include `credentials: 'include'`</li>
        </ul>
      </div>
    </div>
  );
};

export default AuthDebug;
