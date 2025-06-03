import os
import uuid
from fastapi import APIRouter, HTTPException, File, UploadFile, Depends
from pydantic import BaseModel
from typing import Dict
from utils.latex_prompt import get_latex_template
from services.latex_service import convert_to_latex_service
from core.app import gemini_service, cv_flows
from core.cloudinary_config import upload_file_to_cloudinary
from core.security import current_active_user
from models.user import User, CV  # Import from models package
from core.database import get_async_db  # Import async session dependency
from sqlalchemy.ext.asyncio import AsyncSession
from services.subscription_service import SubscriptionService, get_subscription_service
from models.subscription import AnalysisType
import hashlib

router = APIRouter()

# Constants
LATEX_OUTPUT_DIR = "output_tex_files"

class CompleteFlowRequest(BaseModel):
    flow_id: str
    additional_inputs: Dict[str, str]

class JobDescriptionRequest(BaseModel):
    flow_id: str
    job_description: str

@router.post("/analyze-cv-weaknesses")
async def analyze_cv_weaknesses(
    file: UploadFile = File(...),
    user: User = Depends(current_active_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service)
):
    """
    Analyze a CV for weaknesses and suggest improvements.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Check usage limits
    can_proceed = await subscription_service.check_usage_limits(user.id, "cv_analysis")
    if not can_proceed:
        usage_stats = await subscription_service.get_usage_stats(user.id)
        raise HTTPException(
            status_code=429, 
            detail={
                "message": "Usage limit exceeded. Please upgrade your subscription.",
                "usage_stats": usage_stats,
                "upgrade_required": True
            }
        )
    
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
        
        # Analyze the CV for weaknesses based on the CV structure
        try:
            # Ensure we have a proper structure to work with
            if not isinstance(extracted_cv_data, dict):
                extracted_cv_data = {}
            
            if "cv_template" not in extracted_cv_data:
                extracted_cv_data = gemini_service.ensure_cv_structure(extracted_cv_data)
            
            cv_template = extracted_cv_data.get("cv_template", {})
            sections = cv_template.get("sections", {})
            
            # Generate section-based analysis
            section_analysis = {}
            missing_sections = []
            improvement_suggestions = []
            
            # Analyze the header (contact info)
            header = sections.get("header", {})
            contact_info = header.get("contact_info", {})
            header_analysis = {
                "is_complete": True,
                "missing_fields": []
            }
            
            # Check header fields
            if not header.get("name") or header.get("name") == "Firstname Lastname":
                header_analysis["is_complete"] = False
                header_analysis["missing_fields"].append("name")
            
            # Check contact info fields
            for field in ["email", "phone", "location"]:
                field_data = contact_info.get(field, {})
                if not field_data or not field_data.get("value"):
                    header_analysis["is_complete"] = False
                    header_analysis["missing_fields"].append(f"contact_info.{field}")
            
            if not header_analysis["is_complete"]:
                missing_sections.append("Contact Information")
                improvement_suggestions.append("Complete your contact information for better reachability")
            
            section_analysis["header"] = header_analysis
            
            # Analyze education section
            education = sections.get("education", {})
            education_items = education.get("items", [])
            education_analysis = {
                "is_complete": bool(education_items),
                "item_count": len(education_items),
                "missing_fields": []
            }
            
            if not education_items:
                missing_sections.append("Education")
                improvement_suggestions.append("Add your educational background")
            else:
                # Check for incomplete education items
                incomplete_items = 0
                for item in education_items:
                    if not item.get("institution") or not item.get("degree"):
                        incomplete_items += 1
                
                if incomplete_items > 0:
                    education_analysis["missing_fields"].append(f"{incomplete_items} education entries are incomplete")
                    improvement_suggestions.append("Complete all education entries with institution, degree, and dates")
            
            section_analysis["education"] = education_analysis
            
            # Analyze experience section
            experience = sections.get("experience", {})
            experience_items = experience.get("items", [])
            experience_analysis = {
                "is_complete": bool(experience_items),
                "item_count": len(experience_items),
                "missing_fields": [],
                "items_without_achievements": 0,
            }
            
            if not experience_items:
                missing_sections.append("Work Experience")
                improvement_suggestions.append("Add your work experience to showcase your professional background")
            else:
                # Check for achievements and quantifiables
                items_without_achievements = 0
                items_without_quantifiables = 0
                
                for item in experience_items:
                    achievements = item.get("achievements", [])
                    
                    if not achievements:
                        items_without_achievements += 1
                        continue
                    
                    # Check for quantifiable achievements (containing numbers)
                    has_quantifiable = False
                    for achievement in achievements:
                        if any(char.isdigit() for char in achievement):
                            has_quantifiable = True
                            break
                    
                    if not has_quantifiable:
                        items_without_quantifiables += 1
                
                experience_analysis["items_without_achievements"] = items_without_achievements
                experience_analysis["items_without_quantifiables"] = items_without_quantifiables
                
                if items_without_achievements > 0:
                    experience_analysis["missing_fields"].append(f"{items_without_achievements} jobs lack achievements")
                    improvement_suggestions.append("Add achievements for all work experiences")
                
                if items_without_quantifiables > 0:
                    improvement_suggestions.append("Add quantifiable metrics to your achievements (e.g., 'Increased sales by 20%')")
            
            section_analysis["experience"] = experience_analysis
            
            # Analyze skills section
            skills = sections.get("skills", {})
            skill_categories = skills.get("categories", [])
            skills_analysis = {
                "is_complete": bool(skill_categories),
                "category_count": len(skill_categories),
                "total_skills": sum(len(category.get("items", [])) for category in skill_categories),
                "missing_categories": []
            }
            
            if not skill_categories:
                missing_sections.append("Skills")
                improvement_suggestions.append("Add your technical and soft skills")
            else:
                # Check for common categories that might be missing
                category_names = [category.get("name", "").lower() for category in skill_categories]
                
                common_categories = ["technical", "language", "soft skills", "tools"]
                for category in common_categories:
                    if not any(category in name for name in category_names):
                        skills_analysis["missing_categories"].append(category)
                
                if skills_analysis["missing_categories"]:
                    improvement_suggestions.append("Consider adding more skill categories: " + ", ".join(skills_analysis["missing_categories"]))
                
                if skills_analysis["total_skills"] < 5:
                    improvement_suggestions.append("Add more specific skills to make your profile more attractive")
            
            section_analysis["skills"] = skills_analysis
            
            # Analyze projects section
            projects = sections.get("projects", {})
            project_items = projects.get("items", [])
            projects_analysis = {
                "is_complete": bool(project_items),
                "item_count": len(project_items),
                "items_without_contributions": 0
            }
            
            if not project_items and not experience_items:
                missing_sections.append("Projects")
                improvement_suggestions.append("Add projects to showcase your practical skills")
            elif project_items:
                # Check for contributions
                items_without_contributions = 0
                for item in project_items:
                    if not item.get("key_contributions", []):
                        items_without_contributions += 1
                
                projects_analysis["items_without_contributions"] = items_without_contributions
                
                if items_without_contributions > 0:
                    improvement_suggestions.append("Add specific contributions for each project")
            
            section_analysis["projects"] = projects_analysis
            
            # Languages (list type)
            languages = sections.get("languages", {})
            language_items = languages.get("items", [])
            language_fields = []
            for i, item in enumerate(language_items):
                language_fields.append({
                    "id": f"language_{i}",
                    "language": item.get("language", "") or item.get("name", ""),
                    "proficiency": item.get("proficiency", "Intermediate")
                })
            
            section_analysis["languages"] = {
                "is_complete": bool(language_fields),
                "item_count": len(language_fields)
            }
            
            # Generate detailed analysis using Gemini
            detailed_analysis = await gemini_service.generate_detailed_analysis(extracted_cv_data)
            
            # Create a list of editable sections based on the CV structure
            editable_sections = []
            
            # Header section (always include)
            editable_sections.append({
                "id": "header",
                "name": "Contact Information",
                "type": "object",
                "fields": [
                    {"id": "name", "name": "Full Name", "value": header.get("name", "")},
                    {"id": "email", "name": "Email", "value": contact_info.get("email", {}).get("value", "")},
                    {"id": "phone", "name": "Phone", "value": contact_info.get("phone", {}).get("value", "")},
                    {"id": "location", "name": "Location", "value": contact_info.get("location", {}).get("value", "")}
                ]
            })
            
            # Education (list type)
            education_fields = []
            for i, item in enumerate(education_items):
                education_fields.append({
                    "id": f"education_{i}",
                    "institution": item.get("institution", ""),
                    "degree": item.get("degree", ""),
                    "location": item.get("location", ""),
                    "graduation_date": item.get("graduation_date", ""),
                    "gpa": item.get("gpa", "")
                })
            
            editable_sections.append({
                "id": "education",
                "name": "Education",
                "type": "list",
                "items": education_fields,
                "template": {
                    "institution": "",
                    "degree": "",
                    "location": "",
                    "graduation_date": "",
                    "gpa": ""
                }
            })
            
            # Experience (list type)
            experience_fields = []
            for i, item in enumerate(experience_items):
                achievements = item.get("achievements", [])
                experience_fields.append({
                    "id": f"experience_{i}",
                    "company": item.get("company", ""),
                    "title": item.get("title", ""),
                    "location": item.get("location", ""),
                    "start_date": item.get("dates", {}).get("start", ""),
                    "end_date": item.get("dates", {}).get("end", ""),
                    "is_current": item.get("dates", {}).get("is_current", False),
                    "achievements": achievements
                })
            
            editable_sections.append({
                "id": "experience",
                "name": "Work Experience",
                "type": "list",
                "items": experience_fields,
                "template": {
                    "company": "",
                    "title": "",
                    "location": "",
                    "start_date": "",
                    "end_date": "",
                    "is_current": False,
                    "achievements": []
                }
            })
            
            # Skills (nested list type)
            skill_fields = []
            for i, category in enumerate(skill_categories):
                skill_fields.append({
                    "id": f"skill_category_{i}",
                    "name": category.get("name", ""),
                    "items": category.get("items", [])
                })
            
            editable_sections.append({
                "id": "skills",
                "name": "Skills",
                "type": "nested_list",
                "categories": skill_fields,
                "template": {
                    "name": "",
                    "items": []
                }
            })
            
            # Projects (list type)
            project_fields = []
            for i, item in enumerate(project_items):
                project_fields.append({
                    "id": f"project_{i}",
                    "title": item.get("title", ""),
                    "description": item.get("description", ""),
                    "start_date": item.get("dates", {}).get("start", ""),
                    "end_date": item.get("dates", {}).get("end", ""),
                    "technologies": item.get("technologies", []),
                    "contributions": item.get("key_contributions", [])
                })
            
            editable_sections.append({
                "id": "projects",
                "name": "Projects",
                "type": "list",
                "items": project_fields,
                "template": {
                    "title": "",
                    "description": "",
                    "start_date": "",
                    "end_date": "",
                    "technologies": [],
                    "contributions": []
                }
            })
            
            # Languages (list type)
            languages = sections.get("languages", {})
            language_items = languages.get("items", [])
            language_fields = []
            for i, item in enumerate(language_items):
                language_fields.append({
                    "id": f"language_{i}",
                    "language": item.get("language", "") or item.get("name", ""),
                    "proficiency": item.get("proficiency", "Intermediate")
                })
            
            editable_sections.append({
                "id": "languages",
                "name": "Languages",
                "type": "list",
                "items": language_fields,
                "template": {
                    "language": "",
                    "proficiency": "Intermediate"
                }
            })
            
        except Exception as analysis_error:
            print(f"Error analyzing CV structure: {str(analysis_error)}")
            import traceback
            print(f"[DEBUG] Analysis error stack trace: {traceback.format_exc()}")
            # Provide fallback values if analysis fails
            missing_sections = ["Could not analyze CV completely"]
            improvement_suggestions = ["Please review your CV manually and ensure all sections are complete"]
            section_analysis = {}
            editable_sections = [{
                "id": "raw_input",
                "name": "CV Contents",
                "type": "textarea",
                "value": str(extracted_cv_data)[:1000] + "..."
            }]
            detailed_analysis = {
                "weaknesses": [
                    {
                        "category": "General",
                        "description": "Unable to analyze CV properly. Please review manually.",
                        "severity": "medium"
                    }
                ],
                "recommendations": []
            }
        
        # Store the extracted CV data for later use
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
        
        # Create a preview of the extracted text for the response (truncated)
        if isinstance(extracted_cv_data, dict):
            preview = str(extracted_cv_data)[:200] + "..." if len(str(extracted_cv_data)) > 200 else str(extracted_cv_data)
        else:
            preview = str(extracted_cv_data)[:200] + "..." if len(str(extracted_cv_data)) > 200 else str(extracted_cv_data)
        
        # Return structured analysis data
        return {
            "flow_id": flow_id,
            "cv_data": {
                "extracted_text": preview
            },
            "analysis": {
                "summary": "Your CV has been analyzed. Review the highlighted areas and edit as needed.",
                "missing_sections": missing_sections,
                "improvement_suggestions": improvement_suggestions,
                "section_analysis": section_analysis
            },
            "detailed_analysis": detailed_analysis,
            "editable_sections": editable_sections
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
async def complete_cv_flow(
    request: CompleteFlowRequest,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Complete the CV flow with additional inputs and generate an enhanced CV.
    """
    flow_id = request.flow_id
    additional_inputs = request.additional_inputs
    
    print(f"[DEBUG] Received additional_inputs: {additional_inputs}")
    
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
        
        # Check if additional inputs exist
        has_additional_data = bool(additional_inputs)
        print(f"[DEBUG] Has additional data: {has_additional_data}")
        
        # Check if there are applied recommendations
        applied_recommendations = []
        if "applied_recommendations" in additional_inputs:
            try:
                applied_recommendations = json.loads(additional_inputs["applied_recommendations"])
                # Remove this from additional_inputs to avoid conflicts
                del additional_inputs["applied_recommendations"]
            except Exception as rec_error:
                print(f"[DEBUG] Error processing applied recommendations: {str(rec_error)}")
        
        # Make sure we have a valid dictionary to work with
        if not isinstance(extracted_text, dict):
            print("[DEBUG] Extracted text is not a dictionary - creating empty structure")
            extracted_text = {}
        
        # Ensure the data is properly formatted with cv_template structure
        if "cv_template" not in extracted_text:
            print("[DEBUG] Adding cv_template wrapper to data")
            extracted_text = gemini_service.ensure_cv_structure(extracted_text)
        
        # Update CV structure with new data from editable sections
        if has_additional_data:
            # Process header/contact info updates
            import json
            
            cv_template = extracted_text.get("cv_template", {})
            sections = cv_template.get("sections", {})
            
            # Update header fields
            for key, value in additional_inputs.items():
                if key.startswith("header."):
                    field_name = key.split('.')[1]  # e.g., "header.name" -> "name"
                    if field_name == "name":
                        if "header" not in sections:
                            sections["header"] = {}
                        sections["header"]["name"] = value
                    elif field_name in ["email", "phone", "location"]:
                        if "header" not in sections:
                            sections["header"] = {}
                        if "contact_info" not in sections["header"]:
                            sections["header"]["contact_info"] = {}
                        
                        # Initialize the field if it doesn't exist
                        if field_name not in sections["header"]["contact_info"]:
                            sections["header"]["contact_info"][field_name] = {}
                        
                        # Update the value
                        sections["header"]["contact_info"][field_name]["value"] = value
                        
                        # Update link for email and phone
                        if field_name == "email":
                            sections["header"]["contact_info"][field_name]["link"] = f"mailto:{value}"
                        elif field_name == "phone":
                            sections["header"]["contact_info"][field_name]["link"] = f"tel:{value}"
            
            # Update education section
            if "education" in additional_inputs:
                try:
                    education_items = json.loads(additional_inputs["education"])
                    if "education" not in sections:
                        sections["education"] = {"section_title": "Education", "items": []}
                        
                    # Transform the education items to match the expected format
                    formatted_education_items = []
                    for item in education_items:
                        formatted_item = {
                            "institution": item.get("institution", ""),
                            "degree": item.get("degree", ""),
                            "location": item.get("location", ""),
                            "graduation_date": item.get("graduation_date", "")
                        }
                        
                        # Add optional GPA if provided
                        if "gpa" in item and item["gpa"]:
                            formatted_item["gpa"] = item["gpa"]
                            
                        formatted_education_items.append(formatted_item)
                    
                    sections["education"]["items"] = formatted_education_items
                except Exception as e:
                    print(f"[DEBUG] Error processing education data: {str(e)}")
            
            # Update experience section
            if "experience" in additional_inputs:
                try:
                    experience_items = json.loads(additional_inputs["experience"])
                    if "experience" not in sections:
                        sections["experience"] = {"section_title": "Experience", "items": []}
                    
                    # Transform the experience items to match the expected format
                    formatted_experience_items = []
                    for item in experience_items:
                        formatted_item = {
                            "company": item.get("company", ""),
                            "title": item.get("title", ""),
                            "location": item.get("location", ""),
                            "dates": {
                                "start": item.get("start_date", ""),
                                "end": item.get("end_date", ""),
                                "is_current": item.get("is_current", False)
                            },
                            "achievements": item.get("achievements", [])
                        }
                        formatted_experience_items.append(formatted_item)
                    
                    sections["experience"]["items"] = formatted_experience_items
                except Exception as e:
                    print(f"[DEBUG] Error processing experience data: {str(e)}")
            
            # Update skills section
            if "skills" in additional_inputs:
                try:
                    skill_categories = json.loads(additional_inputs["skills"])
                    if "skills" not in sections:
                        sections["skills"] = {"section_title": "Skills", "categories": []}
                    
                    # Transform skill categories to match the expected format
                    formatted_skill_categories = []
                    for category in skill_categories:
                        formatted_category = {
                            "name": category.get("name", ""),
                            "items": category.get("items", [])
                        }
                        formatted_skill_categories.append(formatted_category)
                    
                    sections["skills"]["categories"] = formatted_skill_categories
                except Exception as e:
                    print(f"[DEBUG] Error processing skills data: {str(e)}")
            
            # Update projects section
            if "projects" in additional_inputs:
                try:
                    project_items = json.loads(additional_inputs["projects"])
                    if "projects" not in sections:
                        sections["projects"] = {"section_title": "Projects", "items": []}
                    
                    # Transform project items to match the expected format
                    formatted_project_items = []
                    for item in project_items:
                        formatted_item = {
                            "title": item.get("title", ""),
                            "description": item.get("description", ""),
                            "dates": {
                                "start": item.get("start_date", ""),
                                "end": item.get("end_date", "")
                            },
                            "technologies": item.get("technologies", []),
                            "key_contributions": item.get("contributions", [])
                        }
                        formatted_project_items.append(formatted_item)
                    
                    sections["projects"]["items"] = formatted_project_items
                except Exception as e:
                    print(f"[DEBUG] Error processing projects data: {str(e)}")
            
            # Update languages section
            if "languages" in additional_inputs:
                try:
                    language_items = json.loads(additional_inputs["languages"])
                    if "languages" not in sections:
                        sections["languages"] = {"section_title": "Languages", "items": []}
                    
                    # Transform language items to match the expected format
                    formatted_language_items = []
                    for item in language_items:
                        formatted_item = {
                            "language": item.get("language", ""),
                            "proficiency": item.get("proficiency", "Intermediate")
                        }
                        formatted_language_items.append(formatted_item)
                    
                    sections["languages"]["items"] = formatted_language_items
                except Exception as e:
                    print(f"[DEBUG] Error processing languages data: {str(e)}")
            
            # Raw text fallback (if present)
            if "raw_text" in additional_inputs:
                print("[DEBUG] Using raw text input as fallback")
                extracted_text = {"raw_text": additional_inputs["raw_text"]}
        
        # Apply any recommendations from the detailed analysis to the LaTeX structure
        # This helps ensure the final PDF reflects the carousel recommendations
        if applied_recommendations:
            try:
                cv_template = extracted_text.get("cv_template", {})
                sections = cv_template.get("sections", {})
                
                for rec in applied_recommendations:
                    section_name = rec.get("section", "").lower()
                    field_name = rec.get("field", "")
                    
                    # Skip if missing essential info
                    if not section_name or not field_name or not rec.get("suggested"):
                        continue
                    
                    # Handle different section types
                    if section_name in ["header", "contact", "contact information"]:
                        # Handle header fields
                        if field_name == "name":
                            if "header" in sections:
                                sections["header"]["name"] = rec["suggested"]
                        elif field_name in ["email", "phone", "location"]:
                            if "header" in sections and "contact_info" in sections["header"]:
                                if field_name in sections["header"]["contact_info"]:
                                    sections["header"]["contact_info"][field_name]["value"] = rec["suggested"]
                    
                    # Handle structured fields like "experience.0.company"
                    elif "." in field_name:
                        parts = field_name.split(".")
                        if len(parts) == 3:
                            section_type, index_str, subfield = parts
                            try:
                                index = int(index_str)
                                if section_type in sections and "items" in sections[section_type]:
                                    if index < len(sections[section_type]["items"]):
                                        if section_type == "experience" and subfield == "achievements":
                                            # Handle special case for achievements (array)
                                            try:
                                                achievements = json.loads(rec["suggested"])
                                                sections[section_type]["items"][index][subfield] = achievements
                                            except:
                                                # If not valid JSON, treat as single achievement
                                                sections[section_type]["items"][index][subfield] = [rec["suggested"]]
                                        else:
                                            # Handle regular fields
                                            sections[section_type]["items"][index][subfield] = rec["suggested"]
                            except (ValueError, IndexError) as e:
                                print(f"[DEBUG] Error applying recommendation to {field_name}: {str(e)}")
                    
                    # Handle new item additions
                    elif field_name == "new_item":
                        try:
                            new_item = json.loads(rec["suggested"])
                            if section_name in sections and "items" in sections[section_name]:
                                sections[section_name]["items"].append(new_item)
                        except Exception as e:
                            print(f"[DEBUG] Error adding new item to {section_name}: {str(e)}")
            
            except Exception as e:
                print(f"[DEBUG] Error applying recommendations: {str(e)}")
        
        try:
            # Generate the LaTeX from the enhanced CV structure
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
        
        # Save CV record to database with the CV structure
        new_cv = CV(
            file_url=cloudinary_result["url"], 
            user_id=user.id,
            cv_structure=extracted_text  # Save the CV structure as JSON
        )
        db.add(new_cv)
        await db.commit()
        await db.refresh(new_cv)
        
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

