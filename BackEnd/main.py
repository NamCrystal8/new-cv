import os
from core.app import app
from schemas.user import UserRead, UserCreate, UserUpdate
from core.database import Base, engine
from routes import base_routes, pdf_routes, cv_routes, health_routes, subscription_routes, admin_routes, setup_routes
from core.security import cookie_auth_backend, bearer_auth_backend, fastapi_users

# --- Database Initialization --- START ---
@app.on_event("startup")
async def on_startup():
    """Initialize database on startup"""
    print("🚀 Starting application initialization...")

    # Create tables from models
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Note: Full migration is handled by migrate_database.py in start.sh
    # This is just a safety check for basic table creation
    print("✅ Database tables initialized")
# --- Database Initialization --- END ---

# --- Include Routers --- START ---
app.include_router(base_routes.router)
app.include_router(pdf_routes.router)
app.include_router(cv_routes.router)
app.include_router(health_routes.router)
app.include_router(subscription_routes.router)
app.include_router(admin_routes.router)
app.include_router(setup_routes.router)

# Include FastAPI-Users routers with correct schemas
# Cookie-based authentication (for development and same-domain)
app.include_router(
    fastapi_users.get_auth_router(cookie_auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)

# Bearer token authentication (for production cross-domain)
app.include_router(
    fastapi_users.get_auth_router(bearer_auth_backend),
    prefix="/auth/bearer",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)