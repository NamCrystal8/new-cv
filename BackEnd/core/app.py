import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services import gemini_service
from core.cloudinary_config import setup_cloudinary

# Create and configure FastAPI app
def create_app() -> FastAPI:
    # Initialize FastAPI
    app = FastAPI()
    
    # Add CORS middleware to allow requests from frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Add your frontend URL
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
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