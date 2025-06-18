#!/usr/bin/env python3
"""
Test script to verify CV optimization scoring system consistency between backend and frontend.
This script tests the simplified 2-category skill system (match/missing) and scoring logic.
"""

import asyncio
import json
import sys
import os

# Add the BackEnd directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'BackEnd'))

from services.gemini_service import GeminiService

# Sample CV data for testing
SAMPLE_CV_DATA = {
    "cv_template": {
        "sections": {
            "skills": {
                "categories": [
                    {
                        "name": "Technical Skills",
                        "items": ["Python", "JavaScript", "React", "Node.js", "Git", "Docker"]
                    }
                ]
            }
        }
    }
}

# Sample job description for testing
SAMPLE_JOB_DESCRIPTION = """
We are looking for a Full Stack Developer with the following skills:
- Python programming
- JavaScript and React
- Node.js for backend development
- Git version control
- Docker containerization
- AWS cloud services
- MongoDB database
- GraphQL API development

Requirements:
- 3+ years of experience
- Strong problem-solving skills
- Team collaboration
"""

async def test_cv_optimization():
    """Test the CV optimization scoring system."""
    print("🧪 Testing CV Optimization Scoring System")
    print("=" * 50)
    
    try:
        # Initialize Gemini service
        gemini_service = GeminiService()
        print("✅ Gemini service initialized successfully")
        
        # Test the compare_cv_to_jd_full method
        print("\n📊 Testing skill comparison...")
        comparison_result = await gemini_service.compare_cv_to_jd_full(
            SAMPLE_CV_DATA, 
            SAMPLE_JOB_DESCRIPTION
        )
        
        print(f"🔍 Comparison Result:")
        print(f"   Matches: {comparison_result.get('matches', [])}")
        print(f"   Missing: {comparison_result.get('missing', [])}")
        print(f"   Not Needed: {comparison_result.get('not_needed', 'N/A - Should not exist')}")
        
        # Verify that not_needed is not in the response
        if 'not_needed' in comparison_result:
            print("❌ ERROR: 'not_needed' category still exists in backend response!")
            return False
        else:
            print("✅ SUCCESS: 'not_needed' category removed from backend response")
        
        # Test the scoring calculation
        print("\n🎯 Testing scoring calculation...")
        matches = comparison_result.get('matches', [])
        missing = comparison_result.get('missing', [])
        
        # Calculate score using the new method
        grade = gemini_service.calculate_cv_grade(
            matches=matches,
            missing=missing,
            missing_requirements=[]
        )
        
        print(f"📈 Scoring Result:")
        print(f"   Score: {grade['score']}/100")
        print(f"   Match Rate: {grade['match_rate']}%")
        print(f"   Level: {grade['level']}")
        print(f"   Feedback: {grade['feedback']}")
        print(f"   Matches Found: {grade['matches_found']}")
        print(f"   Missing Skills: {grade['missing_skills']}")
        
        # Verify scoring logic
        expected_match_rate = (len(matches) / (len(matches) + len(missing))) * 100 if (len(matches) + len(missing)) > 0 else 100
        if abs(grade['match_rate'] - expected_match_rate) < 1:  # Allow for rounding differences
            print("✅ SUCCESS: Scoring calculation is correct")
        else:
            print(f"❌ ERROR: Scoring calculation mismatch. Expected: {expected_match_rate:.1f}%, Got: {grade['match_rate']}%")
            return False
        
        # Test full job analysis
        print("\n🔬 Testing full job analysis...")
        full_analysis = await gemini_service.analyze_cv_against_job_description(
            SAMPLE_CV_DATA,
            SAMPLE_JOB_DESCRIPTION
        )
        
        print(f"📋 Full Analysis Result:")
        print(f"   Overall Grade Score: {full_analysis.get('overall_grade', {}).get('score', 'N/A')}/100")
        print(f"   Overall Grade Level: {full_analysis.get('overall_grade', {}).get('level', 'N/A')}")
        print(f"   Matches: {len(full_analysis.get('matches', []))}")
        print(f"   Missing: {len(full_analysis.get('missing', []))}")
        
        # Verify consistency between comparison and full analysis
        if (full_analysis.get('matches') == comparison_result.get('matches') and 
            full_analysis.get('missing') == comparison_result.get('missing')):
            print("✅ SUCCESS: Full analysis is consistent with comparison result")
        else:
            print("❌ WARNING: Full analysis differs from comparison result")
        
        print("\n🎉 All tests completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ ERROR: Test failed with exception: {str(e)}")
        import traceback
        print(f"Stack trace: {traceback.format_exc()}")
        return False

