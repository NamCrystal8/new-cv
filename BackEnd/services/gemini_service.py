import json
from io import BytesIO
import os
import PyPDF2
from google import genai
import dotenv
import re
from utils.latex_prompt import latex_prompt
from utils.response_cleaner import response_cleaner

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

gemini_service = GeminiService()
