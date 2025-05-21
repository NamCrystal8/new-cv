# Docker Testing Guide for CV Generator

This guide walks you through testing your CV Generator application with Docker before deploying to Render.

## Testing Strategy

We'll test in stages to isolate any issues:

1. **Test LaTeX Only**: Verify that LaTeX works correctly in Docker
2. **Test Simple App**: Test a minimalist version of the app focusing on LaTeX
3. **Test Full App**: Test the complete application with all dependencies

## Prerequisites

- Docker Desktop installed and running
- PowerShell terminal
- The CV Generator repository cloned to your computer

## Step 1: Test LaTeX Only

This test verifies that LaTeX installation works in a standalone container:

```powershell
# Navigate to your project directory
cd C:\DATN\new-cv

# Run the LaTeX-only test
.\test-latex-only.ps1
```

If successful, you'll see a PDF file open with simple text. This confirms LaTeX works in Docker.

## Step 2: Test Simplified App

This test checks if LaTeX works with a simplified version of your app:

```powershell
# Run the simplified Docker test
.\docker-run-simple.ps1
```

This builds a minimal Docker image and tests PDF generation. If successful, you'll see a PDF file open.

## Step 3: Test Full Application

Now let's test the complete application:

```powershell
# First, copy the optimized database file (optional but recommended)
Copy-Item .\BackEnd\core\database.py.docker .\BackEnd\core\database.py -Force

# Run the full application test
.\docker-run-local.ps1
```

If successful:
- The container will start
- The browser will open to the Swagger docs
- You'll see the health endpoint response

## Troubleshooting

### LaTeX Issues

If LaTeX tests fail:
- Check Docker logs: `docker logs cv-backend`
- Make sure texlive packages are installed in the Dockerfile
- Try with minimal LaTeX packages first

### SQLite/Database Issues

If you get database errors:
- Make sure `aiosqlite` is in your requirements.txt
- Check the database URL format in your .env.docker file
- Use the optimized database.py.docker file

### API Issues

If the API doesn't start:
- Check logs for import errors
- Check if all required environment variables are set
- Verify port mapping in the Docker run command

## Final Validation for Render

Before deploying to Render, confirm:

1. LaTeX PDF generation works
2. The health endpoint is accessible
3. Database connection can be established
4. Swagger docs are accessible

Once all tests pass, you're ready to deploy to Render!

## Clean Up

When done testing:

```powershell
# Clean up Docker containers and resources
.\docker-cleanup.ps1
```

This will stop and remove containers to free up resources.
