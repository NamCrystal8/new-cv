"""
Pydantic schemas for CV management
"""
import uuid
from typing import Optional, Dict, Any, List
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
        from_attributes = True


# CV flow request/response schemas
class CVInput(BaseModel):
    data: Dict[str, Any]


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
