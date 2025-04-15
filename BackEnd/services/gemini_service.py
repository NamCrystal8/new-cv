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
                return json_result
            except json.JSONDecodeError as json_err:
                return {"error": f"Failed to parse API response as JSON: {str(json_err)}", "raw_response": latex_content}

        except Exception as e:
            return {"error": f"Error processing PDF: {str(e)}"}
            
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
                return json_result
            except json.JSONDecodeError as json_err:
                return {"error": f"Failed to parse API response as JSON: {str(json_err)}", "raw_response": enhanced_cv}
                
        except Exception as e:
            return {"error": f"Error enhancing CV: {str(e)}"}

gemini_service = GeminiService()
