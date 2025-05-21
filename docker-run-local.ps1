# This script builds and runs the CV Generator Docker container locally
# Make sure Docker Desktop is running before executing this script

# Change to the project root directory
Set-Location -Path C:\DATN\new-cv

# Stop any running containers with the same name
Write-Host "Stopping any existing cv-backend containers..." -ForegroundColor Yellow
docker stop cv-backend 2>$null
docker rm cv-backend 2>$null

# Create the .env.docker file with correct values
$envFilePath = "./BackEnd/.env.docker"
Write-Host "Creating .env.docker file for testing..." -ForegroundColor Yellow
@'
# SQLite database for testing (with aiosqlite driver for async support)
DATABASE_URL=sqlite+aiosqlite:///./test.db
# Required environment variables (dummy values for testing)
CLOUDINARY_CLOUD_NAME=test_cloud
CLOUDINARY_API_KEY=test_key
CLOUDINARY_API_SECRET=test_secret
JWT_SECRET=testsecret123456789
GOOGLE_GEMINI_API_KEY=test_gemini_key
'@ | Out-File -FilePath $envFilePath -Encoding utf8

# Add aiosqlite package to requirements.txt if not already present
$requirementsPath = "./BackEnd/requirements.txt"
$requirementsContent = Get-Content $requirementsPath -Raw
if ($requirementsContent -notmatch "aiosqlite") {
    Write-Host "Adding aiosqlite to requirements.txt..." -ForegroundColor Yellow
    Add-Content -Path $requirementsPath -Value "aiosqlite"
}

# Build the Docker image
Write-Host "Building Docker image..." -ForegroundColor Green
docker build -t cv-backend:local ./BackEnd

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed!" -ForegroundColor Red
    exit 1
}

# Create a modified startup script for testing
$testStartScript = "./BackEnd/test_start.sh"
@'
#!/bin/bash
# Test startup script

# Create test database directory
mkdir -p /app/data
touch /app/data/test.db
chmod 777 /app/data/test.db

# Create output directory
mkdir -p /app/output_tex_files
chmod 777 /app/output_tex_files

# Start application
exec uvicorn main:app --host 0.0.0.0 --port 8000
'@ | Out-File -FilePath $testStartScript -Encoding utf8 -NoNewline

# Run the container with environment variables mounted
Write-Host "Running Docker container..." -ForegroundColor Green
docker run -d `
    --name cv-backend `
    -p 8000:8000 `
    -v "${PWD}/BackEnd/output_tex_files:/app/output_tex_files" `
    --env-file ./BackEnd/.env.docker `
    cv-backend:local

# Wait for container to start
Write-Host "Waiting for container to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Check if container is running
$containerStatus = docker ps -f "name=cv-backend" --format "{{.Status}}"

if ($containerStatus) {
    Write-Host "Container is running successfully!" -ForegroundColor Green
    
    # Check if LaTeX is installed correctly
    Write-Host "Checking LaTeX installation..." -ForegroundColor Cyan
    $latexCheck = docker exec cv-backend bash -c "pdflatex --version" 2>$null
    
    if ($latexCheck -match "pdfTeX") {
        Write-Host "✓ LaTeX is installed correctly" -ForegroundColor Green
    } else {
        Write-Host "✗ LaTeX installation issue" -ForegroundColor Red
    }
    
    # Try to access the health endpoint
    try {
        $healthCheck = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5
        Write-Host "✓ Health endpoint is accessible: $($healthCheck | ConvertTo-Json)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Health endpoint not accessible: $_" -ForegroundColor Red
    }
    
    Write-Host "`nAPI is available at: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "Swagger documentation: http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "Health check: http://localhost:8000/health" -ForegroundColor Cyan
    
    # Open the browser to the API docs
    Start-Process "http://localhost:8000/docs"
} else {
    Write-Host "Container failed to start. Checking logs..." -ForegroundColor Red
    docker logs cv-backend
}

Write-Host "`nTo check container logs:" -ForegroundColor Yellow
Write-Host "docker logs cv-backend" -ForegroundColor Gray

Write-Host "To stop the container:" -ForegroundColor Yellow
Write-Host "docker stop cv-backend" -ForegroundColor Gray
