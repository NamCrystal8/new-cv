import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services import gemini_service
from core.cloudinary_config import setup_cloudinary
from middleware.upload_middleware import UploadSizeMiddleware
from middleware.auth_debug_middleware import AuthDebugMiddleware
from core.config import settings

# Create and configure FastAPI app
def create_app() -> FastAPI:
    # Initialize FastAPI with custom configuration
    app = FastAPI(
        title="CV Analysis API",
        description="API for CV analysis and enhancement",
        version="1.0.0"
    )

    # Add upload size middleware (must be added before other middleware)
    app.add_middleware(UploadSizeMiddleware, max_size=settings.MAX_UPLOAD_SIZE)

    # Add authentication debug middleware (for troubleshooting)
    app.add_middleware(AuthDebugMiddleware)

    # Determine allowed origins based on environment
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        # Production frontend URLs
        "https://new-cv-fe.onrender.com",
        settings.FRONTEND_URL
    ]

    # Remove duplicates and None values
    allowed_origins = list(set(filter(None, allowed_origins)))

    print(f"🔧 CORS Configuration:")
    print(f"   - Allowed origins: {allowed_origins}")
    print(f"   - Frontend URL from settings: {settings.FRONTEND_URL}")

    # Add CORS middleware to allow requests from frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=[
            "Accept",
            "Accept-Language",
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
        ],
        expose_headers=["*"],
    )
    
    # Setup Cloudinary for file uploads
    setup_cloudinary()
    
    # Ensure output directory exists
    LATEX_OUTPUT_DIR = "output_tex_files"
    os.makedirs(LATEX_OUTPUT_DIR, exist_ok=True)
    
    return app

# Create app instance
app = create_app()

# Initialize services
gemini_service = gemini_service.GeminiService()

# In-memory storage (should be replaced with a database in production)
messages_list = {}
cv_flows = {}