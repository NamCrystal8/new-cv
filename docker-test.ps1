# This script tests the Docker container to verify functionality
# Run this after docker-run-local.ps1

# Change to the project root directory
Set-Location -Path C:\DATN\new-cv

# Variables
$baseUrl = "http://localhost:8000"
$healthEndpoint = "$baseUrl/health"
$docsEndpoint = "$baseUrl/docs"

# Check if the container is running
$containerRunning = docker ps -f "name=cv-backend" --format "{{.Status}}"
if (-not $containerRunning) {
    Write-Host "Container is not running! Please run docker-run-local.ps1 first." -ForegroundColor Red
    exit 1
}

# Function to test an endpoint
function Test-Endpoint {
    param (
        [string]$Url,
        [string]$Description
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ $Description is working! (Status: $($response.StatusCode))" -ForegroundColor Green
            return $true
        } else {
            Write-Host "✗ $Description returned status code $($response.StatusCode)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "✗ $Description failed: $_" -ForegroundColor Red
        return $false
    }
}

# Test health endpoint
Write-Host "Testing API health..." -ForegroundColor Cyan
$healthOk = Test-Endpoint -Url $healthEndpoint -Description "Health endpoint"

# Test Swagger documentation
Write-Host "Testing Swagger docs..." -ForegroundColor Cyan
$docsOk = Test-Endpoint -Url $docsEndpoint -Description "Swagger documentation"

# Check LaTeX installation in container
Write-Host "Checking LaTeX installation in container..." -ForegroundColor Cyan
$latexCheck = docker exec cv-backend pdflatex --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ LaTeX is properly installed in the container" -ForegroundColor Green
    $latexOk = $true
} else {
    Write-Host "✗ LaTeX installation check failed" -ForegroundColor Red
    $latexOk = $false
}

# Summary
Write-Host "`nTest Summary:" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan
Write-Host "API Health: $(if ($healthOk) { "OK" } else { "FAILED" })" -ForegroundColor $(if ($healthOk) { "Green" } else { "Red" })
Write-Host "Swagger Docs: $(if ($docsOk) { "OK" } else { "FAILED" })" -ForegroundColor $(if ($docsOk) { "Green" } else { "Red" })
Write-Host "LaTeX Installation: $(if ($latexOk) { "OK" } else { "FAILED" })" -ForegroundColor $(if ($latexOk) { "Green" } else { "Red" })

if ($healthOk -and $docsOk -and $latexOk) {
    Write-Host "`n✅ All tests passed! Your Docker container is ready for deployment." -ForegroundColor Green
} else {
    Write-Host "`n❌ Some tests failed. Please fix the issues before deploying." -ForegroundColor Red
}

Write-Host "`nContainer logs:" -ForegroundColor Yellow
docker logs cv-backend --tail 20
