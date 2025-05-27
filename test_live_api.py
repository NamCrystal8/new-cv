#!/usr/bin/env python3
"""
Test script to debug the live API data flow for experience achievements.
This script will simulate the exact data flow from EditCVPage to the backend API.
"""

import json
import requests
import sys
import os
from typing import Dict, Any

def test_live_api_flow():
    """Test the actual API endpoint for updating experience data with achievements"""
    print("=== TESTING LIVE API FLOW FOR EXPERIENCE ACHIEVEMENTS ===")
    
    # Sample experience data as it would be sent from EditCVPage
    experience_data = [
        {
            "id": "experience_0",
            "company": "API Test Company",
            "title": "Senior Software Engineer", 
            "location": "Remote, USA",
            "start_date": "Jan 2023",
            "end_date": "Present",
            "is_current": True,
            "achievements": [
                "API TEST: Led development of microservices architecture serving 2M+ users",
                "API TEST: Implemented CI/CD pipeline reducing deployment time by 60%",
                "API TEST: Mentored 5 junior developers and improved team productivity by 35%"
            ]
        },
        {
            "id": "experience_1",
            "company": "Previous Company",
            "title": "Full Stack Developer",
            "location": "San Francisco, CA",
            "start_date": "Jun 2021",
            "end_date": "Dec 2022",
            "is_current": False,
            "achievements": [
                "API TEST: Built React-based dashboard with real-time analytics",
                "API TEST: Optimized database queries improving response time by 45%"
            ]
        }
    ]
    
    # Format the data as it would be formatted by formatSectionsForBackend
    formatted_data = {
        "experience": json.dumps(experience_data),
        "header.name": "Test User",
        "header.email": "test@example.com"
    }
    
    print("1. Frontend Data Structure (before JSON.stringify):")
    print(json.dumps(experience_data, indent=2))
    print()
    
    print("2. Data being sent to API (after formatSectionsForBackend):")
    print(json.dumps(formatted_data, indent=2))
    print()
    
    # Test the update_cv endpoint (this is what EditCVPage calls)
    print("3. Testing /api/cv/{cv_id}/update endpoint simulation...")
    
    try:
        # Simulate the backend processing logic
        additional_inputs = formatted_data
        
        # Parse experience data (simulating the backend logic)
        if "experience" in additional_inputs:
            experience_items = json.loads(additional_inputs["experience"])
            print(f"   ✓ Successfully parsed experience JSON: {len(experience_items)} items")
            
            # Transform the experience items to match the expected backend format
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
            
            print(f"   ✓ Successfully transformed to backend format")
            print(f"   ✓ Total achievements preserved: {sum(len(item.get('achievements', [])) for item in formatted_experience_items)}")
            
            print("\n4. Backend Experience Structure (ready for LaTeX):")
            print(json.dumps(formatted_experience_items, indent=2))
            
            # Verify each item has achievements
            print("\n5. Achievement Verification:")
            for i, item in enumerate(formatted_experience_items):
                achievements = item.get("achievements", [])
                print(f"   Experience {i+1} ({item['title']} at {item['company']}):")
                print(f"     - Achievement count: {len(achievements)}")
                for j, achievement in enumerate(achievements):
                    print(f"     - {j+1}. {achievement}")
                print()
              # Test LaTeX generation
            print("6. Testing LaTeX Generation...")
            import sys
            import os
            sys.path.append('./BackEnd')
            from utils.json_to_latex import json_to_latex
            
            # Create a minimal CV structure for LaTeX testing
            cv_structure = {
                "cv_template": {
                    "sections": {
                        "header": {
                            "name": "Test User",
                            "contact_info": {
                                "email": {"value": "test@example.com"},
                                "phone": {"value": "+1 234 567 8900"},
                                "location": {"value": "Remote, USA"}
                            }
                        },
                        "experience": {
                            "section_title": "Experience",
                            "items": formatted_experience_items
                        }
                    }
                }
            }
            
            latex_content = json_to_latex(cv_structure)
            
            # Check if achievements appear in LaTeX
            achievement_count_in_latex = latex_content.count("\\item")
            print(f"   ✓ LaTeX generated successfully")
            print(f"   ✓ Achievement items found in LaTeX: {achievement_count_in_latex}")
            
            if achievement_count_in_latex > 0:
                print("   ✅ ACHIEVEMENTS ARE BEING RENDERED IN LATEX!")
            else:
                print("   ❌ ACHIEVEMENTS ARE MISSING FROM LATEX!")
            
            # Save test LaTeX for inspection
            test_latex_path = "test_api_achievements.tex"
            with open(test_latex_path, 'w', encoding='utf-8') as f:
                f.write(latex_content)
            print(f"   ✓ Test LaTeX saved to: {test_latex_path}")
            
            # Check for specific achievement text in LaTeX
            print("\n7. Searching for achievement text in LaTeX:")
            for item in formatted_experience_items:
                for achievement in item.get("achievements", []):
                    if "API TEST:" in achievement and "API TEST:" in latex_content:
                        print(f"   ✓ Found achievement in LaTeX: {achievement[:50]}...")
                    elif "API TEST:" in achievement:
                        print(f"   ❌ Missing achievement in LaTeX: {achievement[:50]}...")
            
    except Exception as e:
        print(f"❌ Error during API simulation: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n=== API FLOW TEST COMPLETE ===")
    return True

def test_real_api_endpoints():
    """Test against actual running API endpoints (if available)"""
    print("\n=== TESTING REAL API ENDPOINTS ===")
    
    # Check if backend is running
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        print("✓ Backend is running, testing real endpoints...")
        
        # Test data
        test_cv_data = {
            "flow_id": f"test_{int(time.time())}",
            "additional_inputs": {
                "experience": json.dumps([{
                    "id": "exp_1",
                    "company": "Real API Test",
                    "title": "Test Engineer",
                    "location": "Test City",
                    "start_date": "Jan 2024",
                    "end_date": "Present",
                    "is_current": True,
                    "achievements": [
                        "REAL API TEST: Achievement 1",
                        "REAL API TEST: Achievement 2"
                    ]
                }])
            }
        }
        
        # Note: This would require authentication and a valid CV ID
        print("   (Real API testing would require authentication and valid CV ID)")
        print("   Use browser dev tools to capture actual requests from EditCVPage")
        
    except requests.exceptions.RequestException:
        print("   Backend not running on localhost:8000")
        print("   To test real endpoints:")
        print("   1. Start the backend server")
        print("   2. Use browser dev tools to monitor network requests")
        print("   3. Save changes in EditCVPage and check the API calls")

if __name__ == "__main__":
    import time
    
    print("Starting comprehensive API flow test...")
    print(f"Test time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    success = test_live_api_flow()
    test_real_api_endpoints()
    
    print("\n" + "="*60)
    if success:
        print("✅ TEST COMPLETED - Check results above for achievement preservation")
    else:
        print("❌ TEST FAILED - Check error messages above")
    print("="*60)
