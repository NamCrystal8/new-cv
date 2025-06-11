#!/bin/bash
# This script starts the application in production
# PostgreSQL Optimized Startup Script

set -e  # Exit on error

echo "====== CV Generator Application Startup (PostgreSQL) ======"

# Ensure output directory exists
echo "Setting up output directory..."
mkdir -p output_tex_files
chmod 777 output_tex_files

# Print system and environment information
echo "====== Environment Information ======"
echo "Python version: $(python --version)"
echo "OS version: $(cat /etc/os-release | grep PRETTY_NAME || echo 'unknown')"
echo "Hostname: $(hostname)"
echo "Current directory: $(pwd)"
echo "Environment: ${ENVIRONMENT:-development}"

# Print installed packages for debugging
echo "====== Database Drivers ======"
pip list | grep -E 'sqlalchemy|psycopg2|asyncpg|greenlet' || echo "No database drivers found"

# Database connection string check (with sensitive info masked)
echo "====== PostgreSQL Database Configuration ======"
if [ ! -z "$DATABASE_URL" ]; then
  echo "Database URL is set and starts with: $(echo $DATABASE_URL | cut -d ':' -f 1)"

  # Check if we're using postgresql
  if [[ "$DATABASE_URL" == postgres* ]]; then
    echo "✅ Using PostgreSQL database"

    # Extract connection details for testing
    DB_HOST=$(echo $DATABASE_URL | sed -E 's/.*@([^:\/]+).*/\1/g' || echo "unknown")
    DB_PORT=$(echo $DATABASE_URL | sed -E 's/.*:([0-9]+)\/.*/\1/g' || echo "5432")

    echo "PostgreSQL host: $DB_HOST"
    echo "PostgreSQL port: $DB_PORT"

    # Test connection
    echo "Testing PostgreSQL connection..."
    timeout 10 nc -z -v $DB_HOST $DB_PORT && echo "✅ PostgreSQL connection successful" || echo "⚠️ PostgreSQL connection failed"
  else
    echo "⚠️ WARNING: Not using PostgreSQL database"
  fi
else
  echo "❌ ERROR: DATABASE_URL is not set!"
  exit 1
fi

# Test PostgreSQL connection
echo "====== Testing PostgreSQL Connection ======"
if [ -f "test_postgres_connection.py" ]; then
  echo "Testing PostgreSQL connection..."
  python test_postgres_connection.py || echo "⚠️ PostgreSQL connection test failed, but continuing..."
else
  echo "⚠️ PostgreSQL connection test script not found"
fi

# Initialize PostgreSQL database with proper schema
echo "====== PostgreSQL Database Initialization ======"
if [ -f "init_fresh_database.py" ]; then
  echo "Initializing PostgreSQL database with clean schema and default data..."
  echo "This will:"
  echo "  • Create PostgreSQL schema from current models"
  echo "  • Create roles: Admin (1), User (2)"
  echo "  • Create subscription plans: Free, Premium, Pro"
  echo "  • Establish all foreign key relationships"
  echo ""

  python init_fresh_database.py

  if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL database initialization completed successfully!"
  else
    echo "❌ PostgreSQL database initialization failed!"
    echo "⚠️ Application may not work correctly."
    exit 1
  fi
else
  echo "❌ ERROR: init_fresh_database.py not found"
  echo "⚠️ Database cannot be initialized."
  exit 1
fi

# Create admin user with FastAPI Users system
echo "====== Creating Admin User (FastAPI Users) ======"
if [ -f "create_admin_with_fastapi_users.py" ]; then
  echo "Creating admin user with FastAPI Users password system..."
  python create_admin_with_fastapi_users.py || echo "⚠️ Admin user creation failed, but continuing..."
else
  echo "⚠️ Admin user creation script not found"
fi

# Wait for database to be fully ready
echo "====== Starting Application ======"
echo "Waiting for PostgreSQL to be fully ready..."
sleep 3

# Get the PORT environment variable or default to 8000
PORT="${PORT:-8000}"

# Start the application with uvicorn
echo "Starting CV Generator application on port $PORT..."
echo "Database: PostgreSQL"
echo "Environment: ${ENVIRONMENT:-production}"
echo "========================================"
exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --log-level info