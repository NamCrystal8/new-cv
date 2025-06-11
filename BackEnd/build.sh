#!/bin/bash
# This script runs during the build phase on Render.com
# PostgreSQL Optimized Build Script

# Exit on error
set -e

echo "====== PostgreSQL-Optimized Build Script ======"

# Install system dependencies including necessary LaTeX packages
echo "Installing system dependencies..."
apt-get update
apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    postgresql-client \
    netcat-openbsd \
    curl \
    git \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-latex-extra \
    texlive-fonts-extra \
    latexmk

# Clean up to reduce image size
apt-get clean
rm -rf /var/lib/apt/lists/*

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Ensure PostgreSQL drivers are installed
echo "Ensuring PostgreSQL drivers are installed..."
pip install --no-cache-dir psycopg2-binary>=2.9.0 asyncpg>=0.27.0

# Print diagnostic information
echo "====== Build Diagnostics ======"
echo "Python version: $(python --version)"
echo "Pip version: $(pip --version)"

echo "Checking installed database drivers:"
pip list | grep -E 'sqlalchemy|psycopg2|asyncpg|greenlet'

echo "Installed TeX Live version:"
tex --version || echo "TeX Live not available"

echo "PostgreSQL client version:"
psql --version || echo "PostgreSQL client not available"

echo "====== Build completed successfully ======"
