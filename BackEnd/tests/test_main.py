import pytest
import asyncio
import time
import csv
import json
import os
from fastapi.testclient import TestClient
from main import app
from services.gemini_service import GeminiService


@pytest.fixture
def client():
    with TestClient(app) as client:
        yield client


def test_home_route(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello"}


def test_about_route(client):
    response = client.get("/about")
    assert response.status_code == 200
    assert response.json() == {"message": "This is the about page."}


@pytest.mark.asyncio
async def test_gemini_models_comparison():
    """
    Test to compare 3 Gemini models: speed and response quality
    Models tested:
    - gemini-2.5-flash-preview-05-20
    - gemini-2.5-pro-preview-06-05
    - gemini-2.0-flash
    """

    # Models to test
    models = [
        "gemini-2.5-flash-preview-05-20",
        "gemini-2.5-pro-preview-06-05",
        "gemini-2.0-flash"
    ]

    # Path to test PDF
    pdf_path = "output_tex_files/Dang_Ngoc_Nam_1_7e204acd-3b19-4093-9d7b-a96b4510b9bf.pdf"

    # Check if PDF exists
    if not os.path.exists(pdf_path):
        pytest.skip(f"Test PDF not found at {pdf_path}")

    # Read PDF content
    with open(pdf_path, "rb") as f:
        pdf_content = f.read()

    results = []

    print("\n" + "="*80)
    print("GEMINI MODELS COMPARISON TEST")
    print("="*80)

    for model_name in models:
        print(f"\nTesting model: {model_name}")
        print("-" * 50)

        try:
            # Create GeminiService instance with specific model
            service = GeminiService()
            service.model_name = model_name  # Override the default model

            # Measure start time
            start_time = time.time()

            # Test PDF extraction
            result = await service.extract_pdf_text(pdf_content=pdf_content)

            # Measure end time
            end_time = time.time()
            response_time = end_time - start_time

            # Determine if response was successful
            success = not (isinstance(result, dict) and "error" in result)

            # Prepare response summary
            if success:
                response_summary = "Success - CV data extracted"
                if isinstance(result, dict):
                    # Count sections extracted
                    sections = []
                    if result.get("header", {}).get("name"):
                        sections.append("header")
                    if result.get("experience", []):
                        sections.append("experience")
                    if result.get("education", []):
                        sections.append("education")
                    if result.get("skills", []):
                        sections.append("skills")
                    response_summary += f" ({len(sections)} sections: {', '.join(sections)})"
            else:
                response_summary = f"Error: {result.get('error', 'Unknown error')}"

            # Store result
            test_result = {
                "model_name": model_name,
                "speed_seconds": round(response_time, 3),
                "success": success,
                "response_summary": response_summary,
                "response_data": json.dumps(result) if isinstance(result, dict) else str(result)
            }

            results.append(test_result)

            # Print result
            print(f"✓ Response time: {response_time:.3f} seconds")
            print(f"✓ Success: {success}")
            print(f"✓ Response: {response_summary}")

        except Exception as e:
            error_msg = f"Exception: {str(e)}"
            test_result = {
                "model_name": model_name,
                "speed_seconds": -1,
                "success": False,
                "response_summary": error_msg,
                "response_data": error_msg
            }
            results.append(test_result)
            print(f"✗ Error: {error_msg}")

    # Save results to CSV
    csv_filename = "gemini_models_test_results.csv"
    csv_path = os.path.join("tests", csv_filename)

    # Ensure tests directory exists
    os.makedirs("tests", exist_ok=True)

    with open(csv_path, "w", newline="", encoding="utf-8") as csvfile:
        fieldnames = ["model_name", "speed_seconds", "success", "response_summary", "response_data"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for result in results:
            writer.writerow(result)

    print(f"\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)

    # Sort by speed (successful responses only)
    successful_results = [r for r in results if r["success"]]
    if successful_results:
        successful_results.sort(key=lambda x: x["speed_seconds"])
        print("\nRanking by speed (fastest first):")
        for i, result in enumerate(successful_results, 1):
            print(f"{i}. {result['model_name']}: {result['speed_seconds']}s")

    print(f"\nResults saved to: {csv_path}")
    print(f"Total models tested: {len(results)}")
    print(f"Successful responses: {len(successful_results)}")
    print(f"Failed responses: {len(results) - len(successful_results)}")

    # Assert that at least one model worked
    assert len(successful_results) > 0, "No models returned successful responses"

    print("\n" + "="*80)
