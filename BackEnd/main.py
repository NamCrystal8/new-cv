import os
import re
from fastapi import FastAPI, UploadFile, File, HTTPException
from models import CVInput, MsgPayload
from services import gemini_service
from services.latex_service import convert_to_latex_service

app = FastAPI()
messages_list: dict[int, MsgPayload] = {}
gemini_service = gemini_service.GeminiService()

LATEX_OUTPUT_DIR = "output_tex_files"
os.makedirs(LATEX_OUTPUT_DIR, exist_ok=True)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Hello"}

@app.get("/about")
def about() -> dict[str, str]:
    return {"message": "This is the about page."}

@app.post("/messages/{msg_name}/")
def add_msg(msg_name: str) -> dict[str, MsgPayload]:
    msg_id = max(messages_list.keys()) + 1 if messages_list else 0
    messages_list[msg_id] = MsgPayload(msg_id=msg_id, msg_name=msg_name)

    return {"message": messages_list[msg_id]}

@app.get("/messages")
def message_items() -> dict[str, dict[int, MsgPayload]]:
    return {"messages:": messages_list}

@app.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)) -> dict:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        pdf_content = await file.read()
        result = await gemini_service.extract_pdf_text(pdf_content=pdf_content)
        return {"data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
    finally:
        await file.close()
@app.post("/convert-to-latex/")
def convert_to_latex(cv_input: CVInput) -> dict[str, str]:
    return convert_to_latex_service(cv_input.data)