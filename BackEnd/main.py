"""
Main entry point for the FastAPI application.
This file imports and registers all route modules.
"""
from core.app import app
from routes import base_routes, pdf_routes, cv_routes

# Register all route modules
app.include_router(base_routes.router)
app.include_router(pdf_routes.router)
app.include_router(cv_routes.router)

# For direct execution
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)