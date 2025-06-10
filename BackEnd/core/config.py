import os
from typing import List

class Settings:
    """Application configuration settings"""
    
    # File Upload Settings
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", 10 * 1024 * 1024))  # 10MB default
    MIN_UPLOAD_SIZE: int = int(os.getenv("MIN_UPLOAD_SIZE", 1024))  # 1KB default
    
    # Allowed file types
    ALLOWED_EXTENSIONS: List[str] = [".pdf"]
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "application/x-pdf", 
        "application/acrobat",
        "applications/vnd.pdf",
        "text/pdf",
        "text/x-pdf"
    ]
    
    # PDF specific settings
    MAX_PDF_PAGES: int = int(os.getenv("MAX_PDF_PAGES", 10))
    MIN_TEXT_LENGTH: int = int(os.getenv("MIN_TEXT_LENGTH", 50))
    
    # Rate limiting - removed as requested
    
    # Security settings
    ENABLE_VIRUS_SCAN: bool = os.getenv("ENABLE_VIRUS_SCAN", "false").lower() == "true"
    QUARANTINE_SUSPICIOUS_FILES: bool = os.getenv("QUARANTINE_SUSPICIOUS_FILES", "true").lower() == "true"
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # External services
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    GOOGLE_GEMINI_API_KEY: str = os.getenv("GOOGLE_GEMINI_API_KEY", "")
    
    # JWT settings
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    
    # Frontend URL
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://new-cv-fe.onrender.com")
    
    @classmethod
    def get_max_upload_size_mb(cls) -> int:
        """Get maximum upload size in MB"""
        return cls.MAX_UPLOAD_SIZE // (1024 * 1024)
    
    @classmethod
    def get_max_upload_size_formatted(cls) -> str:
        """Get formatted maximum upload size"""
        size_mb = cls.get_max_upload_size_mb()
        if size_mb >= 1024:
            return f"{size_mb // 1024}GB"
        return f"{size_mb}MB"

# Global settings instance
settings = Settings()
