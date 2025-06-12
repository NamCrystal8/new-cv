#!/bin/bash
# Simple startup script for Render deployment
# Minimal initialization, just start the application

set -e

echo "🚀 CV Generator - Simple Startup"
echo "================================"

# Setup application directories
echo "📁 Setting up directories..."
mkdir -p output_tex_files
chmod 755 output_tex_files

# Environment verification
echo "🔍 Environment check:"
echo "   Python: $(python --version)"
echo "   Port: ${PORT:-8000}"

# Database check
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set!"
    exit 1
fi

echo "✅ Database URL configured"

# Start the application directly
PORT="${PORT:-8000}"
echo "🚀 Starting FastAPI application..."
echo "   Port: $PORT"
echo "   Environment: ${ENVIRONMENT:-production}"
echo ""
echo "📋 After startup, you can:"
echo "   • Check health: /health"
echo "   • View API docs: /docs"
echo "   • Create admin: /setup/create-admin"
echo "   • Check status: /setup/status"
echo ""

# Start the FastAPI application
exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --log-level info