def simulate_frontend_scoring(matches, missing):
    """Simulate the frontend scoring calculation."""
    match_count = len(matches)
    missing_count = len(missing)
    total_required = match_count + missing_count
    
    if total_required == 0:
        return {"score": 100, "matchRate": 100, "level": "PASS"}
    
    match_rate = (match_count / total_required) * 100
    final_score = round(match_rate)
    
    if match_rate >= 80:
        level = "PASS"
    elif match_rate >= 60:
        level = "NEGOTIABLE"
    else:
        level = "NOT_RECOMMEND"
    
    return {"score": final_score, "matchRate": round(match_rate), "level": level}

async def test_frontend_backend_consistency():
    """Test that frontend and backend scoring produce the same results."""
    print("\n🔄 Testing Frontend-Backend Consistency")
    print("=" * 50)
    
    # Test cases with different skill combinations
    test_cases = [
        {"matches": ["Python", "JavaScript", "React"], "missing": ["AWS", "MongoDB"]},
        {"matches": ["Python", "JavaScript", "React", "Node.js", "Git"], "missing": ["AWS"]},
        {"matches": ["Python"], "missing": ["JavaScript", "React", "Node.js", "AWS", "MongoDB"]},
        {"matches": ["Python", "JavaScript", "React", "Node.js", "Git", "Docker"], "missing": []},
    ]
    
    try:
        gemini_service = GeminiService()
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n📝 Test Case {i}:")
            print(f"   Matches: {test_case['matches']}")
            print(f"   Missing: {test_case['missing']}")
            
            # Backend calculation
            backend_result = gemini_service.calculate_cv_grade(
                matches=test_case['matches'],
                missing=test_case['missing'],
                missing_requirements=[]
            )
            
            # Frontend simulation
            frontend_result = simulate_frontend_scoring(
                test_case['matches'],
                test_case['missing']
            )
            
            print(f"   Backend Score: {backend_result['score']}/100 ({backend_result['level']})")
            print(f"   Frontend Score: {frontend_result['score']}/100 ({frontend_result['level']})")
            
            # Check consistency
            if (backend_result['score'] == frontend_result['score'] and 
                backend_result['level'] == frontend_result['level']):
                print("   ✅ CONSISTENT")
            else:
                print("   ❌ INCONSISTENT")
                return False
        
        print("\n🎉 All consistency tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ ERROR: Consistency test failed: {str(e)}")
        return False

async def main():
    """Run all tests."""
    print("🚀 Starting CV Optimization System Tests")
    print("=" * 60)
    
    # Run basic functionality tests
    basic_test_passed = await test_cv_optimization()
    
    # Run consistency tests
    consistency_test_passed = await test_frontend_backend_consistency()
    
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Basic Functionality: {'✅ PASSED' if basic_test_passed else '❌ FAILED'}")
    print(f"Frontend-Backend Consistency: {'✅ PASSED' if consistency_test_passed else '❌ FAILED'}")
    
    if basic_test_passed and consistency_test_passed:
        print("\n🎉 ALL TESTS PASSED! CV Optimization system is working correctly.")
        return True
    else:
        print("\n❌ SOME TESTS FAILED! Please review the implementation.")
        return False

if __name__ == "__main__":
    # Run the tests
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
