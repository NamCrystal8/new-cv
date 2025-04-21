from fastapi import APIRouter
from models import MsgPayload
from core.app import messages_list

router = APIRouter()

@router.get("/")
def root() -> dict[str, str]:
    return {"message": "Hello"}

@router.get("/about")
def about() -> dict[str, str]:
    return {"message": "This is the about page."}

@router.post("/messages/{msg_name}/")
def add_msg(msg_name: str) -> dict[str, MsgPayload]:
    msg_id = max(messages_list.keys()) + 1 if messages_list else 0
    messages_list[msg_id] = MsgPayload(msg_id=msg_id, msg_name=msg_name)
    return {"message": messages_list[msg_id]}

@router.get("/messages")
def message_items() -> dict[str, dict[int, MsgPayload]]:
    return {"messages:": messages_list}