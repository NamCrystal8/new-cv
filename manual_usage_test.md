# Manual Usage Tracking Verification

## Summary of Changes Made

### 1. Fixed CV Analysis Usage Tracking
**File**: `new-cv/BackEnd/routes/cv_routes.py`
**Endpoint**: `/analyze-cv-weaknesses`
**Lines**: 281-293

**Added**:
```python
# Track usage for CV analysis
await subscription_service.increment_usage(user.id, "cv_analysis")
await subscription_service.save_analysis_result(
    user_id=user.id,
    cv_id=None,  # No CV ID available in uploaded file analysis
    analysis_type=AnalysisType.CV_ANALYSIS,
    analysis_data={"result": detailed_analysis, "cv_data": extracted_cv_data}
)
```

### 2. Fixed CV Storage Usage Tracking
**File**: `new-cv/BackEnd/routes/cv_routes.py`
**Endpoints**: `/complete-cv-flow` and `/cv/{cv_id}/update`

**Added to `/complete-cv-flow`** (Lines 844-845):
```python
# Track usage for CV storage/download
await subscription_service.increment_usage(user.id, "cv_download")
```

**Added to `/cv/{cv_id}/update`** (Lines 1184-1185):
```python
# Track usage for CV storage/download
await subscription_service.increment_usage(user.id, "cv_download")
```

### 3. Fixed Job Analysis Usage Tracking Consistency
**File**: `new-cv/BackEnd/routes/cv_routes.py`

**Fixed inconsistent analysis type names**:
- Changed `"job_description_analysis"` to `"job_analysis"` in usage limit checks
- Lines 1219 and 1290

## Manual Testing Steps

### Test 1: CV Analysis Usage Tracking
1. Start the backend server: `cd BackEnd && uvicorn main:app --reload`
2. Register/login as a user
3. Upload a CV file to `/analyze-cv-weaknesses` endpoint
4. Check usage stats via `/subscription/status` endpoint
5. **Expected**: `cv_analyses_used` should increment by 1

### Test 2: Job Analysis Usage Tracking
1. Upload a CV with job description to `/analyze-cv-with-job-description`
2. Check usage stats via `/subscription/status` endpoint
3. **Expected**: `job_analyses_used` should increment by 1

### Test 3: CV Storage Usage Tracking
1. Complete the CV flow via `/complete-cv-flow` endpoint
2. Check usage stats via `/subscription/status` endpoint
3. **Expected**: `cv_downloads_count` should increment by 1

### Test 4: Usage Limits
1. Perform 3 CV analyses (free tier limit)
2. Try to perform a 4th CV analysis
3. **Expected**: Should receive 429 error with usage limit exceeded message

## API Endpoints to Test

### Get Usage Stats
```
GET /subscription/status
Authorization: Bearer <token>
```

### Check Usage Limits
```
POST /subscription/check-limits/cv_analysis
Authorization: Bearer <token>
```

```
POST /subscription/check-limits/job_analysis
Authorization: Bearer <token>
```

## Expected Usage Tracking Behavior

### Free Tier Limits
- CV Analysis: 3 per month
- Job Analysis: 1 per month  
- CV Downloads: 5 per month

### Usage Counters
- `cv_analyses_count`: Incremented when CV is analyzed
- `job_analyses_count`: Incremented when job description analysis is performed
- `cv_downloads_count`: Incremented when CV is saved/stored

## Database Verification

Check the `usage_tracking` table:
```sql
SELECT * FROM usage_tracking WHERE user_id = '<user_id>';
```

Should show incremented counters after each operation.
