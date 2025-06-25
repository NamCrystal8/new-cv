"""
Authentication debugging middleware to help track authentication issues
"""
import os
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable


class AuthDebugMiddleware(BaseHTTPMiddleware):
    """Middleware to debug authentication issues"""
    
    def __init__(self, app, debug_enabled: bool = None):
        super().__init__(app)
        # Enable debug in development or when explicitly requested
        self.debug_enabled = debug_enabled if debug_enabled is not None else (
            os.getenv("ENVIRONMENT", "development") == "development" or
            os.getenv("AUTH_DEBUG", "false").lower() == "true"
        )
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not self.debug_enabled:
            return await call_next(request)
        
        # Log authentication-related information
        path = request.url.path
        method = request.method
        
        # Only log for protected endpoints (skip static files, health checks, etc.)
        if self._should_log_request(path):
            print(f"🔍 [AUTH_DEBUG] {method} {path}")
            
            # Log headers related to authentication
            auth_header = request.headers.get("authorization")
            if auth_header:
                # Mask the token for security
                if auth_header.startswith("Bearer "):
                    token_preview = auth_header[:20] + "..." if len(auth_header) > 20 else auth_header
                    print(f"   - Authorization header: {token_preview}")
                else:
                    print(f"   - Authorization header: {auth_header}")
            else:
                print(f"   - No Authorization header")
            
            # Log cookies
            cookies = request.cookies
            if cookies:
                auth_cookies = {k: v for k, v in cookies.items() if 'auth' in k.lower() or 'cvapp' in k.lower()}
                if auth_cookies:
                    # Mask cookie values for security
                    masked_cookies = {k: v[:10] + "..." if len(v) > 10 else v for k, v in auth_cookies.items()}
                    print(f"   - Auth cookies: {masked_cookies}")
                else:
                    print(f"   - No auth-related cookies found")
            else:
                print(f"   - No cookies")
            
            # Log origin and referer
            origin = request.headers.get("origin")
            referer = request.headers.get("referer")
            if origin:
                print(f"   - Origin: {origin}")
            if referer:
                print(f"   - Referer: {referer}")
        
        # Process the request
        response = await call_next(request)
        
        # Log response status for protected endpoints
        if self._should_log_request(path) and response.status_code in [401, 403]:
            print(f"🚨 [AUTH_DEBUG] {method} {path} -> {response.status_code}")
        
        return response
    
    def _should_log_request(self, path: str) -> bool:
        """Determine if we should log this request"""
        # Skip logging for these paths
        skip_paths = [
            "/health",
            "/docs",
            "/openapi.json",
            "/favicon.ico",
            "/static/",
            "/_next/",
            "/pdf/",  # PDF serving endpoints
        ]
        
        # Skip auth endpoints (they're expected to work)
        auth_paths = [
            "/auth/",
            "/users/me",  # This is actually protected, so we want to log it
        ]
        
        # Don't skip /users/me as it's a protected endpoint we want to debug
        if path == "/users/me":
            return True
        
        for skip_path in skip_paths:
            if path.startswith(skip_path):
                return False
        
        # Log protected endpoints and auth endpoints
        return True
