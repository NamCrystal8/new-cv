"""
PDF Field Mapping: Maps CV data structure fields to their usage in PDF generation
This mapping ensures recommendations only target fields that actually appear in the final PDF output.
"""

PDF_USED_FIELDS = {
    "header": {
        "name": True,
        "title": True,  # Optional but rendered if present
        "contact_info": {
            "email": {
                "value": True,
                "link": True
            },
            "phone": {
                "value": True,
                "link": True
            },
            "location": {
                "value": True
            }
        }
    },
    
    "summary": {
        "section_title": True,
        "content": True
    },
    
    "education": {
        "section_title": True,
        "items": {
            "institution": True,
            "location": True,
            "degree": True,
            "graduation_date": True,
            "dates": True, 
            "gpa": True,
            "coursework": True,
            "honors": True
        }
    },
    
    "experience": {
        "section_title": True,
        "items": {
            "company": True,
            "location": True,
            "title": True,
            "dates": True,
            "achievements": True,
            "technologies": True
        }
    },
    
    "projects": {
        "section_title": True,
        "items": {
            "title": True,
            "description": True,
            "start_date": True,
            "end_date": True,
            "dates": True,
            "key_contributions": True,
            "contributions": True, 
            "technologies": True
        }
    },
    
    "skills": {
        "section_title": True,
        "categories": {
            "name": True,
            "items": True
        },
        "interests": True 
    },
    
    "leadership": {
        "section_title": True,
        "items": {
            "organization": True,
            "location": True,
            "role": True,
            "dates": True,
            "descriptions": True
        }
    },
    
    "languages": {
        "section_title": True,
        "items": {
            "name": True,
            "proficiency": True
        }
    },
    
    "certifications": {
        "section_title": True,
        "items": {
            "title": True,
            "institution": True,
            "date": True
        }
    },
    
    "publications": {
        "section_title": True,
        "items": {
            "title": True,
            "date": True
        }
    },
    
    "research": {
        "section_title": True,
        "items": {
            "title": True,
            "description": True,
            "date": True
        }
    },
    
    "achievements": {
        "section_title": True,
        "items": {
            "organization": True,
            "description": True,
            "date": True
        }
    }
}

UNUSED_IN_PDF = {
    "metadata": ["section_order"],
    "rendering_rules": ["date_format", "hide_empty_sections", "max_items_per_section", "truncate_descriptions_at"],
    "header": ["url"],
    "education": {
        "items": ["url", "thesis"]
    },
    "experience": {
        "items": ["url"]
    },
    "projects": {
        "items": ["url"]
    },
    "leadership": {
        "items": ["url"]
    },
    "certifications": {
        "items": ["url"]
    },
    "courses": "*",
    "interests": "*",
    "references": "*",
    "patents": "*",
}

def is_field_used_in_pdf(field_path: str) -> bool:
    """
    Check if a specific field path is used in PDF generation.
    
    Args:
        field_path: Dot-notation field path (e.g., 'education.0.gpa', 'header.name')
    
    Returns:
        bool: True if field is used in PDF, False otherwise
    """
    parts = field_path.split('.')

    normalized_parts = []
    for part in parts:
        if part.isdigit():
            normalized_parts.append('items')
        else:
            normalized_parts.append(part)

    current = PDF_USED_FIELDS
    for part in normalized_parts:
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return False
    
    return current is True

def get_pdf_used_fields_for_section(section: str) -> list:
    """
    Get all PDF-used fields for a specific section.
    
    Args:
        section: Section name (e.g., 'education', 'experience')
    
    Returns:
        list: List of field paths that are used in PDF for this section
    """
    if section not in PDF_USED_FIELDS:
        return []
    
    section_data = PDF_USED_FIELDS[section]
    used_fields = []
    
    def extract_fields(data, prefix=""):
        if isinstance(data, dict):
            for key, value in data.items():
                field_path = f"{prefix}.{key}" if prefix else key
                if value is True:
                    used_fields.append(field_path)
                elif isinstance(value, dict):
                    extract_fields(value, field_path)
        elif data is True:
            used_fields.append(prefix)
    
    extract_fields(section_data)
    return used_fields

ALL_PDF_USED_FIELDS = []
for section, fields in PDF_USED_FIELDS.items():
    section_fields = get_pdf_used_fields_for_section(section)
    for field in section_fields:
        ALL_PDF_USED_FIELDS.append(f"{section}.{field}" if not field.startswith(section) else field)

def filter_recommendations_for_pdf(recommendations: list) -> list:
    """
    Filter recommendations to only include fields that are used in PDF generation.
    
    Args:
        recommendations: List of recommendation dictionaries with 'field' keys
    
    Returns:
        list: Filtered recommendations for PDF-relevant fields only
    """
    filtered = []
    
    for rec in recommendations:
        field = rec.get('field', '')
        if not field:
            continue
            
        if is_field_used_in_pdf(field):
            filtered.append(rec)
        else:
            print(f"[PDF_FILTER] Excluding recommendation for unused field: {field}")
    
    return filtered
