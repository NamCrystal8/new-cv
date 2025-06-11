#!/bin/bash
# Fresh PostgreSQL Deployment Startup Script

set -e

echo "🚀 CV Generator - Fresh PostgreSQL Deployment"
echo "============================================="

# Setup application directories
echo "📁 Setting up application directories..."
mkdir -p output_tex_files
chmod 755 output_tex_files

# Environment verification
echo "🔍 Environment Verification:"
echo "   Python: $(python --version)"
echo "   Environment: ${ENVIRONMENT:-production}"
echo "   Port: ${PORT:-8000}"

# PostgreSQL connection verification
echo "🗄️ PostgreSQL Configuration:"
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set!"
    exit 1
fi

if [[ "$DATABASE_URL" == postgres* ]]; then
    echo "✅ PostgreSQL database configured"

    # Extract host and port for connection test
    DB_HOST=$(echo $DATABASE_URL | sed -E 's/.*@([^:\/]+).*/\1/g')
    DB_PORT=$(echo $DATABASE_URL | sed -E 's/.*:([0-9]+)\/.*/\1/g')

    echo "   Host: $DB_HOST"
    echo "   Port: $DB_PORT"

    # Test connection
    echo "   Testing connection..."
    timeout 15 nc -z $DB_HOST $DB_PORT && echo "   ✅ Connection successful" || {
        echo "   ⚠️ Connection test failed, but continuing..."
    }
else
    echo "❌ ERROR: Not a PostgreSQL database URL!"
    exit 1
fi

# Fresh database initialization
echo "🗄️ Fresh Database Initialization:"
if [ ! -f "fresh_deploy_init.py" ]; then
    echo "❌ ERROR: fresh_deploy_init.py not found!"
    exit 1
fi

echo "   Initializing fresh PostgreSQL deployment..."
echo "   • Creating schema from models"
echo "   • Setting up roles and plans"
echo "   • Creating admin user"

python fresh_deploy_init.py
if [ $? -eq 0 ]; then
    echo "   ✅ Fresh deployment initialization successful!"
else
    echo "   ❌ Fresh deployment initialization failed!"
    exit 1
fi

# Final startup
echo "🚀 Starting Application:"
PORT="${PORT:-8000}"
echo "   Port: $PORT"
echo "   Database: PostgreSQL (Fresh)"
echo "   Environment: ${ENVIRONMENT:-production}"
echo "   Admin: admin@cvbuilder.com / admin123"

# Start the FastAPI application
exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --log-level info