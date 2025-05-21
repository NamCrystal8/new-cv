#!/bin/bash
# This script runs during the build phase on Render.com

# Exit on error
set -e

# Install system dependencies including necessary LaTeX packages
echo "Installing system dependencies..."
apt-get update
apt-get install -y --no-install-recommends \
    libpq-dev \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-latex-extra \
    texlive-fonts-extra \
    latexmk \
    postgresql-client

# Clean up to reduce image size
apt-get clean
rm -rf /var/lib/apt/lists/*

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Print diagnostic information
echo "Checking installed database drivers:"
pip list | grep -E 'sqlalchemy|psycopg2|asyncpg|aiosqlite'
echo "Python version: $(python --version)"
echo "Build complete."

# Install PostgreSQL support
echo "Installing Python database drivers..."
pip install --no-cache-dir psycopg2-binary asyncpg

# Print TeX Live version for verification
echo "Installed TeX Live version:"
tex --version

echo "Build script completed successfully"
