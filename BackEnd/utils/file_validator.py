import os
import PyPDF2
from io import BytesIO
from typing import Dict, Optional, Tuple
from fastapi import HTTPException, UploadFile
import hashlib
from utils.error_handler import FileSizeError, FileTypeError, FileValidationError

class FileValidator:
    """Comprehensive file validation utility for CV uploads"""
    
    # File size limits (in bytes)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    MIN_FILE_SIZE = 1024  # 1KB
    
    # Allowed MIME types
    ALLOWED_MIME_TYPES = {
        'application/pdf',
        'application/x-pdf',
        'application/acrobat',
        'applications/vnd.pdf',
        'text/pdf',
        'text/x-pdf'
    }
    
    # PDF magic numbers (file signatures)
    PDF_SIGNATURES = [
        b'%PDF-1.',  # Standard PDF signature
        b'%PDF-2.',  # PDF 2.0 signature
    ]
    
    @classmethod
    async def validate_cv_file(cls, file: UploadFile) -> Dict[str, any]:
        """
        Comprehensive validation for CV file uploads
        
        Args:
            file: FastAPI UploadFile object
            
        Returns:
            Dict containing validation results and file info
            
        Raises:
            HTTPException: If validation fails
        """
        validation_result = {
            'is_valid': False,
            'file_size': 0,
            'mime_type': None,
            'file_hash': None,
            'page_count': 0,
            'has_text': False,
            'errors': []
        }
        
        try:
            if not file.filename:
                raise HTTPException(status_code=400, detail="No filename provided")

            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail="Only PDF files are allowed")

            file_content = await file.read()
            file_size = len(file_content)
            validation_result['file_size'] = file_size

            await file.seek(0)

            if file_size < cls.MIN_FILE_SIZE:
                raise FileSizeError(
                    f"File too small. Minimum size is {cls.format_file_size(cls.MIN_FILE_SIZE)}",
                    status_code=400,
                    details={"error_type": "file_too_small", "file_size": file_size}
                )

            if file_size > cls.MAX_FILE_SIZE:
                raise FileSizeError(
                    f"File too large. Maximum size is {cls.format_file_size(cls.MAX_FILE_SIZE)}",
                    status_code=413,
                    details={"error_type": "file_too_large", "file_size": file_size, "max_size": cls.MAX_FILE_SIZE}
                )

            mime_type = file.content_type
            validation_result['mime_type'] = mime_type

            if mime_type not in cls.ALLOWED_MIME_TYPES:
                raise FileTypeError(
                    f"Invalid file type. Only PDF files are supported. Detected: {mime_type}",
                    status_code=400,
                    details={"error_type": "invalid_file_type", "detected_type": mime_type}
                )

            if not cls._validate_pdf_signature(file_content):
                raise FileValidationError(
                    "Invalid PDF file. File signature does not match PDF format",
                    status_code=400,
                    details={"error_type": "corrupted_pdf"}
                )

            pdf_info = cls._validate_pdf_structure(file_content)
            validation_result.update(pdf_info)

            validation_result['file_hash'] = cls._generate_file_hash(file_content)

            if not validation_result['has_text']:
                raise FileValidationError(
                    "PDF appears to be empty or contains no extractable text. Please upload a CV with text content.",
                    status_code=400,
                    details={"error_type": "no_text_content"}
                )
            
            validation_result['is_valid'] = True
            return validation_result
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"File validation error: {str(e)}"
            )
        finally:
            await file.seek(0)
    
    @classmethod
    def _validate_pdf_signature(cls, file_content: bytes) -> bool:
        """Validate PDF file signature"""
        if len(file_content) < 8:
            return False
        
        file_header = file_content[:8]
        return any(file_header.startswith(sig) for sig in cls.PDF_SIGNATURES)
    
    @classmethod
    def _validate_pdf_structure(cls, file_content: bytes) -> Dict[str, any]:
        """Validate PDF internal structure and extract basic info"""
        result = {
            'page_count': 0,
            'has_text': False,
            'is_encrypted': False,
            'errors': []
        }
        
        try:
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)

            if pdf_reader.is_encrypted:
                result['is_encrypted'] = True
                result['errors'].append("PDF is password protected")
                return result

            result['page_count'] = len(pdf_reader.pages)

            if result['page_count'] == 0:
                result['errors'].append("PDF has no pages")
                return result

            if result['page_count'] > 10:
                result['errors'].append(f"PDF has too many pages ({result['page_count']}). CVs should typically be 1-3 pages.")

            extracted_text = ""
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text() or ""
                    extracted_text += page_text
                    if len(extracted_text.strip()) > 50:
                        result['has_text'] = True
                        break
                except Exception as e:
                    result['errors'].append(f"Error reading page {page_num + 1}: {str(e)}")
            
            if not result['has_text']:
                result['errors'].append("No readable text found in PDF")
            
        except Exception as e:
            result['errors'].append(f"PDF structure validation failed: {str(e)}")
        
        return result
    
    @classmethod
    def _generate_file_hash(cls, file_content: bytes) -> str:
        """Generate SHA-256 hash of file content for duplicate detection"""
        return hashlib.sha256(file_content).hexdigest()
    
    @classmethod
    def format_file_size(cls, size_bytes: int) -> str:
        """Format file size in human readable format"""
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        else:
            return f"{size_bytes / (1024 * 1024):.1f} MB"
    
    @classmethod
    def get_max_file_size_mb(cls) -> int:
        """Get maximum file size in MB"""
        return cls.MAX_FILE_SIZE // (1024 * 1024)
