
from fastapi import Request
import json
import logging
from datetime import datetime

@app.middleware("http")
async def debug_middleware(request: Request, call_next):
    """Middleware to log all API requests for debugging"""
    
    # Log request details
    logging.info(f"Request URL: {request.url}")
    logging.info(f"Request method: {request.method}")
    
    # Capture request body if it's a POST/PUT request
    if request.method in ["POST", "PUT", "PATCH"]:
        body = await request.body()
        if body:
            try:
                json_data = json.loads(body)
                log_request_data(json_data, f"{request.method} {request.url.path}")
            except json.JSONDecodeError:
                logging.info(f"Non-JSON body: {body[:200]}...")
    
    response = await call_next(request)
    return response
