import uuid
# Update the import path for SQLAlchemyUserDatabase
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from sqlalchemy.orm import Mapped, mapped_column, relationship, Session
from sqlalchemy import String, Boolean, ForeignKey, Integer, JSON
from typing import List, Optional, Dict, Any
from core.database import Base, get_async_db # Import Base and get_async_db
from fastapi import Depends
from pydantic import BaseModel
# Import base schemas from fastapi-users
from fastapi_users import schemas
from sqlalchemy.ext.asyncio import AsyncSession # Import AsyncSession
from sqlalchemy.future import select # Ensure select is imported if needed by SQLAlchemyUserDatabase internals


class MsgPayload(BaseModel):
    msg_id: Optional[int] = None
    msg_name: str

class CVInput(BaseModel):
    data: Dict[str, Any]

# New models for the enhanced CV flow
class CVWeaknessRequest(BaseModel):
    cv_data: Dict[str, Any]

class CVWeaknessResponse(BaseModel):
    weaknesses: List[str]
    missing_information: List[str]
    improvement_suggestions: List[str]
    required_inputs: List[str]

class CVEnhancementRequest(BaseModel):
    cv_data: Dict[str, Any]
    additional_input: Dict[str, Any]


class User(SQLAlchemyBaseUserTableUUID, Base):
    # Add any additional user fields here if needed
    # Example: first_name: Mapped[str] = mapped_column(String(50), nullable=True)
    # Example: last_name: Mapped[str] = mapped_column(String(50), nullable=True)
    role: Mapped[str] = mapped_column(String(50), default="user") # Add role field (user/admin)
    cvs: Mapped[List["CV"]] = relationship(back_populates="owner") # Relationship to CVs


class CV(Base):
    __tablename__ = "cvs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    file_url: Mapped[str] = mapped_column(String(255), nullable=False)
    cv_structure: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"))
    owner: Mapped["User"] = relationship(back_populates="cvs")
    # Add other CV fields as needed, e.g., template_name, created_at, etc.


async def get_user_db(session: AsyncSession = Depends(get_async_db)): # Use AsyncSession and get_async_db
    yield SQLAlchemyUserDatabase(session, User) # Use the standard adapter


# --- Pydantic Schemas for FastAPI-Users --- START ---

class UserRead(schemas.BaseUser[uuid.UUID]):
    # Add custom fields to be returned when reading a user
    role: str
    pass

class UserCreate(schemas.BaseUserCreate):
    # Add custom fields required during user creation (e.g., role if needed)
    # role: str # Optional: Allow setting role on creation? Needs validation.
    pass

class UserUpdate(schemas.BaseUserUpdate):
    # Add custom fields allowed during user update
    # role: Optional[str] = None # Optional: Allow updating role? Needs validation.
    pass

# --- Pydantic Schemas for FastAPI-Users --- END ---

# --- Optional: Pydantic Schemas for CVs (if not already defined) --- START ---
from pydantic import BaseModel

class CVBase(BaseModel):
    file_url: str
    cv_structure: Optional[Dict[str, Any]] = None

class CVCreate(CVBase):
    pass

class CVRead(CVBase):
    id: int
    user_id: uuid.UUID

    class Config:
        from_attributes = True # Use this instead
# --- Optional: Pydantic Schemas for CVs --- END ---
