from fastapi import HTTPException
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class FileUploadError(Exception):
    """Custom exception for file upload errors"""
    def __init__(self, message: str, status_code: int = 400, details: Dict[str, Any] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class FileValidationError(FileUploadError):
    """Exception for file validation errors"""
    pass

class FileSizeError(FileUploadError):
    """Exception for file size errors"""
    pass

class FileTypeError(FileUploadError):
    """Exception for file type errors"""
    pass

def handle_file_upload_error(error: Exception) -> HTTPException:
    """
    Convert file upload errors to appropriate HTTP exceptions
    """
    if isinstance(error, FileUploadError):
        return HTTPException(
            status_code=error.status_code,
            detail={
                "message": error.message,
                "type": error.__class__.__name__,
                **error.details
            }
        )
    
    # Log unexpected errors
    logger.error(f"Unexpected file upload error: {str(error)}", exc_info=True)
    
    return HTTPException(
        status_code=500,
        detail={
            "message": "An unexpected error occurred during file upload",
            "type": "InternalServerError"
        }
    )

def create_user_friendly_error(error_type: str, details: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Create user-friendly error messages for common file upload issues
    """
    error_messages = {
        "file_too_large": {
            "title": "File Too Large",
            "message": "The file you're trying to upload is too large.",
            "suggestion": "Please compress your PDF or use a smaller file.",
            "icon": "file-x"
        },
        "file_too_small": {
            "title": "File Too Small", 
            "message": "The file appears to be too small or empty.",
            "suggestion": "Please upload a valid CV file.",
            "icon": "alert-triangle"
        },
        "invalid_file_type": {
            "title": "Invalid File Type",
            "message": "Only PDF files are supported.",
            "suggestion": "Please convert your CV to PDF format and try again.",
            "icon": "file-text"
        },
        "corrupted_pdf": {
            "title": "Corrupted PDF",
            "message": "The PDF file appears to be corrupted or invalid.",
            "suggestion": "Please try re-saving your CV as a PDF and upload again.",
            "icon": "alert-circle"
        },
        "no_text_content": {
            "title": "No Text Found",
            "message": "We couldn't extract any text from your PDF.",
            "suggestion": "Please ensure your CV contains readable text, not just images.",
            "icon": "eye-off"
        },
        "password_protected": {
            "title": "Password Protected",
            "message": "Your PDF is password protected.",
            "suggestion": "Please remove the password protection and try again.",
            "icon": "lock"
        },

    }
    
    base_error = error_messages.get(error_type, {
        "title": "Upload Error",
        "message": "An error occurred while processing your file.",
        "suggestion": "Please try again or contact support if the problem persists.",
        "icon": "alert-triangle"
    })
    
    if details:
        base_error.update(details)
    
    return base_error
