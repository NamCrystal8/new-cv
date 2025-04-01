from typing import Optional, Dict, Any
from pydantic import BaseModel


class MsgPayload(BaseModel):
    msg_id: Optional[int] = None
    msg_name: str

class CVInput(BaseModel):
    data: Dict[str, Any]
