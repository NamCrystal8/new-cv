import os
import subprocess
from fastapi import APIRouter, HTTPException, File, UploadFile
from fastapi.responses import FileResponse
from models import CVInput
from services.latex_service import convert_to_latex_service
from core.app import gemini_service

router = APIRouter()

# Constants
LATEX_OUTPUT_DIR = "output_tex_files"

@router.post("/extract-pdf")
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

@router.post("/convert-to-latex/")
def convert_to_latex(cv_input: CVInput) -> dict[str, str]:
    return convert_to_latex_service(cv_input.data)

@router.get("/pdf/{filename}")
def get_pdf(filename: str):
    file_path = os.path.join(LATEX_OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File {filename} not found")
    
    # Log the PDF request for debugging
    print(f"Serving PDF file: {file_path}")
    
    # Return the file with explicit headers for PDF rendering
    headers = {
        'Content-Disposition': f'inline; filename="{filename}"',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
    
    return FileResponse(
        path=file_path,
        media_type='application/pdf',
        filename=filename,
        headers=headers
    )

@router.post("/convert-tex-to-pdf/{filename}")
def convert_tex_to_pdf(filename: str):
    tex_file_path = os.path.join(LATEX_OUTPUT_DIR, filename)
    if not os.path.exists(tex_file_path):
        raise HTTPException(status_code=404, detail="TeX file not found")

    pdf_filename = filename.replace(".tex", ".pdf")
    pdf_file_path = os.path.join(LATEX_OUTPUT_DIR, pdf_filename)
    
    # Clean up any existing PDF file
    if os.path.exists(pdf_file_path):
        try:
            os.remove(pdf_file_path)
            print(f"Removed existing PDF file: {pdf_file_path}")
        except Exception as e:
            print(f"Warning: Could not remove existing PDF file: {e}")
    
    try:
        # First attempt: Run pdflatex in non-stop mode
        print(f"Attempting to convert {tex_file_path} to PDF...")
        process = subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", "-output-directory", LATEX_OUTPUT_DIR, tex_file_path],
            check=False,  # Don't raise exception on non-zero return code
            capture_output=True,
            text=True
        )
        
        # Log the output for debugging
        print(f"pdflatex stdout: {process.stdout}")
        print(f"pdflatex stderr: {process.stderr}")
        
        # Check if PDF was created
        if not os.path.exists(pdf_file_path) or os.path.getsize(pdf_file_path) == 0:
            print("First attempt failed, trying with different options...")
            
            # Second attempt: with -shell-escape for additional permissions
            process = subprocess.run(
                ["pdflatex", "-shell-escape", "-interaction=nonstopmode", "-output-directory", LATEX_OUTPUT_DIR, tex_file_path],
                check=False,
                capture_output=True,
                text=True
            )
            
            print(f"Second attempt stdout: {process.stdout}")
            print(f"Second attempt stderr: {process.stderr}")

        # Final check
        if not os.path.exists(pdf_file_path):
            raise HTTPException(status_code=500, detail=f"PDF generation failed after multiple attempts. File not created.")
        
        if os.path.getsize(pdf_file_path) == 0:
            raise HTTPException(status_code=500, detail=f"PDF generation failed. File exists but is empty (0 bytes).")
        
        print(f"Successfully generated PDF: {pdf_file_path}, size: {os.path.getsize(pdf_file_path)} bytes")
        
        return {
            "message": "PDF generated successfully", 
            "pdf_filename": pdf_filename,
            "pdf_size": os.path.getsize(pdf_file_path)
        }
    except subprocess.CalledProcessError as e:
        error_msg = f"Error during PDF generation: {str(e)}"
        print(error_msg)
        if e.stdout:
            print(f"Process stdout: {e.stdout}")
        if e.stderr:
            print(f"Process stderr: {e.stderr}")
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        error_msg = f"Unexpected error during PDF generation: {str(e)}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)