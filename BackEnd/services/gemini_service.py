import os
from google import genai
import dotenv
import PyPDF2
from io import BytesIO

dotenv.load_dotenv()

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key)
        self.model_name = "gemini-2.0-flash"

    async def extract_pdf_text(self, pdf_content: bytes) -> str:
        try:
            pdf_file = BytesIO(pdf_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            extracted_text = ""
            for page in pdf_reader.pages:
                extracted_text += page.extract_text() or ""

            if not extracted_text.strip():
                return "No text could be extracted from the PDF."

            prompt = f"Extracted text from PDF:\n{extracted_text}\n\nPlease summarize this text."
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            return response.text
        except Exception as e:
            return f"Error processing PDF: {str(e)}"

# Instantiate the service
gemini_service = GeminiService()
