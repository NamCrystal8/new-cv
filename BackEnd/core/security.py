import os
import uuid
from fastapi import Depends, Request
from fastapi_users import FastAPIUsers, BaseUserManager, UUIDIDMixin
from fastapi_users.authentication import CookieTransport, AuthenticationBackend, JWTStrategy
# Update the import path for SQLAlchemyUserDatabase
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from models.user import User
from models.user import get_user_db
import dotenv

dotenv.load_dotenv()

SECRET = os.getenv("JWT_SECRET", "DEFAULT_SECRET_KEY_CHANGE_ME")

cookie_transport = CookieTransport(cookie_name="cvapp", cookie_max_age=3600)

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
