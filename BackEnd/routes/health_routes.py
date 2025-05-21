from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Health check endpoint for Render to monitor the application.
    """
    return {"status": "ok", "message": "CV Generator API is running"}
