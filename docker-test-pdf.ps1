# This script tests PDF generation in the Docker container
# Run this after docker-run-local.ps1

# Change to the project root directory
Set-Location -Path C:\DATN\new-cv

# Check if the container is running
$containerRunning = docker ps -f "name=cv-backend" --format "{{.Status}}"
if (-not $containerRunning) {
    Write-Host "Container is not running! Please run docker-run-local.ps1 first." -ForegroundColor Red
    exit 1
}

# Create a simple test LaTeX file
$testTexContent = @"
\documentclass{article}
\begin{document}
Hello World! This is a test document to verify LaTeX compilation.
\end{document}
"@

Write-Host "Creating test LaTeX file in container..." -ForegroundColor Cyan
$testTexContent | docker exec -i cv-backend bash -c "cat > /app/output_tex_files/test.tex"

# Attempt to compile the LaTeX file
Write-Host "Attempting to compile LaTeX to PDF..." -ForegroundColor Cyan
docker exec cv-backend bash -c "cd /app/output_tex_files && pdflatex -interaction=nonstopmode test.tex"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ LaTeX compilation successful!" -ForegroundColor Green
    
    # Check if the PDF was created
    $pdfExists = docker exec cv-backend bash -c "[ -f /app/output_tex_files/test.pdf ] && echo 'exists' || echo 'missing'"
    
    if ($pdfExists -eq "exists") {
        Write-Host "✓ PDF file was created successfully" -ForegroundColor Green
        
        # Copy the PDF to a local directory for verification
        Write-Host "Copying PDF to local directory for verification..." -ForegroundColor Cyan
        docker cp cv-backend:/app/output_tex_files/test.pdf ./test-output.pdf
        
        if (Test-Path "./test-output.pdf") {
            Write-Host "✓ PDF copied successfully to ./test-output.pdf" -ForegroundColor Green
            Write-Host "Opening PDF for verification..." -ForegroundColor Cyan
            Invoke-Item "./test-output.pdf"
        } else {
            Write-Host "✗ Failed to copy PDF to local directory" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ PDF file was not created" -ForegroundColor Red
    }
} else {
    Write-Host "✗ LaTeX compilation failed" -ForegroundColor Red
    
    # Show the log file for debugging
    Write-Host "`nLaTeX Log File:" -ForegroundColor Yellow
    docker exec cv-backend bash -c "cat /app/output_tex_files/test.log"
}

Write-Host "`nTo stop the container:" -ForegroundColor Yellow
Write-Host "docker stop cv-backend" -ForegroundColor Gray
