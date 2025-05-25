import os
import uuid
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from pydantic import BaseModel
from core.app import gemini_service
from routes import cv_routes
import asyncio

# Create a simple FastAPI app for testing without database
app = FastAPI(title="CV Analysis Test API")

# Simple test route for CV job description analysis
@app.post("/test-analyze-cv-with-job-description")
async def test_analyze_cv_with_job_description(
    file: UploadFile = File(...),
    job_description: str = None
):
    """
    Test CV analysis with job description without database dependencies
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        pdf_content = await file.read()
        extracted_cv_data = await gemini_service.extract_pdf_text(pdf_content=pdf_content)
        
        if isinstance(extracted_cv_data, dict) and "error" in extracted_cv_data:
            raise Exception(extracted_cv_data["error"])
        
        if job_description:
            # Compare CV to job description
            job_analysis = await gemini_service.analyze_cv_against_job_description(extracted_cv_data, job_description)
            return {
                "cv_data": extracted_cv_data,
                "job_analysis": job_analysis
            }
        else:
            # Fallback to normal analysis
            detailed_analysis = await gemini_service.generate_detailed_analysis(extracted_cv_data)
            return {
                "cv_data": extracted_cv_data,
                "detailed_analysis": detailed_analysis
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing PDF: {str(e)}")
    finally:
        await file.close()

# Health check route
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "CV Analysis Test API is running"}

# Include main CV routes without database dependencies
app.include_router(cv_routes.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
