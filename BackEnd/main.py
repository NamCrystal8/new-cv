import os
import uuid
from fastapi import FastAPI, Depends
from core.app import app
from models.user import User, CV, get_user_db
from schemas.user import UserRead, UserCreate, UserUpdate
from core.database import Base, engine, get_async_db
from routes import base_routes, pdf_routes, cv_routes, health_routes, subscription_routes, admin_routes
from core.security import auth_backend, fastapi_users, current_active_user

# --- Database Initialization --- START ---
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create admin user if it doesn't exist
    await create_default_admin()
# --- Database Initialization --- END ---

# --- Admin User Creation --- START ---
async def create_default_admin():
    """Create default admin user on startup"""
    try:
        from sqlalchemy import select
        from models.user import User
        from passlib.context import CryptContext

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        admin_email = "admin@cvbuilder.com"

        async for db in get_async_db():
            try:
                # Check if admin exists
                existing_admin = await db.execute(
                    select(User).where(User.email == admin_email)
                )

                if not existing_admin.scalar_one_or_none():
                    # Create admin user
                    admin_user = User(
                        id=uuid.uuid4(),
                        email=admin_email,
                        hashed_password=pwd_context.hash("admin123"),
                        is_active=True,
                        is_verified=True,
                        is_superuser=True
                    )

                    db.add(admin_user)
                    await db.commit()
                    print(f"✅ Created admin user: {admin_email}")
                else:
                    print(f"ℹ️ Admin user already exists: {admin_email}")

            except Exception as e:
                print(f"❌ Error creating admin user: {e}")
                await db.rollback()
            finally:
                await db.close()
                break

    except Exception as e:
        print(f"❌ Error in admin creation: {e}")
# --- Admin User Creation --- END ---

# --- Include Routers --- START ---
app.include_router(base_routes.router)
app.include_router(pdf_routes.router)
app.include_router(cv_routes.router)
app.include_router(health_routes.router)
app.include_router(subscription_routes.router)
app.include_router(admin_routes.router)

# Include FastAPI-Users routers with correct schemas
app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
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