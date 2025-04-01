import os
import uuid
from fastapi import HTTPException
from utils.json_to_latex import json_to_latex

LATEX_OUTPUT_DIR = "output_tex_files"
os.makedirs(LATEX_OUTPUT_DIR, exist_ok=True)

def sanitize_filename(name: str) -> str:
    """Removes potentially unsafe characters for filenames."""
    import re
    if not name or not isinstance(name, str):
        return "cv_output"  # Default base name
    name = name.strip().replace(" ", "_")
    name = re.sub(r'[^\w\-]+', '', name)
    return name if name else "cv_output"

def convert_to_latex_service(cv_data: dict) -> dict:
    try:
        latex_code = json_to_latex(cv_data)

        base_filename = "cv_output"
        try:
            name_from_input = cv_data.get("cv_template", {}).get("sections", {}).get("header", {}).get("name")
            if name_from_input:
                base_filename = sanitize_filename(name_from_input)
        except Exception:
            pass

        unique_id = uuid.uuid4()
        filename = f"{base_filename}_{unique_id}.tex"
        filepath = os.path.join(LATEX_OUTPUT_DIR, filename)

        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(latex_code)
            print(f"LaTeX file saved successfully to: {filepath}")
        except IOError as io_err:
            print(f"Error saving LaTeX file to {filepath}: {io_err}")
            filepath = None

        response_data = {"latex": latex_code}
        if filepath:
            response_data["saved_filepath_server"] = filepath

        return response_data

    except Exception as e:
        print(f"Error converting to LaTeX or saving file: {e}")
        raise HTTPException(status_code=500, detail=str(e))