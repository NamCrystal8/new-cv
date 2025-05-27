import json
from io import BytesIO
import os
import PyPDF2
from google import genai
import dotenv
import re
from utils.latex_prompt import latex_prompt
from utils.response_cleaner import response_cleaner
from utils.cv_structure import CV_STRUCTURE

dotenv.load_dotenv()

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_GEMINI_API_KEY not found in environment variables")
        self.client = genai.Client(api_key=api_key)
        self.model_name = "gemini-2.0-flash"

    async def extract_pdf_text(self, pdf_content: bytes) -> dict:
        try:
            pdf_file = BytesIO(pdf_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            extracted_text = ""
            for page in pdf_reader.pages:
                extracted_text += page.extract_text() or ""

            if not extracted_text.strip():
                return {"error": "No text could be extracted from the PDF."}
            prompt = latex_prompt(extracted_text)

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )

            latex_content = response_cleaner(response.text)

            print("Cleaned response from Gemini API:", latex_content)

            try:
                json_result = json.loads(latex_content)
                # Ensure the result conforms to CV_STRUCTURE
                standardized_result = self.ensure_cv_structure(json_result)
                return standardized_result
            except json.JSONDecodeError as json_err:
                return {"error": f"Failed to parse API response as JSON: {str(json_err)}", "raw_response": latex_content}

        except Exception as e:
            return {"error": f"Error processing PDF: {str(e)}"}
    
    def ensure_cv_structure(self, data: dict) -> dict:
        """
        Ensures that the CV data conforms to the expected CV_STRUCTURE format.
        If data is missing or malformed, it is fixed to match the required structure.
        """
        try:
            # If the data already has cv_template, use it as a base
            if "cv_template" in data:
                cv_template = data["cv_template"]
            else:
                # Otherwise, create a new cv_template structure
                cv_template = {"metadata": {}, "sections": {}}
            
            # Load the expected structure
            expected_structure = json.loads(CV_STRUCTURE)["cv_template"]
            
            # Ensure metadata exists with section_order
            if "metadata" not in cv_template or not isinstance(cv_template["metadata"], dict):
                cv_template["metadata"] = expected_structure["metadata"]
            elif "section_order" not in cv_template["metadata"]:
                cv_template["metadata"]["section_order"] = expected_structure["metadata"]["section_order"]
            
            # Ensure sections exists
            if "sections" not in cv_template or not isinstance(cv_template["sections"], dict):
                cv_template["sections"] = expected_structure["sections"]
            
            # Ensure all required sections exist
            for section_key in expected_structure["sections"]:
                if (section_key not in cv_template["sections"]):
                    cv_template["sections"][section_key] = expected_structure["sections"][section_key]
            
            # Set rendering rules if missing
            if "rendering_rules" not in cv_template:
                cv_template["rendering_rules"] = expected_structure["rendering_rules"]
                
            # Return the standardized structure
            return {"cv_template": cv_template}
            
        except Exception as e:
            print(f"Error ensuring CV structure: {e}")
            # Return the original data if we can't standardize it
            return data
            
    async def analyze_cv_weaknesses(self, cv_data: dict) -> dict:
        """
        Analyze CV for weaknesses and areas of improvement
        """
        try:
            prompt = f"""
            Analyze this CV data for weaknesses, missing information, and areas for improvement.
            Focus on identifying:
            1. Missing critical information (education details, experience descriptions, etc.)
            2. Weak sections that need strengthening
            3. Formatting or structural issues
            4. Suggestions for improvement
            5. Only giving the information that is neccesary, if the section is good enough don't try to improve it
            
            CV Data:
            {json.dumps(cv_data, indent=2)}
            
            Provide your analysis as a JSON object with these fields:
            1. weaknesses: [List of specific weaknesses found]
            2. missing_information: [List of critical information missing]
            3. improvement_suggestions: [List of specific suggestions]
            4. required_inputs: [List of specific information to request from the user]
            """

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            
            response_text = response.text
            # Extract JSON from response if needed
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
            
            try:
                analysis_result = json.loads(response_text)
                return analysis_result
            except json.JSONDecodeError:
                return {
                    "weaknesses": ["Unable to analyze CV properly"],
                    "missing_information": ["Could not determine missing information"],
                    "improvement_suggestions": ["Review the CV manually"],
                    "required_inputs": []
                }
                
        except Exception as e:
            return {"error": f"Error analyzing CV: {str(e)}"}
            
    async def generate_detailed_analysis(self, cv_data: dict) -> dict:
        """
        Generate detailed weakness analysis and recommendations for the CV
        """
        try:
            prompt = f"""
            You are a professional CV reviewer with expertise in helping job seekers improve their resumes.
            Analyze this CV in detail and provide:
            
            1. A list of weaknesses with severity ratings (low, medium, high)
            2. Specific recommendations for improvements
            
            CV Data:
            {json.dumps(cv_data, indent=2)}
            
            Provide your analysis in the following JSON format:
            
            {{
              "weaknesses": [
                {{
                  "category": "Clear category name (e.g., 'Contact Information', 'Work Experience')",
                  "description": "Detailed explanation of the weakness",
                  "severity": "low|medium|high"
                }}
              ],
              "recommendations": [
                {{
                  "id": "unique_id",
                  "section": "Section name (e.g., 'Header', 'Experience', 'Education', 'Skills', 'Projects')",
                  "field": "Specific field (e.g., 'name', 'email', 'experience.0.company', 'skills.0.1')",
                  "current": "Current content or 'empty' if missing",
                  "suggested": "Suggested improvement text",
                  "reason": "Brief explanation of why this change would help"
                }}
              ]
            }}
            
            Focus on actionable improvements and professional best practices.
            For each weakness, provide at least one corresponding recommendation.
            
            Guidelines for recommendations:
            1. For Header/Contact Info: Use section="Header" and field should be the exact field name (name, email, phone, location)
            2. For Education/Experience/Projects: Use field format like "education.0.institution" where the number is the item index
            3. For Skills: Use field format like "skills.0.2" where first number is category index and second is skill index
            4. For new items: Use field="new_item" and suggested value should be a valid JSON object for that section
            5. Make recommendations SPECIFIC and ACTIONABLE with clear improvements
            6. The current and suggested field should have same type (string, list, dict)
            7. ensure that the type of data is followed this structure:
            
            {CV_STRUCTURE}
            
            Ensure each recommendation can be directly applied to the CV.
            """

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            
            response_text = response.text
            
            # Extract JSON from response if needed
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
                
            try:
                detailed_analysis = json.loads(response_text)
                if not isinstance(detailed_analysis, dict):
                    raise ValueError("Response is not a dictionary")
                    
                # Ensure required keys exist
                if "weaknesses" not in detailed_analysis:
                    detailed_analysis["weaknesses"] = []
                if "recommendations" not in detailed_analysis:
                    detailed_analysis["recommendations"] = []
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               # Ensure all recommendations have IDs and are properly categorized
                for i, rec in enumerate(detailed_analysis["recommendations"]):
                    # Set ID if missing
                    if "id" not in rec or not rec["id"]:
                        rec["id"] = f"rec_{i}"
                    
                    # Ensure section is standardized (convert any variant to standard names)
                    section_map = {
                        "contact": "Header",
                        "contact information": "Header",
                        "personal information": "Header",
                        "header": "Header",
                        "education": "Education",
                        "educational background": "Education",
                        "academic": "Education",
                        "experience": "Experience",
                        "work experience": "Experience",
                        "professional experience": "Experience",
                        "employment": "Experience",
                        "skills": "Skills",
                        "skill": "Skills",
                        "technical skills": "Skills",
                        "projects": "Projects",
                        "project": "Projects"
                    }
                    
                    if "section" in rec:
                        section_lower = rec["section"].lower()
                        for key, value in section_map.items():
                            if key in section_lower:
                                rec["section"] = value
                                break
                    else:
                        rec["section"] = "General"
                    
                    # Normalize fields to strings - this ensures consistency in the UI
                    if "field" not in rec or not rec["field"]:
                        rec["field"] = "general"
                    else:
                        rec["field"] = str(rec["field"])
                        
                    if "current" not in rec:
                        rec["current"] = "empty"
                    else:
                        # Convert current content to string representation
                        current_value = rec["current"]
                        if isinstance(current_value, dict) or isinstance(current_value, list):
                            rec["current"] = json.dumps(current_value, indent=2)
                        elif current_value is None:
                            rec["current"] = "empty"
                        else:
                            rec["current"] = str(current_value)
                            
                    if "suggested" not in rec:
                        rec["suggested"] = ""
                    else:
                        # Convert suggested content to string representation  
                        suggested_value = rec["suggested"]
                        if isinstance(suggested_value, dict) or isinstance(suggested_value, list):
                            rec["suggested"] = json.dumps(suggested_value, indent=2)
                        elif suggested_value is None:
                            rec["suggested"] = ""
                        else:
                            rec["suggested"] = str(suggested_value)
                            
                    if "reason" not in rec:
                        rec["reason"] = "Improves your CV's professional appearance"
                    else:
                        rec["reason"] = str(rec["reason"])
                        
                return detailed_analysis
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                # Provide fallback values if analysis fails
                return {
                    "weaknesses": [
                        {
                            "category": "General",
                            "description": "Unable to analyze CV properly. Please review manually.",
                            "severity": "medium"
                        }
                    ],
                    "recommendations": []
                }
                
        except Exception as e:
            print(f"Error generating detailed analysis: {str(e)}")
            import traceback
            print(f"[DEBUG] Analysis error stack trace: {traceback.format_exc()}")
            return {
                "error": f"Error analyzing CV: {str(e)}",
                "weaknesses": [],
                "recommendations": []
            }
            
    async def enhance_cv_with_input(self, cv_data: dict, additional_input: dict) -> dict:
        """
        Enhance CV with additional user input based on the weakness analysis
        """
        try:
            prompt = f"""
            Enhance and improve this CV data using the additional information provided by the user.
            
            Original CV Data:
            {json.dumps(cv_data, indent=2)}
            
            Additional User Input:
            {json.dumps(additional_input, indent=2)}
            
            Create an improved CV structure following the Harvard style format.
            Return your response as a valid JSON object matching this structure:
            {CV_STRUCTURE}
            
            Focus on:
            1. Incorporating the new information from the user
            2. Strengthening weak areas identified previously
            3. Ensuring all sections follow the Harvard CV format
            4. Using action verbs and quantifiable achievements
            """

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            
            enhanced_cv = response_cleaner(response.text)
            
            try:
                json_result = json.loads(enhanced_cv)
                # Ensure the enhanced result conforms to CV_STRUCTURE
                standardized_result = self.ensure_cv_structure(json_result)
                return standardized_result
            except json.JSONDecodeError as json_err:
                # If JSON parsing fails, use the original CV data after ensuring it has proper structure
                standardized_original = self.ensure_cv_structure(cv_data)
                return standardized_original
                
        except Exception as e:
            print(f"Error enhancing CV: {str(e)}")
            # In case of any error, return the original CV data with proper structure
            return self.ensure_cv_structure(cv_data)    
        
    async def analyze_cv_against_job_description(self, cv_data: dict, job_description: str) -> dict:
        """
        Analyze a CV against a job description to identify gaps, strengths, and learning recommendations.
        This is the main method used by the frontend for job description analysis.
        """
        try:
            prompt = f"""
            You are an expert career counselor and technical recruiter. Analyze the following CV against the provided job description.
            
            Provide a comprehensive analysis that helps the candidate understand:
            1. What requirements they're missing or weak in
            2. Specific areas where their CV doesn't align with the job requirements
            3. Targeted learning recommendations with specific courses
            
            CV Data:
            {json.dumps(cv_data, indent=2)}
            
            Job Description:
            {job_description}
            
            Focus your analysis on:
            - Technical skills gaps (programming languages, frameworks, tools)
            - Experience gaps (years of experience, specific roles, responsibilities)
            - Educational requirements (degrees, certifications)
            - Soft skills and competencies
            - Industry-specific knowledge
            
            For course recommendations, prioritize:
            - Free courses where possible (Coursera free courses, edX, YouTube, documentation)
            - Industry-recognized certifications
            - Hands-on project-based learning
            - Platform-specific training (AWS, Google Cloud, Microsoft Learn)
            
            Provide your response as a JSON object with this structure:
            {{
              "missing_requirements": [
                "Clear, specific requirement that's missing or weak in the CV"
              ],
              "weaknesses": [
                {{
                  "category": "Skills|Experience|Education|Certification",
                  "description": "Detailed explanation of what's lacking and why it matters for this role"
                }}
              ],
              "recommended_courses": [
                {{
                  "title": "Specific Course Title",
                  "platform": "Platform Name (Coursera, Udemy, edX, LinkedIn Learning, YouTube, etc.)",
                  "url": "Direct course URL or 'Search for: course keywords'",
                  "reason": "Specific reason why this course addresses a gap for this job",
                  "skill_addressed": "Which missing skill/requirement this course addresses",
                  "estimated_time": "Time commitment (e.g., '4-6 weeks', '20 hours')",
                  "level": "Beginner|Intermediate|Advanced",
                  "is_free": true/false
                }}
              ]
            }}
            
            Make recommendations specific and actionable. Include both free and paid options when possible.
            """

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )

            response_text = response.text
            print(f"[DEBUG] Job Description Analysis Response: {response_text}")
            
            # Extract JSON from response
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
                
            try:
                result = json.loads(response_text)
                
                # Ensure all required keys exist
                if "missing_requirements" not in result:
                    result["missing_requirements"] = []
                if "weaknesses" not in result:
                    result["weaknesses"] = []
                if "recommended_courses" not in result:
                    result["recommended_courses"] = []
                    
                # Validate and enhance course recommendations
                for course in result["recommended_courses"]:
                    if "title" not in course:
                        course["title"] = "Course recommendation"
                    if "platform" not in course:
                        course["platform"] = "Online platform"
                    if "url" not in course:
                        course["url"] = f"Search for: {course['title']}"
                    if "reason" not in course:
                        course["reason"] = "Addresses skill gap identified in analysis"
                    if "skill_addressed" not in course:
                        course["skill_addressed"] = "General skill improvement"
                    if "estimated_time" not in course:
                        course["estimated_time"] = "Variable"
                    if "level" not in course:
                        course["level"] = "Intermediate"
                    if "is_free" not in course:
                        course["is_free"] = False
                        
                return result
                
            except json.JSONDecodeError as e:
                print(f"JSON decode error in job description analysis: {e}")
                return {
                    "missing_requirements": ["Unable to parse analysis results"],
                    "weaknesses": [{
                        "category": "Analysis Error",
                        "description": "Could not properly analyze CV against job description"
                    }],
                    "recommended_courses": []
                }
                
        except Exception as e:
            print(f"Error in analyze_cv_against_job_description: {str(e)}")
            return {
                "error": f"Error analyzing CV against job description: {str(e)}",
                "missing_requirements": [],
                "weaknesses": [],
                "recommended_courses": []
            }

    async def compare_cv_to_jd_full(self, cv_data: dict, job_description: str) -> dict:
        """
        Compare the CV to a job description and return matches, missing, not_needed, and recommended courses.
        This is an alternative analysis method that provides a different perspective.
        """
        try:
            prompt = f"""
            You are a professional career advisor and CV reviewer. Compare the following CV data to the provided job description. Identify:
            1. What the CV already has for the job description (matches)
            2. What is missing (required by the job description, not in the CV)
            3. What is not needed (in the CV, but not required by the job description)
            4. For each missing/weak area, recommend specific online courses or learning resources (with platform names, e.g., Coursera, Udemy, edX, LinkedIn Learning) to help the candidate improve in the missing/weak areas.

            CV Data:
            {json.dumps(cv_data, indent=2)}

            Job Description:
            {job_description}

            Provide your response as a JSON object with the following structure:
            {{
              "matches": [
                {{"category": "Skill/Experience/Qualification", "description": "How the CV matches the job requirement"}}
              ],
              "missing": [
                {{"category": "Skill/Experience/Qualification", "description": "What is missing or weak"}}
              ],
              "not_needed": [
                {{"category": "Skill/Experience/Qualification", "description": "What is in the CV but not needed for the job"}}
              ],
              "recommended_courses": [
                {{"title": "Course Title", "platform": "Platform Name", "url": "Course URL", "reason": "Why this course is recommended"}}
              ]
            }}
            """

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )

            response_text = response.text
            print(response_text)
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
            try:
                result = json.loads(response_text)
                if "matches" not in result:
                    result["matches"] = []
                if "missing" not in result:
                    result["missing"] = []
                if "not_needed" not in result:
                    result["not_needed"] = []
                if "recommended_courses" not in result:
                    result["recommended_courses"] = []
                return result
            except json.JSONDecodeError:
                return {
                    "matches": [],
                    "missing": [],
                    "not_needed": [],
                    "recommended_courses": []
                }
        except Exception as e:
            return {
                "error": f"Error comparing CV to JD: {str(e)}",
                "matches": [],
                "missing": [],
                "not_needed": [],
                "recommended_courses": []
            }

gemini_service = GeminiService()
