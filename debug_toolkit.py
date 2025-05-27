#!/usr/bin/env python3
"""
Real-time debugging script to check if the issue occurs during live application usage.
This script will help identify where achievements are being lost in the actual save process.
"""

import json
import logging
from datetime import datetime

# Set up logging to capture all API requests
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('api_debug.log'),
        logging.StreamHandler()
    ]
)

def log_request_data(data, step_name):
    """Log request data at different steps"""
    logging.info(f"\n{'='*60}")
    logging.info(f"STEP: {step_name}")
    logging.info(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logging.info(f"{'='*60}")
    
    if isinstance(data, dict):
        # Check for experience data specifically
        if 'experience' in data:
            exp_data = data['experience']
            if isinstance(exp_data, str):
                try:
                    parsed_exp = json.loads(exp_data)
                    logging.info(f"Experience data found: {len(parsed_exp)} items")
                    for i, item in enumerate(parsed_exp):
                        achievements = item.get('achievements', [])
                        logging.info(f"  Item {i+1}: {item.get('title', 'No title')} at {item.get('company', 'No company')}")
                        logging.info(f"    Achievements: {len(achievements)} items")
                        for j, ach in enumerate(achievements):
                            logging.info(f"      {j+1}. {ach}")
                except json.JSONDecodeError as e:
                    logging.error(f"Failed to parse experience JSON: {e}")
                    logging.info(f"Raw experience data: {exp_data[:200]}...")
            else:
                logging.info(f"Experience data type: {type(exp_data)}")
                logging.info(f"Experience data: {exp_data}")
        else:
            logging.info("No experience data found in request")
        
        # Log other relevant fields
        other_fields = {k: v for k, v in data.items() if k != 'experience'}
        if other_fields:
            logging.info(f"Other fields: {list(other_fields.keys())}")
    else:
        logging.info(f"Data type: {type(data)}")
        logging.info(f"Data: {data}")

def create_monitoring_middleware():
    """Create middleware to monitor API requests"""
    
    # This would be injected into the FastAPI app to monitor requests
    middleware_code = '''
from fastapi import Request
import json
import logging
from datetime import datetime

@app.middleware("http")
async def debug_middleware(request: Request, call_next):
    """Middleware to log all API requests for debugging"""
    
    # Log request details
    logging.info(f"Request URL: {request.url}")
    logging.info(f"Request method: {request.method}")
    
    # Capture request body if it's a POST/PUT request
    if request.method in ["POST", "PUT", "PATCH"]:
        body = await request.body()
        if body:
            try:
                json_data = json.loads(body)
                log_request_data(json_data, f"{request.method} {request.url.path}")
            except json.JSONDecodeError:
                logging.info(f"Non-JSON body: {body[:200]}...")
    
    response = await call_next(request)
    return response
'''
    
    return middleware_code

def check_browser_devtools_instructions():
    """Provide instructions for using browser dev tools to debug"""
    print("\n" + "="*80)
    print("BROWSER DEVELOPER TOOLS DEBUGGING INSTRUCTIONS")
    print("="*80)
    print("\nTo debug the live application and see where achievements are lost:")
    print("\n1. Open the EditCVPage in your browser")
    print("2. Open Developer Tools (F12)")
    print("3. Go to the Network tab")
    print("4. Clear the network log")
    print("5. Add some achievements to an experience entry")
    print("6. Click 'Save Changes'")
    print("7. Look for the API request to /api/cv/{cv_id}/update")
    print("8. Check the request payload:")
    print("   a. Click on the request")
    print("   b. Go to the 'Payload' or 'Request' tab")
    print("   c. Look for the 'experience' field")
    print("   d. Verify that achievements are included in the JSON")
    print("\n9. If achievements are missing from the request:")
    print("   - The issue is in the frontend (EditCVPage.tsx)")
    print("   - Check the formatSectionsForBackend function")
    print("   - Verify the editableSections state contains achievements")
    print("\n10. If achievements are present in the request but missing from PDF:")
    print("    - The issue is in the backend processing")
    print("    - Check the update_cv endpoint in cv_routes.py")
    print("    - Check the LaTeX generation")
    print("\n11. Common places to add console.log for debugging:")
    print("    - In EditCVPage.tsx before calling handleSave")
    print("    - In formatSectionsForBackend function")
    print("    - In the ExperienceEditorNew component when achievements change")
    print("\n12. Example console.log statements to add:")
    console_logs = '''
// In EditCVPage.tsx - handleSave function
console.log('Saving CV with sections:', editableSections);
const experienceSection = editableSections.find(s => s.id === 'experience');
console.log('Experience section being saved:', experienceSection);

// In formatSectionsForBackend function
if (section.id === 'experience') {
  console.log('Formatting experience section:', section.items);
  formattedData[section.id] = JSON.stringify(section.items);
  console.log('Formatted experience data:', formattedData[section.id]);
}

// In ExperienceEditorNew.tsx - when achievements change
const handleItemsChange = (newItems: ExperienceItem[]) => {
  console.log('Experience items changed:', newItems);
  // existing validation code...
  onChange({
    ...section,
    items: validatedItems
  });
};
'''
    print(console_logs)
    print("\n" + "="*80)

def create_test_experience_data():
    """Create test data that can be used to verify the issue"""
    test_data = {
        "flow_id": "debug_test_123",
        "additional_inputs": {
            "experience": json.dumps([
                {
                    "id": "exp_debug_1",
                    "company": "Debug Test Company",
                    "title": "Senior Engineer",
                    "location": "Test City, TC",
                    "start_date": "Jan 2024",
                    "end_date": "Present",
                    "is_current": True,
                    "achievements": [
                        "DEBUG: This achievement should appear in the PDF",
                        "DEBUG: This is the second achievement",
                        "DEBUG: Third achievement for testing"
                    ]
                }
            ]),
            "header.name": "Debug Test User",
            "header.email": "debug@test.com"
        }
    }
    
    print("\n" + "="*60)
    print("TEST DATA FOR MANUAL API TESTING")
    print("="*60)
    print("\nYou can use this data to test the API endpoints manually:")
    print("\nPOST /api/cv/{cv_id}/update")
    print("Content-Type: application/json")
    print("\nRequest Body:")
    print(json.dumps(test_data, indent=2))
    print("\nExpected Result:")
    print("- PDF should be generated with achievements visible")
    print("- Achievements should appear as bullet points under the experience")
    print("\n" + "="*60)

if __name__ == "__main__":
    print("🔍 CV ACHIEVEMENTS DEBUGGING TOOLKIT")
    print("="*50)
    
    print("\n📋 SUMMARY OF FINDINGS:")
    print("✅ Frontend components (ExperienceEditorNew) are working correctly")
    print("✅ Backend API processing logic is working correctly") 
    print("✅ LaTeX generation is working correctly")
    print("✅ Data flow simulation shows achievements are preserved")
    print("\n🚨 ISSUE MUST BE IN LIVE APPLICATION USAGE")
    
    print("\n🔧 DEBUGGING APPROACHES:")
    print("1. Use browser developer tools to monitor network requests")
    print("2. Add console.log statements to frontend code")
    print("3. Check backend logs during actual save operations")
    print("4. Test with the provided test data")
    
    # Create monitoring middleware code
    middleware_code = create_monitoring_middleware()
    with open('debug_middleware.py', 'w') as f:
        f.write(middleware_code)
    print(f"\n💾 Debug middleware code saved to: debug_middleware.py")
    
    # Provide browser debugging instructions
    check_browser_devtools_instructions()
    
    # Create test data
    create_test_experience_data()
    
    print("\n🎯 NEXT STEPS:")
    print("1. Follow the browser debugging instructions above")
    print("2. Add console.log statements to track data flow")
    print("3. Use the test data to verify API endpoints")
    print("4. Check if the issue occurs only for certain CVs or all CVs")
    print("5. Verify if the issue happens during initial creation or only updates")
    
    print(f"\n📊 Debug log will be saved to: api_debug.log")
    print("🔚 Debugging toolkit ready!")
