#!/usr/bin/env python3

import json

def test_backend_processing():
    print("=== TESTING BACKEND PROCESSING FOR EXPERIENCE UPDATES ===")
    
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
    
    print("2. Simulating Backend Processing:")
    
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
            
            print("\n3. Final Backend Experience Structure:")
            print(json.dumps(formatted_experience_items, indent=2))
            
            # Check if achievements are preserved
            for i, item in enumerate(formatted_experience_items):
                achievements = item.get("achievements", [])
                print(f"\nExperience item {i} achievements:")
                for j, achievement in enumerate(achievements):
                    print(f"  {j+1}. {achievement}")
            
            total_achievements = sum(len(item.get('achievements', [])) for item in formatted_experience_items)
            print(f"\n✓ Total achievements found: {total_achievements}")
            
            if total_achievements > 0:
                print("✅ ACHIEVEMENTS ARE BEING PRESERVED IN BACKEND PROCESSING")
            else:
                print("❌ ACHIEVEMENTS ARE BEING LOST IN BACKEND PROCESSING")
            
    except Exception as e:
        print(f"✗ Error during backend processing simulation: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_backend_processing()
