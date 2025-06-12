import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '@/utils/api';
import { shouldUseTokenAuth } from '@/utils/tokenAuth';

const ApiUrlDebug: React.FC = () => {
  const [apiUrl, setApiUrl] = useState<string>('');
  const [useTokenAuth, setUseTokenAuth] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [authBackends, setAuthBackends] = useState<any>(null);

  useEffect(() => {
    // Get API configuration
    const url = getApiBaseUrl();
    const tokenAuth = shouldUseTokenAuth();
    setApiUrl(url);
    setUseTokenAuth(tokenAuth);

    // Test health endpoint
    testHealthEndpoint(url);
    testAuthBackends(url);
  }, []);

  const testHealthEndpoint = async (url: string) => {
    try {
      const response = await fetch(`${url}/health`);
      const data = await response.json();
      setHealthStatus({ status: response.status, data });
    } catch (error) {
      setHealthStatus({ status: 'error', error: String(error) });
    }
  };

  const testAuthBackends = async (url: string) => {
    try {
      const response = await fetch(`${url}/debug/auth-backends`);
      const data = await response.json();
      setAuthBackends({ status: response.status, data });
    } catch (error) {
      setAuthBackends({ status: 'error', error: String(error) });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 API Configuration Debug</h1>
      
      <div className="grid gap-6">
        {/* Environment Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">🌍 Environment Configuration</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Hostname:</strong> {window.location.hostname}</div>
            <div><strong>Port:</strong> {window.location.port || 'default'}</div>
            <div><strong>Origin:</strong> {window.location.origin}</div>
            <div><strong>API Base URL:</strong> <code className="bg-white px-2 py-1 rounded">{apiUrl}</code></div>
            <div><strong>Use Token Auth:</strong> {useTokenAuth ? '✅ Yes (Production)' : '❌ No (Development)'}</div>
            <div><strong>Environment Variable:</strong> <code className="bg-white px-2 py-1 rounded">{import.meta.env.VITE_API_BASE_URL || 'Not set'}</code></div>
          </div>
        </div>

        {/* Health Status */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">🏥 API Health Status</h2>
          {healthStatus ? (
            <div className="text-sm">
              <div><strong>Status:</strong> {healthStatus.status}</div>
              {healthStatus.data && (
                <div className="mt-2">
                  <strong>Response:</strong>
                  <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto">
                    {JSON.stringify(healthStatus.data, null, 2)}
                  </pre>
                </div>
              )}
              {healthStatus.error && (
                <div className="text-red-600"><strong>Error:</strong> {healthStatus.error}</div>
              )}
            </div>
          ) : (
            <div>Loading...</div>
          )}
        </div>

        {/* Auth Backends */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">🔐 Authentication Backends</h2>
          {authBackends ? (
            <div className="text-sm">
              <div><strong>Status:</strong> {authBackends.status}</div>
              {authBackends.data && (
                <div className="mt-2">
                  <div><strong>Production Mode:</strong> {authBackends.data.is_production ? '✅ Yes' : '❌ No'}</div>
                  <div><strong>Backend Count:</strong> {authBackends.data.backend_count}</div>
                  <div className="mt-2"><strong>Backends:</strong></div>
                  <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto">
                    {JSON.stringify(authBackends.data.backends, null, 2)}
                  </pre>
                </div>
              )}
              {authBackends.error && (
                <div className="text-red-600"><strong>Error:</strong> {authBackends.error}</div>
              )}
            </div>
          ) : (
            <div>Loading...</div>
          )}
        </div>

        {/* Quick Tests */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">⚡ Quick Tests</h2>
          <div className="space-y-2 text-sm">
            <button
              onClick={() => testHealthEndpoint(apiUrl)}
              className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
            >
              Refresh Health Check
            </button>
            <button
              onClick={() => testAuthBackends(apiUrl)}
              className="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600 ml-2"
            >
              Refresh Auth Backends
            </button>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-red-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">🚨 Troubleshooting</h2>
          <div className="text-sm space-y-2">
            <div><strong>Expected API URL:</strong> https://new-cv-9zoc.onrender.com</div>
            <div><strong>Expected Token Auth:</strong> Yes (in production)</div>
            <div><strong>Expected Health Status:</strong> 200</div>
            
            {apiUrl !== 'https://new-cv-9zoc.onrender.com' && (
              <div className="text-red-600 font-semibold">
                ⚠️ API URL mismatch! Update VITE_API_BASE_URL environment variable.
              </div>
            )}
            
            {!useTokenAuth && window.location.hostname !== 'localhost' && (
              <div className="text-red-600 font-semibold">
                ⚠️ Should use token auth in production!
              </div>
            )}
            
            {healthStatus?.status !== 200 && (
              <div className="text-red-600 font-semibold">
                ⚠️ API health check failed! Check backend deployment.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiUrlDebug;
