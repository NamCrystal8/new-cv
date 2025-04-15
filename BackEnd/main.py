import os
import re
import uuid
import subprocess
from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from models import CVInput, MsgPayload, CVWeaknessRequest, CVEnhancementRequest
from services import gemini_service
from services.latex_service import convert_to_latex_service

app = FastAPI()

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/pdf/{filename}")
def get_pdf(filename: str):
    file_path = os.path.join(LATEX_OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="application/pdf", filename=filename)

@app.post("/convert-tex-to-pdf/{filename}")
def convert_tex_to_pdf(filename: str):
    tex_file_path = os.path.join(LATEX_OUTPUT_DIR, filename)
    if not os.path.exists(tex_file_path):
        raise HTTPException(status_code=404, detail="TeX file not found")

    try:
        # Run pdflatex to convert .tex to .pdf
        subprocess.run([
            "pdflatex", "-output-directory", LATEX_OUTPUT_DIR, tex_file_path
        ], check=True)

        pdf_filename = filename.replace(".tex", ".pdf")
        pdf_file_path = os.path.join(LATEX_OUTPUT_DIR, pdf_filename)

        if not os.path.exists(pdf_file_path):
            raise HTTPException(status_code=500, detail="PDF generation failed")

        return {"message": "PDF generated successfully", "pdf_filename": pdf_filename}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Error during PDF generation: {str(e)}")

# --- New endpoints for the enhanced CV generation flow ---
@app.post("/analyze-cv-weaknesses")
async def analyze_cv_weaknesses(request: CVWeaknessRequest = Body(...)) -> dict:
    """
    Analyze a CV for weaknesses and areas that need improvement
    """
    try:
        result = await gemini_service.analyze_cv_weaknesses(request.cv_data)
        return {"data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing CV: {str(e)}")

@app.post("/enhance-cv")
async def enhance_cv(request: CVEnhancementRequest = Body(...)) -> dict:
    """
    Enhance CV with additional user input
    """
    try:
        enhanced_cv = await gemini_service.enhance_cv_with_input(
            request.cv_data, 
            request.additional_input
        )
        return {"data": enhanced_cv}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enhancing CV: {str(e)}")

@app.post("/generate-cv-flow")
async def generate_cv_flow(cv_input: CVInput) -> dict:
    """
    Complete CV generation flow:
    1. Initial CV structure from input
    2. Analyze weaknesses
    3. Return required additional inputs
    """
    try:
        # First get the initial CV structure
        cv_data = cv_input.data
        
        # Analyze the CV for weaknesses
        analysis = await gemini_service.analyze_cv_weaknesses(cv_data)
        
        # Return the analysis results and the original CV data
        return {
            "cv_data": cv_data,
            "analysis": analysis,
            "flow_id": str(uuid.uuid4())  # To track this CV flow session
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in CV generation flow: {str(e)}")

@app.post("/complete-cv-flow/{flow_id}")
async def complete_cv_flow(
    flow_id: str,
    request: dict = Body(...)
) -> dict:
    """
    Complete the CV flow with additional user input:
    1. Enhance CV with user input
    2. Generate final LaTeX
    3. Return enhanced CV and LaTeX
    """
    try:
        cv_data = request.get("cv_data", {})
        additional_input = request.get("additional_input", {})
        
        # Enhance CV with additional input
        enhanced_cv = await gemini_service.enhance_cv_with_input(cv_data, additional_input)
        
        # Generate LaTeX from enhanced CV
        latex_result = convert_to_latex_service(enhanced_cv)
        
        # Generate unique filename for the LaTeX file
        base_name = cv_data.get("cv_template", {}).get("sections", {}).get("header", {}).get("name", "CV")
        base_name = re.sub(r'[^\w\s-]', '', base_name).strip().replace(' ', '_')
        filename = f"{base_name}_{flow_id}.tex"
        
        # Save LaTeX to a file
        file_path = os.path.join(LATEX_OUTPUT_DIR, filename)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(latex_result.get("latex_content", ""))
            
        # Convert to PDF
        try:
            subprocess.run([
                "pdflatex", "-output-directory", LATEX_OUTPUT_DIR, file_path
            ], check=True)
            
            pdf_filename = filename.replace(".tex", ".pdf")
            pdf_file_path = os.path.join(LATEX_OUTPUT_DIR, pdf_filename)
            
            if not os.path.exists(pdf_file_path):
                return {
                    "enhanced_cv": enhanced_cv,
                    "latex_result": latex_result,
                    "message": "LaTeX generated but PDF conversion failed",
                    "tex_filename": filename
                }
                
            return {
                "enhanced_cv": enhanced_cv,
                "latex_result": latex_result,
                "message": "CV flow completed successfully",
                "tex_filename": filename,
                "pdf_filename": pdf_filename
            }
            
        except subprocess.CalledProcessError:
            # Return what we have even if PDF generation failed
            return {
                "enhanced_cv": enhanced_cv,
                "latex_result": latex_result,
                "message": "LaTeX generated but PDF conversion failed",
                "tex_filename": filename
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error completing CV flow: {str(e)}")