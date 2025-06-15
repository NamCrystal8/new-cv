# Gemini Models Comparison Test Report

## Test Overview
This test compares the performance and response quality of 3 Gemini models for PDF CV extraction:

1. **gemini-2.5-flash-preview-05-20**
2. **gemini-2.5-pro-preview-06-05**
3. **gemini-2.0-flash**

## Test Setup
- **Test File**: `Dang_Ngoc_Nam_1_7e204acd-3b19-4093-9d7b-a96b4510b9bf.pdf`
- **Test Function**: PDF text extraction and CV data parsing
- **Measurement**: Response time (speed) and success rate
- **Date**: December 2024

## Results Summary

### Speed Ranking (Successful Models Only)
1. **gemini-2.0-flash**: 11.161 seconds ⚡
2. **gemini-2.5-flash-preview-05-20**: 30.112 seconds

### Detailed Results

#### 1. gemini-2.5-flash-preview-05-20
- **Speed**: 30.112 seconds
- **Success**: ✅ Yes
- **Response Quality**: Excellent
- **Details**: 
  - Successfully extracted comprehensive CV data
  - Included all major sections: header, summary, education, experience, skills, projects, languages
  - Provided detailed URLs and structured metadata
  - Added professional summary section
  - Most comprehensive output but slowest

#### 2. gemini-2.5-pro-preview-06-05
- **Speed**: 0.965 seconds (failed quickly)
- **Success**: ❌ No
- **Response Quality**: N/A
- **Error**: `429 RESOURCE_EXHAUSTED - Gemini 2.5 Pro Preview doesn't have a free quota tier`
- **Details**: 
  - Requires paid tier/billing account
  - Not available for free testing
  - Would need premium access to evaluate

#### 3. gemini-2.0-flash
- **Speed**: 11.161 seconds
- **Success**: ✅ Yes
- **Response Quality**: Very Good
- **Details**:
  - Successfully extracted CV data with all major sections
  - Slightly less detailed than 2.5-flash-preview but still comprehensive
  - Fastest successful model
  - Good balance of speed and quality

## Key Findings

### Speed Analysis
- **gemini-2.0-flash** is ~2.7x faster than gemini-2.5-flash-preview-05-20
- **gemini-2.5-pro-preview-06-05** is not accessible with free tier

### Quality Analysis
- Both successful models extracted complete CV information
- **gemini-2.5-flash-preview-05-20** provided more detailed output with professional summary
- **gemini-2.0-flash** provided clean, well-structured output with good detail level

### Accessibility
- **gemini-2.0-flash**: ✅ Free tier available
- **gemini-2.5-flash-preview-05-20**: ✅ Free tier available
- **gemini-2.5-pro-preview-06-05**: ❌ Requires paid tier

## Recommendations

### For Production Use
1. **Primary**: Use **gemini-2.0-flash** for best speed/quality balance
2. **Alternative**: Use **gemini-2.5-flash-preview-05-20** when maximum detail is required and speed is less critical

### For Development/Testing
- **gemini-2.0-flash** is ideal for rapid development cycles
- Both free-tier models are suitable for testing

### Cost Considerations
- **gemini-2.0-flash** and **gemini-2.5-flash-preview-05-20** work with free API quotas
- **gemini-2.5-pro-preview-06-05** requires billing setup

## Technical Notes

### Response Structure
Both successful models returned properly structured JSON with:
- Header information (name, contact details)
- Education details
- Work experience with achievements
- Skills categorization
- Project descriptions
- Language proficiencies

### Error Handling
The test properly handled quota limitations and API errors, providing clear feedback for troubleshooting.

## Files Generated
- `gemini_models_test_results.csv` - Complete test data with full responses
- `gemini_models_summary.csv` - Simplified summary for quick reference
- `GEMINI_MODELS_TEST_REPORT.md` - This comprehensive report

## Conclusion
**gemini-2.0-flash** emerges as the optimal choice for CV processing, offering the best combination of speed, quality, and accessibility for the current use case.
