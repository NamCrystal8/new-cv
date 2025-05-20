from services.latex_service import convert_to_latex_service
import json

# Create a test CV with achievements section
test_cv = {
    "cv_template": {
        "metadata": {
            "section_order": ["header", "achievements"]
        },
        "sections": {
            "header": {
                "name": "Test User",
                "contact_info": {
                    "email": {"value": "test@example.com", "link": "mailto:test@example.com"},
                    "phone": {"value": "123-456-7890", "link": "tel:1234567890"},
                    "location": {"value": "Boston, MA"}
                }
            },
            "achievements": {
                "section_title": "Awards & Achievements",
                "items": [
                    {
                        "organization": "Harvard University",
                        "description": "Dean's List 2020-2022",
                        "date": "2022"
                    },
                    {
                        "organization": "Computer Science Association",
                        "description": "First Prize in Hackathon",
                        "date": "2021"
                    }
                ]
            }
        }
    }
}

# Convert to LaTeX
result = convert_to_latex_service(test_cv)

# Print LaTeX code to verify
print("LaTeX Output:")
print(result["latex"])
print("\nSaved to:", result.get("saved_filepath_server", "Not saved")) 