from typing import Optional, Dict, Any, List
from pydantic import BaseModel


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
