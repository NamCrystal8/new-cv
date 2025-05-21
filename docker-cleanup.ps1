# This script stops and removes the Docker container and image

# Change to the project root directory
Set-Location -Path C:\DATN\new-cv

Write-Host "Stopping and removing container..." -ForegroundColor Yellow
docker stop cv-backend 2>$null
docker rm cv-backend 2>$null

$removeImage = Read-Host "Do you also want to remove the Docker image? (y/n)"
if ($removeImage -eq "y" -or $removeImage -eq "Y") {
    Write-Host "Removing Docker image..." -ForegroundColor Yellow
    docker rmi cv-backend:local 2>$null
}

Write-Host "Cleanup complete!" -ForegroundColor Green
