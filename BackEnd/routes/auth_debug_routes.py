"""
Authentication debugging routes
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from core.security import current_active_user, fastapi_users
from models.user import User
from typing import Optional

router = APIRouter(prefix="/debug", tags=["debug"])


@router.get("/auth-status")
async def get_auth_status(request: Request):
    """
    Debug endpoint to check authentication status without requiring authentication
    """
    # Check for Authorization header
    auth_header = request.headers.get("authorization")
    
    # Check for cookies
    cookies = dict(request.cookies)
    auth_cookies = {k: v for k, v in cookies.items() if 'auth' in k.lower() or 'cvapp' in k.lower()}
    
    return {
        "has_auth_header": bool(auth_header),
        "auth_header_type": auth_header.split()[0] if auth_header and " " in auth_header else None,
        "has_auth_cookies": bool(auth_cookies),
        "cookie_names": list(auth_cookies.keys()),
        "origin": request.headers.get("origin"),
        "user_agent": request.headers.get("user-agent"),
        "method": request.method,
        "url": str(request.url)
    }


@router.get("/protected-test")
async def protected_test(user: User = Depends(current_active_user)):
    """
    Simple protected endpoint to test authentication
    """
    return {
        "message": "Authentication successful!",
        "user_id": str(user.id),
        "user_email": user.email,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "role_id": user.role_id
    }


@router.get("/auth-backends")
async def get_auth_backends():
    """
    Debug endpoint to show configured authentication backends
    """
    from core.security import auth_backends, is_production
    
    backend_info = []
    for backend in auth_backends:
        info = {
            "name": backend.name,
            "transport_type": type(backend.transport).__name__,
        }
        
        # Add transport-specific info
        if hasattr(backend.transport, 'tokenUrl'):
            info["token_url"] = backend.transport.tokenUrl
        if hasattr(backend.transport, 'cookie_name'):
            info["cookie_name"] = backend.transport.cookie_name
            info["cookie_secure"] = backend.transport.cookie_secure
            info["cookie_httponly"] = backend.transport.cookie_httponly
            info["cookie_samesite"] = backend.transport.cookie_samesite
        
        backend_info.append(info)
    
    return {
        "is_production": is_production,
        "backends": backend_info,
        "backend_count": len(auth_backends)
    }


@router.get("/test-user-dependency")
async def test_user_dependency():
    """
    Test the user dependency without requiring authentication
    """
    try:
        # Try to get the current user dependency
        user_dependency = fastapi_users.current_user(active=True)
        return {
            "dependency_created": True,
            "dependency_type": str(type(user_dependency))
        }
    except Exception as e:
        return {
            "dependency_created": False,
            "error": str(e)
        }


@router.get("/manual-auth-test")
async def manual_auth_test(request: Request):
    """
    Manually test authentication without using the dependency
    """
    from core.security import fastapi_users

    try:
        # Get authentication info from request
        auth_header = request.headers.get("authorization")
        cookies = dict(request.cookies)

        # Try to manually authenticate the request
        user = None
        backend_used = None

        for backend in fastapi_users.authenticator.backends:
            try:
                # Try to get token from this backend's transport
                token = None
                if hasattr(backend.transport, 'get_login_response'):
                    # This is for cookie transport
                    if 'cvapp' in cookies:
                        token = cookies['cvapp']
                elif auth_header and auth_header.startswith('Bearer '):
                    # This is for bearer transport
                    token = auth_header.split(' ')[1]

                if token:
                    # Try to read the token with this backend's strategy
                    user = await backend.get_strategy().read_token(token, user_manager=None)
                    if user:
                        backend_used = backend.name
                        break
            except Exception as e:
                print(f"Backend {backend.name} failed: {e}")
                continue

        if user:
            return {
                "authentication_successful": True,
                "user_id": str(user.id),
                "user_email": user.email,
                "backend_used": backend_used,
                "auth_header_present": bool(auth_header),
                "cookies_present": list(cookies.keys())
            }
        else:
            return {
                "authentication_successful": False,
                "message": "No valid authentication found",
                "auth_header_present": bool(auth_header),
                "cookies_present": list(cookies.keys())
            }
    except Exception as e:
        return {
            "authentication_successful": False,
            "error": str(e),
            "error_type": type(e).__name__
        }
