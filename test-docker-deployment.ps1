# Docker Deployment Testing Script for Windows
# This script tests the entire application stack locally before Render deployment

param(
    [switch]$Clean,
    [switch]$Logs,
    [switch]$Stop,
    [switch]$Test
)

# Colors for output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status {
    param($Message, $Color = "White")
    Write-Host "🔍 $Message" -ForegroundColor $Color
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️ $Message" -ForegroundColor $Yellow
}

function Write-Info {
    param($Message)
    Write-Host "ℹ️ $Message" -ForegroundColor $Blue
}

Write-Host "🐳 Docker Deployment Testing" -ForegroundColor $Blue
Write-Host "=============================" -ForegroundColor $Blue

# Check if Docker is running
Write-Status "Checking Docker status..."
try {
    docker version | Out-Null
    Write-Success "Docker is running"
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop."
    exit 1
}

# Handle different operations
if ($Stop) {
    Write-Status "Stopping all services..."
    docker-compose -f docker-compose.test.yml down
    Write-Success "Services stopped"
    exit 0
}

if ($Clean) {
    Write-Status "Cleaning up containers and volumes..."
    docker-compose -f docker-compose.test.yml down -v --remove-orphans
    docker system prune -f
    Write-Success "Cleanup completed"
    exit 0
}

if ($Logs) {
    Write-Status "Showing service logs..."
    docker-compose -f docker-compose.test.yml logs -f
    exit 0
}

# Check environment file
if (-not (Test-Path ".env.test.local")) {
    Write-Warning "Environment file .env.test.local not found"
    Write-Info "Please copy .env.test to .env.test.local and fill in your API keys"
    Write-Info "Required variables:"
    Write-Host "  - CLOUDINARY_CLOUD_NAME" -ForegroundColor $Yellow
    Write-Host "  - CLOUDINARY_API_KEY" -ForegroundColor $Yellow
    Write-Host "  - CLOUDINARY_API_SECRET" -ForegroundColor $Yellow
    Write-Host "  - GOOGLE_GEMINI_API_KEY" -ForegroundColor $Yellow
    Write-Host "  - JWT_SECRET" -ForegroundColor $Yellow
    
    $continue = Read-Host "Continue with test values? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Load environment variables if file exists
if (Test-Path ".env.test.local") {
    Write-Status "Loading environment variables from .env.test.local..."
    Get-Content ".env.test.local" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
    Write-Success "Environment variables loaded"
}

# Build and start services
Write-Status "Building and starting services..."
Write-Info "This may take several minutes on first run..."

try {
    # Start services
    docker-compose -f docker-compose.test.yml up -d --build
    
    Write-Success "Services started successfully"
    Write-Info "Waiting for services to be ready..."
    
    # Wait for backend to be healthy
    $maxAttempts = 30
    $attempt = 0
    
    do {
        Start-Sleep 10
        $attempt++
        Write-Status "Checking backend health (attempt $attempt/$maxAttempts)..."
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Success "Backend is healthy!"
                break
            }
        } catch {
            if ($attempt -eq $maxAttempts) {
                Write-Error "Backend failed to start after $maxAttempts attempts"
                Write-Info "Check logs with: .\test-docker-deployment.ps1 -Logs"
                exit 1
            }
        }
    } while ($attempt -lt $maxAttempts)
    
    # Check frontend
    Write-Status "Checking frontend..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "Frontend is accessible!"
        }
    } catch {
        Write-Warning "Frontend may not be ready yet"
    }
    
} catch {
    Write-Error "Failed to start services: $_"
    Write-Info "Check logs with: docker-compose -f docker-compose.test.yml logs"
    exit 1
}

# Run tests if requested
if ($Test) {
    Write-Status "Running deployment tests..."
    
    # Test database connection
    Write-Status "Testing database connection..."
    docker-compose -f docker-compose.test.yml exec backend python verify_fresh_deployment.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database tests passed!"
    } else {
        Write-Error "Database tests failed!"
    }
}

# Display service information
Write-Host ""
Write-Host "🎉 Local Docker Testing Environment Ready!" -ForegroundColor $Green
Write-Host "==========================================" -ForegroundColor $Green
Write-Host ""
Write-Host "📊 Service URLs:" -ForegroundColor $Blue
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor $Yellow
Write-Host "  Backend:   http://localhost:8000" -ForegroundColor $Yellow
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor $Yellow
Write-Host "  Health:    http://localhost:8000/health" -ForegroundColor $Yellow
Write-Host ""
Write-Host "👤 Admin Login:" -ForegroundColor $Blue
Write-Host "  Email:     admin@cvbuilder.com" -ForegroundColor $Yellow
Write-Host "  Password:  admin123" -ForegroundColor $Yellow
Write-Host ""
Write-Host "🔧 Management Commands:" -ForegroundColor $Blue
Write-Host "  View logs:     .\test-docker-deployment.ps1 -Logs" -ForegroundColor $Yellow
Write-Host "  Run tests:     .\test-docker-deployment.ps1 -Test" -ForegroundColor $Yellow
Write-Host "  Stop services: .\test-docker-deployment.ps1 -Stop" -ForegroundColor $Yellow
Write-Host "  Clean up:      .\test-docker-deployment.ps1 -Clean" -ForegroundColor $Yellow
Write-Host ""
Write-Host "🗄️ Database:" -ForegroundColor $Blue
Write-Host "  Host:      localhost:5433" -ForegroundColor $Yellow
Write-Host "  Database:  new_cv" -ForegroundColor $Yellow
Write-Host "  User:      postgres" -ForegroundColor $Yellow
Write-Host "  Password:  testpassword123" -ForegroundColor $Yellow
