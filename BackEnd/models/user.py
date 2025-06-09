"""
User and CV models
"""
import uuid
from typing import List, Optional, Dict, Any, TYPE_CHECKING
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, Integer, JSON
from core.database import Base

if TYPE_CHECKING:
    from .role import Role
    from .subscription import UserSubscription


class User(SQLAlchemyBaseUserTableUUID, Base):
    """User model with role and subscription relationships"""
    # Role relationship - TEMPORARILY COMMENTED OUT FOR DEPLOYMENT
    # role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), default=2)  # Default to USER role (id=2)
    # role: Mapped["Role"] = relationship("Role")

    # CV relationship
    cvs: Mapped[List["CV"]] = relationship(back_populates="owner")

    # Subscription relationships
    subscriptions: Mapped[List["UserSubscription"]] = relationship("UserSubscription", back_populates="user")


class CV(Base):
    """CV model for storing user CVs"""
    __tablename__ = "cvs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    file_url: Mapped[str] = mapped_column(String(255), nullable=False)
    cv_structure: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"))
    owner: Mapped["User"] = relationship(back_populates="cvs")


# Database dependency function
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_async_db

async def get_user_db(session: AsyncSession = Depends(get_async_db)):
    yield SQLAlchemyUserDatabase(session, User)
