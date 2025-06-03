"""
Pydantic schemas for role management
"""
from pydantic import BaseModel
from typing import Optional


class RoleBase(BaseModel):
    role_name: str


class RoleCreate(RoleBase):
    pass


class RoleRead(RoleBase):
    id: int

    class Config:
        from_attributes = True


class RoleUpdate(BaseModel):
    role_name: Optional[str] = None
