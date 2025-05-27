#!/usr/bin/env python3
"""
Debug script to test the complete experience data flow from frontend to backend
and identify where achievements are being lost in the process.
"""

import json
import sys
import os

# Add backend path to sys.path so we can import modules
backend_path = os.path.join(os.path.dirname(__file__), 'BackEnd')
sys.path.insert(0, backend_path)

from utils.json_to_latex import json_to_latex

def test_experience_data_flow():
    """Test the complete experience data flow with achievements"""
    
    print("=== TESTING EXPERIENCE DATA FLOW WITH ACHIEVEMENTS ===\n")
    
    # Simulate frontend data structure as it would be sent to backend
    frontend_experience_items = [
        {
            "id": "experience_0",
            "company": "Test Company",
            "title": "Software Engineer",
            "location": "San Francisco, CA",
            "start_date": "Jan 2020",
            "end_date": "Present",
            "is_current": True,
            "achievements": [
                "Developed scalable web applications using React and Node.js",
                "Improved system performance by 30% through optimization",
                "Led a team of 5 developers on major product features"
            ]
        },
        {
            "id": "experience_1", 
            "company": "Previous Company",
            "title": "Junior Developer",
            "location": "New York, NY",
            "start_date": "Jun 2018",
            "end_date": "Dec 2019",
            "is_current": False,
            "achievements": [
                "Built RESTful APIs serving 10,000+ requests per day",
                "Collaborated with designers to implement pixel-perfect UIs",
                "Participated in code reviews and maintained 95% test coverage"
            ]
        }
    ]
    
    print("1. Frontend Experience Data (as sent via API):")
    print(json.dumps(frontend_experience_items, indent=2))
    print()
    
    # Simulate backend processing (as in cv_routes.py complete_cv_flow)
    print("2. Backend Processing - Converting to backend format:")
    formatted_experience_items = []
    for item in frontend_experience_items:
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
    
    print(json.dumps(formatted_experience_items, indent=2))
    print()
    
    # Create complete CV structure for LaTeX generation
    cv_data = {
        "cv_template": {
            "metadata": {
                "section_order": ["header", "experience"]
            },
            "sections": {
                "header": {
                    "name": "John Doe",
                    "contact_info": {
                        "email": {"value": "john.doe@example.com", "link": "mailto:john.doe@example.com"},
                        "phone": {"value": "(555) 123-4567", "link": "tel:5551234567"},
                        "location": {"value": "San Francisco, CA"}
                    }
                },
                "experience": {
                    "section_title": "Experience",
                    "items": formatted_experience_items
                }
            }
        }
    }
    
    print("3. Complete CV Structure for LaTeX Generation:")
    print(json.dumps(cv_data, indent=2))
    print()
      # Test LaTeX generation
    print("4. Testing LaTeX Generation:")
    try:
        latex_result = json_to_latex(cv_data)
        print("✓ LaTeX generation successful!")
        print()
        
        # Check if achievements are in the LaTeX output
        # Handle both string and dict return types
        if isinstance(latex_result, str):
            latex_content = latex_result
        else:
            latex_content = latex_result.get('latex', '') if isinstance(latex_result, dict) else str(latex_result)
        
        # Look for itemize environments and achievement content
        if '\\begin{itemize}' in latex_content:
            print("✓ Found itemize environments in LaTeX output")
            
            # Count achievement items
            achievement_count = latex_content.count('\\item ')
            print(f"✓ Found {achievement_count} \\item entries in LaTeX")
            
            # Check for specific achievement text
            test_achievements = [
                "Developed scalable web applications",
                "Improved system performance by 30%",
                "Led a team of 5 developers"
            ]
            
            found_achievements = []
            for achievement in test_achievements:
                if achievement in latex_content:
                    found_achievements.append(achievement)
            
            print(f"✓ Found {len(found_achievements)}/{len(test_achievements)} test achievements in LaTeX")
            
            if found_achievements:
                print("Found achievements:")
                for ach in found_achievements:
                    print(f"  - {ach}")
            
        else:
            print("✗ No itemize environments found in LaTeX output")
        
        print()
        print("5. Experience Section in Generated LaTeX:")
        print("=" * 50)
        
        # Extract just the experience section
        lines = latex_content.split('\n')
        in_experience = False
        experience_lines = []
        
        for line in lines:
            if '\\section{Experience}' in line or '\\section{Work Experience}' in line:
                in_experience = True
                experience_lines.append(line)
            elif in_experience and line.startswith('\\section{'):
                break
            elif in_experience:
                experience_lines.append(line)
        
        if experience_lines:
            print('\n'.join(experience_lines[:50]))  # Show first 50 lines
        else:
            print("No experience section found in LaTeX output!")
        
        print("=" * 50)
        
    except Exception as e:
        print(f"✗ LaTeX generation failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_experience_data_flow()
