# LaTeX-only test script
# This just tests if LaTeX works in the Docker environment without any Python/database

# Change to the project root directory
Set-Location -Path C:\DATN\new-cv

# Create a temporary Dockerfile for LaTeX testing
$tempDockerfilePath = "./temp-latex-test/Dockerfile"
New-Item -Path "./temp-latex-test" -ItemType Directory -Force | Out-Null

# Create a test LaTeX file first
$testLatexPath = "./temp-latex-test/test.tex"
@'
\documentclass{article}
\begin{document}
Hello from Docker! This is a test document to verify LaTeX is working correctly.
\end{document}
'@ | Out-File -FilePath $testLatexPath -Encoding utf8

# Create the Dockerfile that uses the test.tex file
@'
FROM ubuntu:latest

# Install TeX Live
RUN apt-get update && apt-get install -y \
    texlive-latex-base \
    texlive-fonts-recommended

WORKDIR /app

# Copy the test.tex file
COPY test.tex .

# Compile the test document
RUN pdflatex test.tex || cat test.log

# The test.pdf file should be created if LaTeX works correctly
'@ | Out-File -FilePath $tempDockerfilePath -Encoding utf8

# Build and run the test container
Write-Host "Building LaTeX test container..." -ForegroundColor Cyan
docker build -t latex-test:local ./temp-latex-test

# Start a container and keep it running
Write-Host "Starting test container..." -ForegroundColor Cyan
docker run --name latex-test-container -d latex-test:local tail -f /dev/null

# Check if PDF was created
Write-Host "Checking if PDF was generated..." -ForegroundColor Cyan
$pdfExists = docker exec latex-test-container bash -c "ls -la /app/test.pdf 2>/dev/null || echo 'PDF not found'"

if ($pdfExists -notmatch "PDF not found") {
    Write-Host "PDF was created successfully!" -ForegroundColor Green
    # Copy PDF from container
    docker cp latex-test-container:/app/test.pdf ./latex-test.pdf
    
    Write-Host "PDF copied to ./latex-test.pdf" -ForegroundColor Green
    # Open the PDF
    if (Test-Path ./latex-test.pdf) {
        Invoke-Item ./latex-test.pdf
    }
} else {
    Write-Host "Failed to create PDF. Showing log file:" -ForegroundColor Red
    docker exec latex-test-container bash -c "cat /app/test.log 2>/dev/null || echo 'Log file not found'"
}

# Clean up
Write-Host "Cleaning up resources..." -ForegroundColor Yellow
docker stop latex-test-container
docker rm latex-test-container
Remove-Item -Recurse -Force ./temp-latex-test -ErrorAction SilentlyContinue
