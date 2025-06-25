"""
Role models for user role management
"""
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class Role(Base):
    """Role table for user permissions"""
    __tablename__ = "roles"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    role_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
