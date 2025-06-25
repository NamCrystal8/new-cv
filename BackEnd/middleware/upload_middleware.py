from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from core.config import settings



class UploadSizeMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce upload size limits"""
    
    def __init__(self, app, max_size: int = None):
        super().__init__(app)
        self.max_size = max_size or settings.MAX_UPLOAD_SIZE
    
    async def dispatch(self, request: Request, call_next):
        # Check if this is a file upload request
        if request.method in ["POST", "PUT", "PATCH"]:
            content_length = request.headers.get("content-length")
            
            if content_length:
                content_length = int(content_length)
                
                if content_length > self.max_size:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "detail": f"Request entity too large. Maximum allowed size is {settings.get_max_upload_size_formatted()}",
                            "max_size_bytes": self.max_size,
                            "max_size_formatted": settings.get_max_upload_size_formatted()
                        }
                    )
        
        response = await call_next(request)
        return response