@router.get("/user-cvs")
async def get_user_cvs(
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Retrieve all CVs uploaded by the current user.
    """
    from sqlalchemy import select
    
    try:
        # Query to get all CVs for the current user ordered by creation date (oldest first for proper numbering)
        query = select(CV).where(CV.user_id == user.id).order_by(CV.id.asc())
        result = await db.execute(query)
        user_cvs = result.scalars().all()
        
        # Convert to response format with user-specific CV numbers
        cvs_response = []
        for index, cv in enumerate(user_cvs):
            user_cv_number = index + 1  # User-specific CV number starting from 1
            cvs_response.append({
                "id": cv.id,  # Keep the global ID for backend operations
                "user_cv_number": user_cv_number,  # Add user-specific CV number
                "file_url": cv.file_url,
                "has_structure": cv.cv_structure is not None,  # Flag to indicate if this CV can be re-edited
                # Add created_at if you have that field
                # "created_at": cv.created_at,
            })
        
        # Return in reverse order (newest first) for display purposes
        cvs_response.reverse()
        return {"cvs": cvs_response}
    except Exception as e:
        print(f"Error fetching user CVs: {str(e)}")
        import traceback
        print(f"[DEBUG] Stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error fetching user CVs: {str(e)}")

@router.get("/cv/{cv_id}")
async def get_cv(
    cv_id: int,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Retrieve a specific CV by ID, including its structure for re-editing
    """
    from sqlalchemy import select
    
    try:
        # Query to get the specific CV
        query = select(CV).where(CV.id == cv_id, CV.user_id == user.id)
        result = await db.execute(query)
        cv = result.scalars().first()
        
        if not cv:
            raise HTTPException(status_code=404, detail="CV not found")
        
        # Return CV data with structure
        return {
            "id": cv.id,
            "file_url": cv.file_url,
            "cv_structure": cv.cv_structure,
            "can_edit": cv.cv_structure is not None
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching CV: {str(e)}")
        import traceback
        print(f"[DEBUG] Stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error fetching CV: {str(e)}")

@router.post("/cv/{cv_id}/update")
async def update_cv(
    cv_id: int,
    request: CompleteFlowRequest,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Update a previously generated CV with new structure and regenerate the PDF
    """
    from sqlalchemy import select
    import json
    
    try:
        # Query to get the specific CV
        query = select(CV).where(CV.id == cv_id, CV.user_id == user.id)
        result = await db.execute(query)
        cv = result.scalars().first()
        
        if not cv:
            raise HTTPException(status_code=404, detail="CV not found")
        
        # Get the existing CV structure
        cv_structure = cv.cv_structure
        if not cv_structure:
            raise HTTPException(status_code=400, detail="This CV cannot be edited (no structure data available)")
        
        # Process the flow similar to complete_cv_flow
        flow_id = request.flow_id
        additional_inputs = request.additional_inputs
        
        # Create a flow entry if needed
        if flow_id not in cv_flows:
            flow_id = str(uuid.uuid4())
            cv_flows[flow_id] = {
                "extracted_text": cv_structure,
                "status": "loaded_from_db"
            }
        
        # Update CV structure with new data from editable sections
        extracted_text = cv_structure
        
        # Process additional inputs (same logic as in complete_cv_flow)
        if additional_inputs:
            cv_template = extracted_text.get("cv_template", {})
            sections = cv_template.get("sections", {})
            
            # Update header fields
            for key, value in additional_inputs.items():
                if key.startswith("header."):
                    field_name = key.split('.')[1]  # e.g., "header.name" -> "name"
                    if field_name == "name":
                        if "header" not in sections:
                            sections["header"] = {}
                        sections["header"]["name"] = value
                    elif field_name in ["email", "phone", "location"]:
                        if "header" not in sections:
                            sections["header"] = {}
                        if "contact_info" not in sections["header"]:
                            sections["header"]["contact_info"] = {}
                        
                        # Initialize the field if it doesn't exist
                        if field_name not in sections["header"]["contact_info"]:
                            sections["header"]["contact_info"][field_name] = {}
                        
                        # Update the value
                        sections["header"]["contact_info"][field_name]["value"] = value
                        
                        # Update link for email and phone
                        if field_name == "email":
                            sections["header"]["contact_info"][field_name]["link"] = f"mailto:{value}"
                        elif field_name == "phone":
                            sections["header"]["contact_info"][field_name]["link"] = f"tel:{value}"
            
            # Update education section
            if "education" in additional_inputs:
                try:
                    education_items = json.loads(additional_inputs["education"])
                    if "education" not in sections:
                        sections["education"] = {"section_title": "Education", "items": []}
                        
                    # Transform the education items to match the expected format
                    formatted_education_items = []
                    for item in education_items:
                        formatted_item = {
                            "institution": item.get("institution", ""),
                            "degree": item.get("degree", ""),
                            "location": item.get("location", ""),
                            "graduation_date": item.get("graduation_date", "")
                        }
                        
                        # Add optional GPA if provided
                        if "gpa" in item and item["gpa"]:
                            formatted_item["gpa"] = item["gpa"]
                            
                        formatted_education_items.append(formatted_item)
                    
                    sections["education"]["items"] = formatted_education_items
                except Exception as e:
                    print(f"[DEBUG] Error processing education data: {str(e)}")
            
            # Update experience section
            if "experience" in additional_inputs:
                try:
                    experience_items = json.loads(additional_inputs["experience"])
                    if "experience" not in sections:
                        sections["experience"] = {"section_title": "Experience", "items": []}
                    
                    # Transform the experience items to match the expected format
                    formatted_experience_items = []
                    for item in experience_items:
                        formatted_item = {
                            "company": item.get("company", ""),
                            "title": item.get("title", ""),
                            "location": item.get("location", ""),
                            "dates": {
                                "start": item.get("start_date", ""),
                                "end": item.get("end_date", ""),
                                "is_current": item.get("is_current", False)
                            },
                            "achievements": item.get("achievements", [])
                        }
                        formatted_experience_items.append(formatted_item)
                    
                    sections["experience"]["items"] = formatted_experience_items
                except Exception as e:
                    print(f"[DEBUG] Error processing experience data: {str(e)}")
            
            # Update skills section
            if "skills" in additional_inputs:
                try:
                    skill_categories = json.loads(additional_inputs["skills"])
                    if "skills" not in sections:
                        sections["skills"] = {"section_title": "Skills", "categories": []}
                    
                    # Transform skill categories to match the expected format
                    formatted_skill_categories = []
                    for category in skill_categories:
                        formatted_category = {
                            "name": category.get("name", ""),
                            "items": category.get("items", [])
                        }
                        formatted_skill_categories.append(formatted_category)
                    
                    sections["skills"]["categories"] = formatted_skill_categories
                except Exception as e:
                    print(f"[DEBUG] Error processing skills data: {str(e)}")
            
            # Update projects section
            if "projects" in additional_inputs:
                try:
                    project_items = json.loads(additional_inputs["projects"])
                    if "projects" not in sections:
                        sections["projects"] = {"section_title": "Projects", "items": []}
                    
                    # Transform project items to match the expected format
                    formatted_project_items = []
                    for item in project_items:
                        formatted_item = {
                            "title": item.get("title", ""),
                            "description": item.get("description", ""),
                            "dates": {
                                "start": item.get("start_date", ""),
                                "end": item.get("end_date", "")
                            },
                            "technologies": item.get("technologies", []),
                            "key_contributions": item.get("contributions", [])
                        }
                        formatted_project_items.append(formatted_item)
                    
                    sections["projects"]["items"] = formatted_project_items
                except Exception as e:
                    print(f"[DEBUG] Error processing projects data: {str(e)}")
            
            # Update languages section
            if "languages" in additional_inputs:
                try:
                    language_items = json.loads(additional_inputs["languages"])
                    if "languages" not in sections:
                        sections["languages"] = {"section_title": "Languages", "items": []}
                    
                    # Transform language items to match the expected format
                    formatted_language_items = []
                    for item in language_items:
                        formatted_item = {
                            "language": item.get("language", ""),
                            "proficiency": item.get("proficiency", "Intermediate")
                        }
                        formatted_language_items.append(formatted_item)
                    
                    sections["languages"]["items"] = formatted_language_items
                except Exception as e:
                    print(f"[DEBUG] Error processing languages data: {str(e)}")
            
            # Raw text fallback (if present)
            if "raw_text" in additional_inputs:
                print("[DEBUG] Using raw text input as fallback")
                extracted_text = {"raw_text": additional_inputs["raw_text"]}
        
        # Generate the LaTeX from the updated CV structure
        try:
            latex_result = convert_to_latex_service(extracted_text)               
        except Exception as latex_error:
            print(f"[DEBUG] Error in LaTeX conversion: {str(latex_error)}")
            import traceback
            print(f"[DEBUG] Stack trace: {traceback.format_exc()}")
            
            # Fallback to basic LaTeX template if conversion fails
            latex_content = get_latex_template()
            latex_result = {"latex": latex_content}
        
        # Generate a unique filename for the LaTeX file
        tex_filename = f"Dang_Ngoc_Nam_{cv_id}_{uuid.uuid4()}.tex"
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
        
        # Update the CV record in the database
        cv.file_url = cloudinary_result["url"]
        cv.cv_structure = extracted_text  # Update with the new structure
        await db.commit()
        
        # Return full URL to PDF file
        return {
            "message": "CV updated successfully",
            "pdf_url": cloudinary_result["url"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating CV: {str(e)}")
        import traceback
        print(f"[DEBUG] Stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error updating CV: {str(e)}")
@router.post("/analyze-cv-with-job-description")
async def analyze_cv_with_job_description(
    file: UploadFile = File(...),
    job_description: str = None,
    user: User = Depends(current_active_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service)
):
    """
    Analyze a CV for weaknesses and compare it to a job description if provided.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Check usage limits based on analysis type
    analysis_type = "job_description_analysis" if job_description else "cv_analysis"
    can_proceed = await subscription_service.check_usage_limits(user.id, analysis_type)
    if not can_proceed:
        usage_stats = await subscription_service.get_usage_stats(user.id)
        raise HTTPException(
            status_code=429, 
            detail={
                "message": "Usage limit exceeded. Please upgrade your subscription.",
                "usage_stats": usage_stats,
                "upgrade_required": True
            }
        )
    
    try:
        pdf_content = await file.read()
        extracted_cv_data = await gemini_service.extract_pdf_text(pdf_content=pdf_content)
        if isinstance(extracted_cv_data, dict) and "error" in extracted_cv_data:
            raise Exception(extracted_cv_data["error"])
        
        if job_description:            # Compare CV to job description
            job_analysis = await gemini_service.analyze_cv_against_job_description(extracted_cv_data, job_description)
              # Track usage for job description analysis
            await subscription_service.increment_usage(user.id, "job_analysis")
            await subscription_service.save_analysis_result(
                user_id=user.id,
                cv_id=None,  # No CV ID available in uploaded file analysis
                analysis_type=AnalysisType.JOB_DESCRIPTION_ANALYSIS,
                analysis_data={"result": job_analysis, "cv_data": extracted_cv_data},
                job_description=job_description
            )
            
            return {
                "cv_data": extracted_cv_data,
                "job_analysis": job_analysis
                        }
        else:
            # Fallback to normal analysis
            detailed_analysis = await gemini_service.generate_detailed_analysis(extracted_cv_data)
            
            # Track usage for CV analysis
            await subscription_service.increment_usage(user.id, "cv_analysis")
            await subscription_service.save_analysis_result(
                user_id=user.id,
                cv_id=None,  # No CV ID available in uploaded file analysis
                analysis_type=AnalysisType.CV_ANALYSIS,
                analysis_data={"result": detailed_analysis, "cv_data": extracted_cv_data}
            )
            
            return {
                "cv_data": extracted_cv_data,
                "detailed_analysis": detailed_analysis
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing PDF: {str(e)}")
    finally:
        await file.close()

class JobDescriptionRequest(BaseModel):
    flow_id: str
    job_description: str

@router.post("/analyze-stored-cv-with-job-description")
async def analyze_stored_cv_with_job_description(
    request: JobDescriptionRequest,
    user: User = Depends(current_active_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service)
):
    """
    Analyze a previously stored CV against a job description using the flow_id.
    """
    # Check usage limits for job description analysis
    can_proceed = await subscription_service.check_usage_limits(user.id, "job_description_analysis")
    if not can_proceed:
        usage_stats = await subscription_service.get_usage_stats(user.id)
        raise HTTPException(
            status_code=429, 
            detail={
                "message": "Usage limit exceeded. Please upgrade your subscription.",
                "usage_stats": usage_stats,
                "upgrade_required": True
            }
        )
    
    try:
        # Get the stored CV data from the flow
        if request.flow_id not in cv_flows:
            raise HTTPException(status_code=404, detail="CV flow not found. Please upload your CV again.")
        
        flow_data = cv_flows[request.flow_id]
        extracted_cv_data = flow_data.get("extracted_text")
        
        if not extracted_cv_data:
            raise HTTPException(status_code=404, detail="CV data not found in flow. Please upload your CV again.")
        
        # Ensure we have proper CV structure
        if isinstance(extracted_cv_data, dict) and "cv_template" not in extracted_cv_data:
            extracted_cv_data = gemini_service.ensure_cv_structure(extracted_cv_data)
        
        # Analyze CV against job description
        job_analysis = await gemini_service.analyze_cv_against_job_description(
            extracted_cv_data, 
            request.job_description
        )        # Track usage for job description analysis
        await subscription_service.increment_usage(user.id, "job_analysis")
          # Extract and structure analysis data for saving
        analysis_data = {}
        if isinstance(job_analysis, dict):
            if "experience_analysis" in job_analysis:
                analysis_data["experience_analysis"] = job_analysis["experience_analysis"]
            # Map skill analysis data from direct keys (not nested under skill_analysis)
            if "matches" in job_analysis:
                analysis_data["skill_matches"] = job_analysis.get("matches", [])
            if "missing" in job_analysis:
                analysis_data["missing_skills"] = {"missing": job_analysis.get("missing", [])}
            if "weaknesses" in job_analysis:
                analysis_data["weaknesses"] = job_analysis["weaknesses"]
            if "recommended_courses" in job_analysis:
                analysis_data["recommended_courses"] = job_analysis["recommended_courses"]
        
        await subscription_service.save_analysis_result(
            user_id=user.id,
            cv_id=None,  # No CV ID available in flow-based analysis
            analysis_type=AnalysisType.JOB_DESCRIPTION_ANALYSIS,
            analysis_data=analysis_data,
            job_description=request.job_description
        )
        
        return {
            "cv_data": extracted_cv_data,
            "job_analysis": job_analysis,
            "flow_id": request.flow_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing CV against job description: {str(e)}")
