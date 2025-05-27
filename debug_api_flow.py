#!/usr/bin/env python3
"""
Debug script to test the actual API endpoint that handles experience updates
and see if achievements are being lost during the API processing
"""

import json
import requests
import os
import sys

def test_api_data_flow():
    """Test the actual API endpoint for updating experience data"""
    
    print("=== TESTING API ENDPOINT FOR EXPERIENCE UPDATES ===\n")
    
    # You would need to replace this with your actual API base URL
    # For local testing, it would typically be http://localhost:8000
    api_base_url = "http://localhost:8000"  # Adjust this as needed
    
    # Sample experience data as it would be sent from the EditCVPage
    experience_data = [
        {
            "id": "experience_0",
            "company": "Debug Test Company",
            "title": "Senior Developer", 
            "location": "Test City, TC",
            "start_date": "Jan 2022",
            "end_date": "Present",
            "is_current": True,
            "achievements": [
                "DEBUG: Implemented critical bug fixes that improved system stability by 40%",
                "DEBUG: Led cross-functional team of 8 engineers on major product launch",
                "DEBUG: Designed and developed microservices architecture serving 1M+ users daily"
            ]
        }
    ]
    
    # Format the data as it would be formatted by formatSectionsForBackend
    formatted_data = {
        "experience": json.dumps(experience_data)
    }
    
    print("1. Data being sent to API:")
    print(json.dumps(formatted_data, indent=2))
    print()
    
    # Note: For this test to work, you'd need:
    # 1. The backend server running
    # 2. A valid CV ID
    # 3. Authentication token
    
    print("2. API Endpoint Test:")
    print("⚠️  To test the actual API endpoint, you would need:")
    print("   - Backend server running on localhost:8000 (or your server URL)")
    print("   - A valid CV ID from your database")
    print("   - Valid authentication (login token)")
    print()
    
    # Instead of making an actual API call, let's simulate the backend processing
    print("3. Simulating Backend Processing (from cv_routes.py):")
    
    # This is the exact logic from cv_routes.py update_cv function
    try:
        additional_inputs = formatted_data
        
        if "experience" in additional_inputs:
            experience_items = json.loads(additional_inputs["experience"])
            print(f"✓ Successfully parsed experience JSON: {len(experience_items)} items")
            
            # Transform the experience items to match the expected format
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
            
            print("✓ Successfully transformed experience items")
            print(f"✓ Achievements preserved: {len(formatted_experience_items[0]['achievements'])} items")
            
            print("\n4. Final Backend Experience Structure:")
            print(json.dumps(formatted_experience_items, indent=2))
            
            # Check if achievements are preserved
            for i, item in enumerate(formatted_experience_items):
                achievements = item.get("achievements", [])
                print(f"\nExperience item {i} achievements:")
                for j, achievement in enumerate(achievements):
                    print(f"  {j+1}. {achievement}")
            
            print(f"\n✓ Total achievements found: {sum(len(item.get('achievements', [])) for item in formatted_experience_items)}")
            
    except Exception as e:
        print(f"✗ Error during backend processing simulation: {str(e)}")
        import traceback
        traceback.print_exc()

def create_test_api_call_script():
    """Create a script that can be used to test the actual API endpoint"""
    
    script_content = '''
# Test script for making actual API calls
# Replace these values with actual data from your application

import requests
import json

# Configuration
API_BASE_URL = "http://localhost:8000"  # Or your deployed URL
CV_ID = 1  # Replace with actual CV ID
AUTH_TOKEN = "your_jwt_token_here"  # Get this from browser dev tools after login

# Headers for authentication
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {AUTH_TOKEN}"  # Adjust based on your auth method
}

# Experience data to test
experience_data = [{
    "id": "experience_0",
    "company": "API Test Company",
    "title": "Test Engineer",
    "location": "Test Location",
    "start_date": "Jan 2023",
    "end_date": "Present", 
    "is_current": True,
    "achievements": [
        "API TEST: First achievement with important metrics",
        "API TEST: Second achievement showing impact",
        "API TEST: Third achievement demonstrating leadership"
    ]
}]

# Format data for API
payload = {
    "flow_id": f"test-{CV_ID}",
    "additional_inputs": {
        "experience": json.dumps(experience_data)
    }
}

# Make API call
try:
    response = requests.post(
        f"{API_BASE_URL}/api/cv/{CV_ID}/update",
        headers=headers,
        json=payload
    )
    
    print(f"Response Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.ok:
        print("✅ API call successful!")
        result = response.json()
        if "pdf_url" in result:
            print(f"📄 PDF generated: {result['pdf_url']}")
        else:
            print("⚠️ No PDF URL in response")
    else:
        print("❌ API call failed")
        
except Exception as e:
    print(f"Error: {e}")
'''
    
    with open("test_api_call.py", "w") as f:
        f.write(script_content)
    
    print("\n5. Created test_api_call.py script for testing actual API endpoints")
    print("   Edit the script with your actual CV ID and auth token to test the live API")

if __name__ == "__main__":
    test_api_data_flow()
    create_test_api_call_script()
