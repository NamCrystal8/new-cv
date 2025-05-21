# This script builds and runs a simplified Docker container for quick testing
# It only tests if LaTeX works in the container without running your app

# Change to the project root directory
Set-Location -Path C:\DATN\new-cv

# Stop any running containers with the same name
Write-Host "Stopping any existing cv-backend-simple containers..." -ForegroundColor Yellow
docker stop cv-backend-simple 2>$null
docker rm cv-backend-simple 2>$null

# Build the Docker image with the simplified Dockerfile
Write-Host "Building Docker image with simplified Dockerfile..." -ForegroundColor Green
docker build -t cv-backend-simple:local -f ./BackEnd/Dockerfile.simple ./BackEnd

Write-Host "Starting container to verify LaTeX setup..." -ForegroundColor Cyan
docker run --name cv-backend-simple cv-backend-simple:local bash -c "ls -la /app/test.pdf && echo 'PDF was created successfully!'"

# Verify if the PDF was created
$success = $LASTEXITCODE -eq 0

if ($success) {
    Write-Host "SUCCESS! LaTeX is working correctly in the Docker container." -ForegroundColor Green
    
    # Copy the PDF from the container for inspection
    docker cp cv-backend-simple:/app/test.pdf ./docker-test.pdf
    
    if (Test-Path ./docker-test.pdf) {
        Write-Host "PDF copied to ./docker-test.pdf" -ForegroundColor Green
        Invoke-Item ./docker-test.pdf
    }
} else {
    Write-Host "FAILED: LaTeX compilation did not produce a PDF file." -ForegroundColor Red
    Write-Host "Checking container logs for more information:" -ForegroundColor Yellow
    docker logs cv-backend-simple
}

# Clean up
Write-Host "Cleaning up container..." -ForegroundColor Yellow
docker rm cv-backend-simple