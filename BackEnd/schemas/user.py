"""
Pydantic schemas for user management
"""
import uuid
from typing import Optional
from fastapi_users import schemas


class UserRead(schemas.BaseUser[uuid.UUID]):
    """Schema for reading user data"""
    role_id: int
    
    class Config:
        from_attributes = True


class UserCreate(schemas.BaseUserCreate):
    """Schema for creating users"""
    pass


class UserUpdate(schemas.BaseUserUpdate):
    """Schema for updating users"""
    pass
