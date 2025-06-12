#!/bin/bash
# Fresh PostgreSQL Deployment Build Script for Render.com

set -e

echo "🚀 Fresh PostgreSQL Deployment Build"
echo "===================================="

# Install system dependencies
echo "📦 Installing system dependencies..."
apt-get update
apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    postgresql-client \
    netcat-openbsd \
    curl \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-latex-extra \
    texlive-fonts-extra \
    latexmk

# Clean up
apt-get clean
rm -rf /var/lib/apt/lists/*

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip install --upgrade pip
pip install --no-cache-dir -r requirements.txt

# Verify PostgreSQL drivers
echo "🗄️ Verifying PostgreSQL drivers..."
pip list | grep -E 'psycopg2|asyncpg' || echo "Installing PostgreSQL drivers..."
pip install --no-cache-dir psycopg2-binary>=2.9.0 asyncpg>=0.27.0

# Build verification
echo "✅ Build Verification:"
echo "   Python: $(python --version)"
echo "   PostgreSQL client: $(psql --version | head -n1)"
echo "   LaTeX: $(tex --version | head -n1)"

echo "🎉 Build completed successfully!"
