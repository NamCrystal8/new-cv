import os
import uuid
from fastapi import Depends, Request, HTTPException, status
from fastapi_users import FastAPIUsers, BaseUserManager, UUIDIDMixin
from fastapi_users.authentication import CookieTransport, AuthenticationBackend, JWTStrategy
# Update the import path for SQLAlchemyUserDatabase
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from models.user import User
from models.user import get_user_db
import dotenv

dotenv.load_dotenv()

SECRET = os.getenv("JWT_SECRET", "DEFAULT_SECRET_KEY_CHANGE_ME")

import os

# Determine if we're in production based on environment
is_production = os.getenv("ENVIRONMENT", "development") == "production" or "render.com" in os.getenv("DATABASE_URL", "")

cookie_transport = CookieTransport(
    cookie_name="cvapp",
    cookie_max_age=3600,
    cookie_secure=is_production,  # HTTPS only in production
    cookie_httponly=True,  # Prevent XSS
    cookie_samesite="none" if is_production else "lax",  # Allow cross-origin in production
    cookie_domain=None  # Let browser handle domain
)

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=cookie_transport,
    get_strategy=get_jwt_strategy,
)

# --- User Manager Setup --- START ---
class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    async def authenticate(self, credentials):
        """
        Custom authenticate method to handle inactive users properly
        """
        try:
            user = await self.get_by_email(credentials.username)
        except Exception:
            # Run the hasher to mitigate timing attack
            # Inspired from Django: https://code.djangoproject.com/ticket/20760
            self.password_helper.hash(credentials.password)
            return None

        verified, updated_password_hash = self.password_helper.verify_and_update(
            credentials.password, user.hashed_password
        )
        if not verified:
            return None

        # Update password hash to a more robust one if needed
        if updated_password_hash is not None:
            await self.user_db.update(user, {"hashed_password": updated_password_hash})

        # Check if user is inactive and raise specific error
        if not user.is_active:
            print(f"User {user.email} attempted login but account is inactive")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ACCOUNT_INACTIVE"
            )

        return user

    async def on_after_register(self, user: User, request: Request | None = None):
        print(f"User {user.id} has registered.")

    async def on_after_forgot_password(
        self, user: User, token: str, request: Request | None = None
    ):
        print(f"User {user.id} has forgot their password. Reset token: {token}")

    async def on_after_request_verify(
        self, user: User, token: str, request: Request | None = None
    ):
        print(f"Verification requested for user {user.id}. Verification token: {token}")

# Dependency to get the UserManager
async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)
# --- User Manager Setup --- END ---


# Define fastapi_users instance here, passing the get_user_manager dependency
fastapi_users = FastAPIUsers[User, uuid.UUID](
    get_user_manager, # Use the UserManager dependency
    [auth_backend],
)

# Define the dependency for getting the current active user here
# This remains the same
current_active_user = fastapi_users.current_user(active=True)

# Admin role dependency
async def current_admin_user(user: User = Depends(current_active_user)) -> User:
    """Dependency to ensure the current user is an admin (role_id = 1)"""
    if user.role_id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user
