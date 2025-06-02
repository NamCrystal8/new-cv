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
from utils.pdf_field_mapping import filter_recommendations_for_pdf, is_field_used_in_pdf

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
            if "cv_template" in data:
                cv_template = data["cv_template"]
            else:
                cv_template = {"metadata": {}, "sections": {}}
            
            expected_structure = json.loads(CV_STRUCTURE)["cv_template"]
            
            if "metadata" not in cv_template or not isinstance(cv_template["metadata"], dict):
                cv_template["metadata"] = expected_structure["metadata"]
            elif "section_order" not in cv_template["metadata"]:
                cv_template["metadata"]["section_order"] = expected_structure["metadata"]["section_order"]
            
            if "sections" not in cv_template or not isinstance(cv_template["sections"], dict):
                cv_template["sections"] = expected_structure["sections"]
            
            for section_key in expected_structure["sections"]:
                if (section_key not in cv_template["sections"]):
                    cv_template["sections"][section_key] = expected_structure["sections"][section_key]
            
            if "rendering_rules" not in cv_template:
                cv_template["rendering_rules"] = expected_structure["rendering_rules"]
                
            return {"cv_template": cv_template}
            
        except Exception as e:
            print(f"Error ensuring CV structure: {e}")
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
        Following specific order: Contact Info → Experience → Education → Projects → Skills → Languages
        """
        try:            
            prompt = f"""
            You are a professional CV reviewer with expertise in helping job seekers improve their resumes.
            You must be THOROUGH and identify ALL areas for improvement, even small ones.
            
            Analyze this CV in detail and provide recommendations in this SPECIFIC ORDER:
            
            1. FIRST: Check contact information (Header section) - name, email, phone, location
            2. SECOND: Check work experience - content, achievements, descriptions, formatting
            3. THIRD: Check education background - degrees, institutions, details
            4. FOURTH: Check projects - descriptions, technologies, impact
            5. FIFTH: Check skills - categorization, relevance, completeness
            6. SIXTH: Check languages - proficiency levels, missing languages
            
            CRITICAL ANALYSIS REQUIREMENTS:
            - Be thorough and identify weaknesses even in existing content
            - Look for vague descriptions that need more specifics
            - Check for missing quantifiable achievements
            - Identify weak action verbs that could be stronger
            - Find sections that exist but need improvement
            - Look for formatting inconsistencies
            - Identify missing important information in each section
            
            DO NOT just check if sections exist - analyze the QUALITY of existing content.
              CV Data:
            {json.dumps(cv_data, indent=2)}
            
            SPECIFIC ANALYSIS AREAS TO CHECK:
            
            HEADER/CONTACT INFORMATION:
            - Missing or incomplete name, email, phone, location
            - Unprofessional email addresses
            
            EXPERIENCE SECTION:
            - Vague job descriptions without specific achievements
            - Missing quantifiable results (numbers, percentages, metrics)
            - Weak action verbs (replace "responsible for" with stronger verbs)
            - Missing company context or size
            - Unclear job progression or career growth
            - Missing technical skills used in roles
            
            EDUCATION SECTION:
            - Missing graduation dates or GPA (if strong)
            - Lack of relevant coursework for target role
            - Missing honors, awards, or distinctions
            - No mention of thesis, projects, or research
            
            PROJECTS SECTION:
            - Generic project descriptions without impact
            - Missing technical stack details
            - No mention of project outcomes or results
            - Lack of personal contribution clarification
            - Missing links to demos or repositories
            
            SKILLS SECTION:
            - Skills not categorized properly (technical vs soft skills)
            - Missing proficiency levels
            - Outdated or irrelevant skills
            - Too few skills for the target role
            - Skills not aligned with job requirements
            
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
                  "section": "Section name (Header, Experience, Education, Projects, Skills, Languages)",
                  "field": "Specific field (e.g., 'name', 'email', 'experience.0.company', 'skills.0.1')",
                  "current": "Current content or 'empty' if missing",
                  "suggested": "Suggested improvement text",
                  "reason": "Brief explanation of why this change would help"
                }}
              ]
            }}
            
            ORDERING REQUIREMENTS:
            1. FIRST priority: Contact information (Header section) - check for missing name, email, phone, location
            2. SECOND priority: Experience section - if completely missing, create recommendation to add it
            3. THIRD priority: Education section
            4. FOURTH priority: Projects section  
            5. FIFTH priority: Skills section
            6. SIXTH priority: Languages section
            
            Focus on actionable improvements and professional best practices.
            For each weakness, provide at least one corresponding recommendation.            Guidelines for recommendations:
            1. For Header/Contact Info: Use section="Header" and field should be the exact field name (name, email, phone, location)
            2. For Education/Experience/Projects: Use field format like "education.0.institution" or "education.0.coursework" for specific fields within items
            3. For Skills: Use field format like "skills.0.2" where first number is category index and second is skill index
            4. For missing sections: Use field="new_section" and suggested value should indicate what needs to be added
            5. Make recommendations SPECIFIC and ACTIONABLE targeting individual fields, not entire objects
            6. ALWAYS target specific fields like "education.0.gpa" or "experience.0.achievements" rather than "education.0" or "experience.0"
            7. The current and suggested field should have same type (string, list, or individual values)
            8. Ensure that the type of data is followed this structure:
            
            {CV_STRUCTURE}
              CRITICAL REQUIREMENT: You MUST find and suggest improvements. Even if the CV looks decent, 
            identify areas for enhancement such as:
            - Making descriptions more specific and impactful
            - Adding missing metrics and quantifiable achievements
            - Improving weak language and action verbs
            - Enhancing technical detail and context
            - Strengthening professional presentation
              IMPORTANT FIELD-LEVEL TARGETING RULES:
            - For education items: Target specific fields like "education.0.coursework", "education.0.gpa", "education.0.honors" (NOT "education.0.url" or "education.0.thesis")
            - For experience items: Target specific fields like "experience.0.achievements", "experience.0.technologies" (NOT "experience.0.url")
            - For projects: Target specific fields like "projects.0.description", "projects.0.technologies", "projects.0.key_contributions" (NOT "projects.0.url")
            - For skills: Target specific skills like "skills.technical.2" or add new categories
            - NEVER target entire objects like "education.0" or "experience.0" - always be specific to individual fields
            - ONLY recommend improvements for fields that appear in the final PDF output
            
            CRITICAL PDF VISIBILITY RULES - Only target these field types:
            Header: name, title, contact_info.email.value, contact_info.phone.value, contact_info.location.value
            Education: institution, location, degree, graduation_date, gpa, coursework, honors
            Experience: company, location, title, dates, achievements, technologies  
            Projects: title, description, start_date, end_date, key_contributions, technologies
            Skills: categories.name, categories.items, interests
            Languages: items.name, items.proficiency
            Leadership: organization, location, role, dates, descriptions
            Certifications: title, institution, date
            
            DO NOT target fields like urls, thesis, or other metadata that don't appear in the PDF.
            
            Generate AT LEAST 3-5 recommendations per major section (Header, Experience, Education, etc.)
            if that section exists. Do not just say "looks good" - always find ways to improve.
            
            IMPORTANT: Order the recommendations array by priority - Header items first, then Experience, then Education, etc.
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
                        "project": "Projects",
                        "languages": "Languages",
                        "language": "Languages"
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
                  # Order recommendations by priority: Header → Experience → Education → Projects → Skills → Languages
                section_priority = {
                    "Header": 1,
                    "Experience": 2,
                    "Education": 3,
                    "Projects": 4,
                    "Skills": 5,
                    "Languages": 6,
                    "General": 7
                }
                
                detailed_analysis["recommendations"] = sorted(
                    detailed_analysis["recommendations"],
                    key=lambda x: (section_priority.get(x.get("section", "General"), 7), x.get("id", "")))           
                
                # Filter recommendations to only include fields that appear in PDF output
                print(f"[PDF_FILTER] Original recommendations count: {len(detailed_analysis['recommendations'])}")
                detailed_analysis["recommendations"] = filter_recommendations_for_pdf(detailed_analysis["recommendations"])
                print(f"[PDF_FILTER] Filtered recommendations count: {len(detailed_analysis['recommendations'])}")
                
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
            # First get the detailed comparison
            comparison_result = await self.compare_cv_to_jd_full(cv_data, job_description)
            
            # Get experience analysis
            experience_analysis = await self.analyze_experience_requirements(cv_data, job_description)
            
            # Then get the original analysis for missing requirements and courses
            prompt = f"""
            You are an expert career counselor and technical recruiter. Analyze the following CV against the provided job description.
              IMPORTANT: Based on the comparison analysis, the candidate already has these matching skills: {comparison_result.get('matches', [])}
            Do NOT recommend courses for skills they already possess OR skills covered by their existing cross-platform frameworks.
            
            CRITICAL: If candidate has Flutter or React Native, they can develop for iOS and Android PLATFORMS - do NOT recommend iOS/Android platform courses.
            However, Swift and Kotlin are native programming languages that are different from Flutter and may still be needed.
            
            Focus ONLY on missing skills: {comparison_result.get('missing', [])}
            And consider these skills not needed for this job: {comparison_result.get('not_needed', [])}
            
            CRITICAL: When listing missing_requirements, use EXACTLY the same short format as the missing skills above.
            For example: use "iOS", "Android", "Swift" - NOT "iOS development skills" or "Android development experience"
            
            Provide a comprehensive analysis that helps the candidate understand:
            1. What TECHNICAL requirements they're missing or weak in (focus on the missing technical skills identified)
            2. Specific TECHNICAL areas where their CV doesn't align with the job requirements
            3. Targeted learning recommendations ONLY for missing TECHNICAL skills and tools
            
            Note: Focus primarily on learnable technical skills. Avoid recommending courses for soft skills, years of experience, or general business competencies.
            
            CV Data:
            {json.dumps(cv_data, indent=2)}
            
            Job Description:
            {job_description}
              Focus your analysis on:
            - Technical skills gaps (programming languages, frameworks, tools) - ONLY missing ones
            - Educational requirements (degrees, certifications) - if they are technical
            - Platform-specific knowledge - ONLY missing technical platforms/tools
            
            DO NOT analyze or recommend courses for:
            - Years of experience requirements
            - Soft skills (communication, teamwork, documentation)
            - General business methodologies (Agile, Scrum) unless they are technical implementations
            - Professional competencies that cannot be learned through online courses            For course recommendations, ONLY focus on TECHNICAL skills and tools:
            - Programming languages (Swift, Kotlin, Java, etc.)
            - Frameworks and libraries (iOS, SwiftUI, React Native, etc.)
            - Development tools (Xcode, Android Studio, Git, etc.)
            - Technical methodologies with practical application (Unit Testing, CI/CD)
            - Platform-specific training (AWS, Google Cloud, Firebase)
            
            DO NOT recommend courses for:
            - Soft skills (communication, teamwork, leadership)
            - General business skills (project management, documentation)
            - Experience-based requirements (years of experience)
            - Non-technical competencies
            
            IMPORTANT: Recommend ONLY ONE course per missing skill. Do not provide multiple courses for the same skill.
            For each missing technical skill, provide the BEST single course recommendation.
            Prioritize free courses where possible (YouTube, documentation, official tutorials).
            
            Provide your response as a JSON object with this structure:
            {{
              "missing_requirements": [
                "ONLY short technical terms (e.g., 'iOS', 'Android', 'Swift', 'Unit Testing', 'Firebase')"
              ],
              "weaknesses": [
                {{
                  "category": "Skills|Education|Certification",
                  "description": "Detailed explanation of TECHNICAL weakness and why it matters for this role"
                }}
              ],
              "recommended_courses": [
                {{
                  "title": "Specific Course Title",
                  "platform": "Platform Name (Coursera, Udemy, edX, LinkedIn Learning, YouTube, etc.)",
                  "url": "Direct course URL or 'Search for: course keywords'",
                  "reason": "Specific reason why this course addresses a TECHNICAL gap for this job",
                  "skill_addressed": "Which missing TECHNICAL skill/tool this course addresses",
                  "estimated_time": "Time commitment (e.g., '4-6 weeks', '20 hours')",
                  "level": "Beginner|Intermediate|Advanced",
                  "is_free": true/false
                }}
              ]
            }}
              CRITICAL FORMATTING RULES:
            - missing_requirements must contain ONLY short technical terms: "iOS", "Android", "Swift", "Unit Testing"
            - Do NOT use long descriptions like "iOS development skills" or "Android development experience"
            - Use the EXACT same format as the comparison results: {comparison_result.get('missing', [])}            - Only include technical skills that can be learned through online courses
            - Do not include experience requirements, soft skills, or business methodologies
            - Recommend EXACTLY ONE course per missing skill - no duplicates or multiple options for the same skill
            - Each course should address a different missing technical skill            
            - CRITICAL: If candidate has Flutter, do NOT recommend iOS or Android PLATFORM courses as Flutter covers both platforms
            - CRITICAL: If candidate has React Native, do NOT recommend iOS or Android PLATFORM courses as React Native covers both platforms
            - NOTE: Swift and Kotlin are native programming languages - they are different from Flutter and may still be needed for native development
            
            Make recommendations specific and actionable. Choose the BEST single course option for each skill.
            REMEMBER: Do not recommend courses for skills the candidate already has: {comparison_result.get('matches', [])}
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
                  # Add comparison data from the full comparison
                result["matches"] = comparison_result.get("matches", [])
                result["missing"] = comparison_result.get("missing", [])
                result["not_needed"] = comparison_result.get("not_needed", [])
                  # Post-processing: Remove iOS/Android platform courses if Flutter or React Native is present
                # But keep Swift/Kotlin as they are different native languages
                cv_skills_text = json.dumps(cv_data).lower()
                has_flutter = "flutter" in cv_skills_text or "dart" in cv_skills_text
                has_react_native = "react native" in cv_skills_text or "react-native" in cv_skills_text
                
                if has_flutter or has_react_native:
                    # Filter out ONLY iOS/Android platform courses, keep Swift/Kotlin as they are native languages
                    result["recommended_courses"] = [
                        course for course in result["recommended_courses"]
                        if course.get("skill_addressed", "").lower() not in ["ios", "android"]
                    ]
                    
                    # Remove ONLY iOS/Android platforms from missing requirements, keep Swift/Kotlin
                    result["missing_requirements"] = [
                        req for req in result["missing_requirements"]
                        if req.lower() not in ["ios", "android"]
                    ]
                    
                    # Remove ONLY iOS/Android platforms from missing list, keep Swift/Kotlin
                    result["missing"] = [
                        skill for skill in result["missing"]
                        if skill.lower() not in ["ios", "android"]
                    ]
                    
                    print(f"[DEBUG] Filtered out iOS/Android platform recommendations due to cross-platform framework presence (kept Swift/Kotlin as native languages)")
                  # Calculate overall grade
                result["overall_grade"] = self.calculate_cv_grade(
                    matches=result["matches"],
                    missing=result["missing"],
                    missing_requirements=result["missing_requirements"],
                    weaknesses=result["weaknesses"]
                )
                
                # Add experience analysis to the result
                result["experience_analysis"] = experience_analysis
                        
                return result
            except json.JSONDecodeError as e:
                print(f"JSON decode error in job description analysis: {e}")
                return {
                    "missing_requirements": ["Unable to parse analysis results"],
                    "weaknesses": [{
                        "category": "Analysis Error",
                        "description": "Could not properly analyze CV against job description"
                    }],
                    "recommended_courses": [],
                    "matches": comparison_result.get("matches", []),
                    "missing": comparison_result.get("missing", []),
                    "not_needed": comparison_result.get("not_needed", []),
                    "experience_analysis": experience_analysis,
                    "overall_grade": {
                        "level": "NOT_RECOMMEND",
                        "score": 20,
                        "feedback": "Unable to properly analyze CV. Please try again.",
                        "color": "#dc2626"
                    }
                }
                
        except Exception as e:
            print(f"Error in analyze_cv_against_job_description: {str(e)}")
            return {
                "error": f"Error analyzing CV against job description: {str(e)}",
                "missing_requirements": [],
                "weaknesses": [],
                "recommended_courses": [],
                "matches": [],
                "missing": [],
                "not_needed": [],
                "overall_grade": {
                    "level": "NOT_RECOMMEND",
                    "score": 0,
                    "feedback": "Analysis failed. Please try again.",
                    "color": "#dc2626"                }
            }

    def calculate_cv_grade(self, matches: list, missing: list, missing_requirements: list, weaknesses: list) -> dict:
        """
        Calculate overall CV grade based on matches, missing items, and weaknesses.
        Note: 'not_needed' skills are extra skills and should not negatively impact the grade.
        """        # Base scoring
        match_count = len(matches)
        missing_count = len(missing) + len(missing_requirements)
        weakness_count = len(weaknesses)
        
        # Calculate match rate for display (matches / (matches + missing))
        total_required_skills = match_count + missing_count
        if total_required_skills > 0:
            match_rate = (match_count / total_required_skills) * 100
        else:
            match_rate = 100  # If no skills are required, perfect match
        
        # Calculate overall score (0-100) - more fair scoring system
        if total_required_skills == 0:
            final_score = 100  # Perfect if no requirements
        else:
            # The score should primarily reflect the match rate
            # Only apply minimal penalty for severe weaknesses
            weakness_penalty = min(weakness_count * 2, 10)  # Max 10 points deducted for weaknesses
            
            # Final score should be very close to match rate
            final_score = max(0, min(100, match_rate - weakness_penalty))
          # Determine grade level and feedback based on match rate
        if match_rate >= 80:
            level = "PASS"
            color = "#16a34a"  # Green
            feedback = f"Excellent match! {match_rate:.0f}% of required skills found in your CV."
        elif match_rate >= 60:
            level = "NEGOTIABLE"  
            color = "#eab308"  # Yellow
            feedback = f"Good potential ({match_rate:.0f}% match). Address missing requirements to strengthen your application."        
        else:
            level = "NOT_RECOMMEND"
            color = "#dc2626"  # Red
            feedback = f"Significant gaps found ({match_rate:.0f}% match). Consider developing missing skills before applying."
            
        return {
            "level": level,
            "score": int(final_score),            "feedback": feedback,
            "color": color,
            "match_rate": int(match_rate),  # Add match rate for frontend display
            "total_required": total_required_skills,
            "matches_found": match_count,
            "missing_skills": missing_count
        }
        
    async def analyze_experience_requirements(self, cv_data: dict, job_description: str) -> dict:
        """
        Analyze the candidate's years of experience against job requirements.
        Returns experience analysis including gaps, seniority level, and notable requirements.
        """
        try:
            prompt = f"""
            You are an expert HR recruiter specializing in experience evaluation. Analyze the candidate's work experience against the job description requirements.
            
            CV Data:
            {json.dumps(cv_data, indent=2)}
            
            Job Description:
            {job_description}
            
            ANALYSIS REQUIREMENTS:
            1. Calculate total years of professional experience from the CV
            2. Identify minimum years of experience required by the job (if mentioned)
            3. Identify specific experience requirements (e.g., "3+ years with React", "Senior level", "Team lead experience")
            4. Determine seniority level expected (Junior, Mid-level, Senior, Lead, etc.)
            5. Analyze experience gaps or strengths
            6. Note any special experience requirements (management, specific industries, etc.)
            
            EXPERIENCE CALCULATION RULES:
            - Count only professional work experience (exclude internships unless specified)
            - Calculate years from start_date to end_date for each role
            - For current roles, calculate until present date (2025)
            - Round to nearest year for total experience
            
            SENIORITY LEVEL MAPPING:
            - 0-2 years: Junior
            - 2-5 years: Mid-level  
            - 5-8 years: Senior
            - 8+ years: Lead/Principal
            
            Provide your response as a JSON object:
            {{
              "candidate_total_experience": {{
                "years": 0,
                "months": 0,
                "level": "Junior|Mid-level|Senior|Lead"
              }},
              "job_requirements": {{
                "minimum_years": 0,
                "preferred_years": 0,
                "seniority_level": "Junior|Mid-level|Senior|Lead",
                "specific_requirements": [
                  "List specific experience requirements from job description"
                ],
                "special_requirements": [
                  "Management experience", "Industry-specific experience", etc.
                ]
              }},
              "experience_analysis": {{
                "meets_minimum": true/false,
                "experience_gap_years": 0,
                "level_match": "Perfect|Close|Gap|Overqualified",
                "strengths": [
                  "List experience strengths"
                ],
                "gaps": [
                  "List experience gaps or missing requirements"
                ],
                "recommendations": [
                  "Actionable recommendations to address experience gaps"
                ]
              }},
              "notable_requirements": [
                "Key experience highlights from job description that are important"
              ]
            }}
            
            Focus on providing actionable insights about experience alignment and gaps.
            """
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            
            response_text = response.text
            print(f"[DEBUG] Experience Analysis Response: {response_text}")
            
            # Extract JSON from response
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
                
            try:
                result = json.loads(response_text)
                
                # Ensure all required keys exist with defaults
                if "candidate_total_experience" not in result:
                    result["candidate_total_experience"] = {"years": 0, "months": 0, "level": "Junior"}
                if "job_requirements" not in result:
                    result["job_requirements"] = {
                        "minimum_years": 0,
                        "preferred_years": 0, 
                        "seniority_level": "Not specified",
                        "specific_requirements": [],
                        "special_requirements": []
                    }
                if "experience_analysis" not in result:
                    result["experience_analysis"] = {
                        "meets_minimum": True,
                        "experience_gap_years": 0,
                        "level_match": "Unknown",
                        "strengths": [],
                        "gaps": [],
                        "recommendations": []
                    }
                if "notable_requirements" not in result:
                    result["notable_requirements"] = []
                
                return result
                
            except json.JSONDecodeError as e:
                print(f"JSON decode error in experience analysis: {e}")
                return {
                    "candidate_total_experience": {"years": 0, "months": 0, "level": "Unknown"},
                    "job_requirements": {
                        "minimum_years": 0,
                        "preferred_years": 0,
                        "seniority_level": "Not specified", 
                        "specific_requirements": [],
                        "special_requirements": []
                    },
                    "experience_analysis": {
                        "meets_minimum": False,
                        "experience_gap_years": 0,
                        "level_match": "Unable to analyze",
                        "strengths": [],
                        "gaps": ["Unable to analyze experience requirements"],
                        "recommendations": ["Please review experience requirements manually"]
                    },
                    "notable_requirements": ["Unable to extract experience requirements"]
                }
                
        except Exception as e:
            print(f"Error in experience analysis: {str(e)}")
            return {
                "error": f"Error analyzing experience: {str(e)}",
                "candidate_total_experience": {"years": 0, "months": 0, "level": "Unknown"},
                "job_requirements": {
                    "minimum_years": 0,
                    "preferred_years": 0,
                    "seniority_level": "Not specified",
                    "specific_requirements": [],
                    "special_requirements": []
                },
                "experience_analysis": {
                    "meets_minimum": False,
                    "experience_gap_years": 0,
                    "level_match": "Analysis failed",
                    "strengths": [],
                    "gaps": ["Experience analysis failed"],
                    "recommendations": ["Please review manually"]
                },
                "notable_requirements": []
            }
        
    async def compare_cv_to_jd_full(self, cv_data: dict, job_description: str) -> dict:
        """
        Compare the CV to a job description and return matches, missing, not_needed, and recommended courses.
        This is an alternative analysis method that provides a different perspective.
        """        
        try:
            prompt = f"""
            You are a professional career advisor and CV reviewer with deep technical knowledge. Compare the following CV data to the provided job description. Identify:
            1. What the CV already has for the job description (matches) - return ONLY concise skill names
            2. What is missing (required by the job description, not in the CV) - return ONLY concise skill names
            3. What is not needed (in the CV, but not required by the job description) - return ONLY concise skill names

            CV Data:
            {json.dumps(cv_data, indent=2)}

            Job Description:
            {job_description}CRITICAL TECHNICAL KNOWLEDGE - Apply these rules when analyzing:
            1. Flutter/Dart - This is a cross-platform mobile framework that develops for BOTH iOS and Android PLATFORMS
               - If CV has Flutter, DO NOT mark "iOS" or "Android" as missing UNLESS job specifically requires native development
               - Flutter SATISFIES mobile platform requirements for both iOS and Android
               - However, Swift and Kotlin are NATIVE programming languages and are DIFFERENT from Flutter
            2. React Native - Also covers both iOS and Android PLATFORMS
               - If CV has React Native, DO NOT mark "iOS" or "Android" as missing
               - However, Swift and Kotlin are still separate native languages
            3. Native Programming Languages vs Platforms:
               - iOS/Android = PLATFORMS (covered by Flutter/React Native)
               - Swift = NATIVE iOS programming language (different from Flutter)
               - Kotlin = NATIVE Android programming language (different from Flutter)
               - Even with Flutter, Swift/Kotlin may be needed for native features
            4. Cross-platform frameworks are excellent for most mobile development roles
            5. Web frameworks (React, Vue, Angular) can transfer to mobile development

            STRICT ANALYSIS RULES:
            - Cross-platform frameworks (Flutter, React Native) SATISFY PLATFORM requirements (iOS, Android)
            - Swift and Kotlin are native languages - treat them separately from platform coverage
            - Only mark iOS/Android platforms as missing if job explicitly requires native development AND candidate lacks ANY mobile framework
            - If candidate has Flutter or React Native, they can develop for both iOS and Android
            - Prioritize cross-platform skills over platform-specific skills
            - Don't create artificial skill gaps when broader skills exist

            IMPORTANT: For matches, missing, and not_needed arrays, return ONLY short technical skill names like:
            - "Flutter", "iOS", "SwiftUI", "Swift", "React", "Python", "MySQL", "Firebase", "Git", "Docker", etc.
            - Do NOT include long descriptions or explanations
            - Do NOT include soft skills like "Agile", "Scrum", "Jira", "Confluence", "Communication"
            - Focus ONLY on programming languages, frameworks, libraries, and development tools
            - Do NOT include business methodologies or project management tools

            Provide your response as a JSON object with the following structure:
            {{
              "matches": [
                "Flutter", "Git"
              ],
              "missing": [
                "Swift", "Kotlin"
              ],
              "not_needed": [
                "Python", "TensorFlow", "MySQL", "React"
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
                # Remove course recommendations from this method as they are handled by the main analysis
                return result
            except json.JSONDecodeError:
                return {
                    "matches": [],
                    "missing": [],
                    "not_needed": []
                }
        except Exception as e:
            return {
                "error": f"Error comparing CV to JD: {str(e)}",
                "matches": [],
                "missing": [],
                "not_needed": []
            }

gemini_service = GeminiService()
