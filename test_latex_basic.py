#!/usr/bin/env python3
"""
Test script to verify the basic LaTeX template works without missing packages
"""

import requests
import json
import os

# Configuration
BASE_URL = "https://new-cv-9zoc.onrender.com"

def test_latex_compilation():
    """Test the LaTeX compilation with the updated template"""
    print("🧪 Testing LaTeX Compilation with Basic Packages")
    print("=" * 60)
    
    # Step 1: Login to get bearer token
    print("1. 🔐 Getting Bearer Token...")
    email = input("Enter your email: ").strip()
    password = input("Enter your password: ").strip()
    
    try:
        login_data = {
            'username': email,
            'password': password
        }
        
        response = requests.post(
            f"{BASE_URL}/auth/bearer/login",
            data=login_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=10
        )
        
        if not response.ok:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return
        
        token_data = response.json()
        access_token = token_data.get('access_token')
        print(f"✅ Login successful! Token: {access_token[:20]}...")
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Step 2: Upload a test CV to start the flow
    print("\n2. 📄 Testing CV Upload and Analysis...")
    
    # Create a simple test CV content
    test_cv_content = """
    John Doe
    Software Engineer
    john.doe@example.com
    +1234567890
    New York, NY
    
    EXPERIENCE
    Tech Corp - Software Engineer (2020-2023)
    - Developed web applications using Python and React
    - Improved system performance by 25%
    
    EDUCATION
    University of Technology - Bachelor of Computer Science (2016-2020)
    GPA: 3.8/4.0
    
    SKILLS
    Programming: Python, JavaScript, React
    Databases: PostgreSQL, MongoDB
    """
    
    # Create a simple text file to upload
    test_file_path = "test_cv.txt"
    with open(test_file_path, "w") as f:
        f.write(test_cv_content)
    
    try:
        # Upload the test CV
        with open(test_file_path, "rb") as f:
            files = {"file": ("test_cv.txt", f, "text/plain")}
            headers = {'Authorization': f'Bearer {access_token}'}
            
            response = requests.post(
                f"{BASE_URL}/analyze-cv-weaknesses",
                headers=headers,
                files=files,
                timeout=30
            )
        
        if response.status_code == 200:
            print("✅ CV analysis successful!")
            analysis_data = response.json()
            flow_id = analysis_data.get('flow_id')
            print(f"Flow ID: {flow_id}")
            
            # Step 3: Test the complete CV flow (this will test LaTeX compilation)
            print("\n3. 🔧 Testing Complete CV Flow (LaTeX Compilation)...")
            
            test_payload = {
                "flow_id": flow_id,
                "additional_inputs": {
                    "header": json.dumps({
                        "name": "John Doe",
                        "email": "john.doe@example.com",
                        "phone": "+1234567890",
                        "location": "New York, NY"
                    }),
                    "experience": json.dumps([
                        {
                            "company": "Tech Corp",
                            "title": "Software Engineer",
                            "location": "New York, NY",
                            "dates": {"start": "2020", "end": "2023", "is_current": False},
                            "achievements": [
                                "Developed web applications using Python and React",
                                "Improved system performance by 25%"
                            ]
                        }
                    ]),
                    "education": json.dumps([
                        {
                            "institution": "University of Technology",
                            "degree": "Bachelor of Computer Science",
                            "graduation_date": "2020",
                            "gpa": "3.8/4.0"
                        }
                    ])
                }
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                f"{BASE_URL}/complete-cv-flow",
                headers=headers,
                json=test_payload,
                timeout=60  # Give more time for LaTeX compilation
            )
            
            print(f"Complete CV Flow Status: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ LaTeX compilation successful!")
                result = response.json()
                pdf_url = result.get('pdf_url')
                if pdf_url:
                    print(f"📄 PDF generated successfully: {pdf_url}")
                else:
                    print("⚠️  No PDF URL in response")
                    
            elif response.status_code == 500:
                print("❌ LaTeX compilation failed!")
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
                
                # Check if it's still a LaTeX package issue
                if "not found" in str(error_data.get('detail', '')).lower():
                    print("🔍 This appears to be a missing LaTeX package issue")
                    print("The basic template may need further simplification")
                else:
                    print("🔍 This appears to be a different LaTeX compilation issue")
                    
            else:
                print(f"⚠️  Unexpected status: {response.status_code}")
                print(f"Response: {response.text}")
                
        else:
            print(f"❌ CV analysis failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Test error: {e}")
    
    finally:
        # Clean up test file
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

def main():
    """Main test function"""
    print("🧪 LaTeX Basic Package Test")
    print("This script tests the updated LaTeX template that uses only basic packages")
    print("to avoid the 'lmodern.sty not found' error.")
    print()
    
    test_latex_compilation()
    
    print("\n" + "=" * 60)
    print("🏁 Test Complete")
    print("\nExpected Results:")
    print("✅ Login should succeed")
    print("✅ CV analysis should work")
    print("✅ LaTeX compilation should succeed without package errors")
    print("✅ PDF should be generated and uploaded to Cloudinary")
    print("\nIf you still see LaTeX package errors, we may need to simplify further.")

if __name__ == "__main__":
    main()
