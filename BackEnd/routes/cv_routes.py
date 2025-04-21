import os
import uuid
from fastapi import APIRouter, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import Dict
from utils.latex_prompt import get_latex_template
from services.latex_service import convert_to_latex_service
from core.app import gemini_service, cv_flows
from core.cloudinary_config import upload_file_to_cloudinary

router = APIRouter()

# Constants
LATEX_OUTPUT_DIR = "output_tex_files"

class CompleteFlowRequest(BaseModel):
    flow_id: str
    additional_inputs: Dict[str, str]

@router.post("/analyze-cv-weaknesses")
async def analyze_cv_weaknesses(file: UploadFile = File(...)):
    """
    Analyze a CV for weaknesses and suggest improvements.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        pdf_content = await file.read()
        # Extract CV data from PDF using Gemini service
        try:
            extracted_cv_data = await gemini_service.extract_pdf_text(pdf_content=pdf_content)
            print(f"[DEBUG] Extracted CV data type: {type(extracted_cv_data)}")
            
            if isinstance(extracted_cv_data, dict) and "error" in extracted_cv_data:
                print(f"[DEBUG] Error in extracted CV data: {extracted_cv_data['error']}")
                raise Exception(extracted_cv_data["error"])
                
        except Exception as api_error:
            print(f"Error with Gemini API during extraction: {str(api_error)}")
            raise HTTPException(status_code=500, detail=f"Error extracting CV data: {str(api_error)}")

        # Generate a flow ID to track this CV processing
        flow_id = str(uuid.uuid4())
        
        # Analyze the CV for weaknesses - these would normally come from a Gemini analysis
        # For now, we'll use example values but in the future this should be dynamically generated
        try:
            # Do a proper analysis of the CV using Gemini
            # For now, using static values for demonstration
            required_inputs = [
                "work_experience",
                "education",
                "skills",
                "projects",
                "achievements"
            ]
            
            weaknesses = [
                "Missing quantifiable achievements in work experience",
                "Skills section lacks organization by categories",
                "Project descriptions could be more specific about your role"
            ]
            
            missing_information = [
                "Specific dates for education and work experience",
                "Contact information could be more comprehensive",
                "Lack of relevant certifications"
            ]
            
            improvement_suggestions = [
                "Add metrics to showcase impact in previous roles",
                "Organize skills by categories like Technical, Soft Skills, etc.",
                "Expand on your role and contributions in projects"
            ]
        except Exception as analysis_error:
            print(f"Error analyzing CV weaknesses: {str(analysis_error)}")
            # Provide default values if analysis fails
            required_inputs = ["experience", "skills"]
            weaknesses = ["Analysis could not be completed"]
            missing_information = ["Please review your CV manually"]
            improvement_suggestions = ["Ensure all sections are complete"]
        
        # Store the extracted CV data for later use
        # Make sure we store the actual data structure, not just a string representation
        if isinstance(extracted_cv_data, dict):
            # Ensure we have the cv_template structure for consistent processing
            if "cv_template" not in extracted_cv_data:
                extracted_cv_data = gemini_service.ensure_cv_structure(extracted_cv_data)
            cv_flows[flow_id] = {
                "extracted_text": extracted_cv_data,  # Store as the actual dict
                "status": "analyzed"
            }
        else:
            # If it's not a dict (unlikely but possible), convert to string for storage
            cv_flows[flow_id] = {
                "extracted_text": str(extracted_cv_data),
                "status": "analyzed"
            }
        
        # Create a safe preview of the extracted text for the response
        if isinstance(extracted_cv_data, dict):
            preview = str(extracted_cv_data)[:500] + "..." if len(str(extracted_cv_data)) > 500 else str(extracted_cv_data)
        else:
            preview = str(extracted_cv_data)[:500] + "..." if len(str(extracted_cv_data)) > 500 else str(extracted_cv_data)
        
        return {
            "flow_id": flow_id,
            "cv_data": {
                "extracted_text": preview
            },
            "analysis": {
                "summary": "Your CV has been analyzed. You can provide additional information to enhance it (optional).",
                "required_inputs": required_inputs,
                "weaknesses": weaknesses,
                "missing_information": missing_information,
                "improvement_suggestions": improvement_suggestions
            }
        }
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Error in analyze-cv-weaknesses: {str(e)}")
        import traceback
        print(f"[DEBUG] Stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error analyzing PDF: {str(e)}")
    finally:
        await file.close()

@router.post("/complete-cv-flow")
async def complete_cv_flow(request: CompleteFlowRequest):
    """
    Complete the CV flow with additional inputs and generate an enhanced CV.
    """
    flow_id = request.flow_id
    additional_inputs = request.additional_inputs
    
    if flow_id not in cv_flows:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    try:
        # Get the extracted text from the flow
        flow_data = cv_flows[flow_id]
        extracted_text = flow_data["extracted_text"]
        
        print(f"[DEBUG] Initial extracted_text type: {type(extracted_text)}")
        
        # Handle case where extracted_text might be a string representation of a dict
        if isinstance(extracted_text, str) and extracted_text.startswith('{'):
            print("[DEBUG] Detected string representation of JSON, parsing...")
            try:
                # Try JSON parsing first
                import json
                extracted_text = json.loads(extracted_text)
            except json.JSONDecodeError:
                try:
                    # Fall back to ast.literal_eval if JSON parsing fails
                    import ast
                    extracted_text = ast.literal_eval(extracted_text)
                except Exception as parse_error:
                    print(f"[DEBUG] Failed to parse string: {parse_error}")
        
        # Check if additional inputs are empty or if any of them have values
        has_additional_data = bool(additional_inputs) and any(value.strip() for value in additional_inputs.values())
        print(f"[DEBUG] Has additional data: {has_additional_data}")
        
        # Make sure we have a valid dictionary to work with
        if not isinstance(extracted_text, dict):
            print("[DEBUG] Extracted text is not a dictionary - creating empty structure")
            extracted_text = {}
        
        # Ensure the data is properly formatted with cv_template structure
        if "cv_template" not in extracted_text:
            print("[DEBUG] Adding cv_template wrapper to data")
            extracted_text = gemini_service.ensure_cv_structure(extracted_text)
        
        try:
            if has_additional_data:
                # If we have additional inputs, enhance the CV
                print("[DEBUG] Enhancing CV with additional inputs...")
                enhanced_cv = await gemini_service.enhance_cv_with_input(
                    cv_data=extracted_text,
                    additional_input=additional_inputs
                )
                
                # Use the enhanced CV for LaTeX conversion
                latex_result = convert_to_latex_service(enhanced_cv)
            else:
                # If no additional inputs, just use the original CV data
                print("[DEBUG] No additional inputs provided, using original CV data...")
                latex_result = convert_to_latex_service(extracted_text)
                
        except Exception as latex_error:
            print(f"[DEBUG] Error in LaTeX conversion: {str(latex_error)}")
            import traceback
            print(f"[DEBUG] Stack trace: {traceback.format_exc()}")
            
            # Fallback to basic LaTeX template if conversion fails
            latex_content = get_latex_template()
            latex_result = {"latex": latex_content}
        
        # Generate a unique filename for the LaTeX file
        tex_filename = f"Dang_Ngoc_Nam_{flow_id}.tex"
        tex_path = os.path.join(LATEX_OUTPUT_DIR, tex_filename)
        
        # Write the LaTeX content to file
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(latex_result["latex"])
        
        # Convert the LaTeX file to PDF
        from routes.pdf_routes import convert_tex_to_pdf
        pdf_result = convert_tex_to_pdf(tex_filename)
        pdf_filename = tex_filename.replace(".tex", ".pdf")
        pdf_path = os.path.join(LATEX_OUTPUT_DIR, pdf_filename)
        
        # If PDF wasn't generated, raise an error
        if not os.path.exists(pdf_path):
            raise HTTPException(
                status_code=500, 
                detail="PDF generation failed. Please check your LaTeX template or try again."
            )
        
        # Upload the PDF to Cloudinary
        cloudinary_result = upload_file_to_cloudinary(pdf_path)
        if not cloudinary_result["success"]:
            raise HTTPException(
                status_code=500, 
                detail=f"PDF generation succeeded, but upload to Cloudinary failed: {cloudinary_result['error']}"
            )
        
        # Update the flow status
        cv_flows[flow_id]["status"] = "completed"
        
        # Return full URL to PDF file
        return {
            "message": "CV enhancement completed successfully",
            "pdf_url": cloudinary_result["url"]
        }
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Error completing CV flow: {str(e)}")
        import traceback
        print(f"[DEBUG] Stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error completing CV flow: {str(e)}")