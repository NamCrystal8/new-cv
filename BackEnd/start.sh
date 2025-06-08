#!/bin/bash
# This script starts the application in production

set -e  # Exit on error

echo "====== CV Generator Application Startup ======"

# Ensure output directory exists
echo "Setting up output directory..."
mkdir -p output_tex_files
chmod 777 output_tex_files

# Print system and environment information
echo "====== Environment Information ======"
echo "Python version:"
python --version
echo "OS version: $(cat /etc/os-release | grep PRETTY_NAME || echo 'unknown')"
echo "Hostname: $(hostname)"
echo "Current directory: $(pwd)"
echo "Directory listing:"
ls -la

# Print installed packages for debugging
echo "====== Database Drivers ======"
pip list | grep -E 'sqlalchemy|psycopg2|asyncpg|aiosqlite|greenlet'

# Database connection string check (with sensitive info masked)
echo "====== Database Configuration ======"
if [ ! -z "$DATABASE_URL" ]; then
  echo "Database URL is set and starts with: $(echo $DATABASE_URL | cut -d ':' -f 1)"
  
  # Check if we're using postgresql
  if [[ "$DATABASE_URL" == postgres* ]]; then
    echo "Using PostgreSQL database"
    
    # Try to test PostgreSQL connection
    DB_HOST=$(echo $DATABASE_URL | sed -E 's/.*@([^:]+):.*/\1/g' || echo "unknown")
    DB_PORT=$(echo $DATABASE_URL | sed -E 's/.*:([0-9]+).*/\1/g' || echo "5432")
    
    echo "Checking connection to PostgreSQL host: $DB_HOST on port: $DB_PORT"
    nc -z -v -w5 $DB_HOST $DB_PORT || echo "WARNING: Cannot connect to database host"
  fi
else
  echo "WARNING: DATABASE_URL is not set!"
fi

# Test database connection script if available
if [ -f "test_database.py" ]; then
  echo "====== Testing Database Connection ======"
  python test_database.py || echo "WARNING: Database connection test failed, but continuing startup..."
fi

# Wait a moment for database to be fully available
echo "====== Starting Application ======"
echo "Waiting for database connection..."
sleep 5

# Get the PORT environment variable or default to 8000
PORT="${PORT:-8000}"

# Start the application with uvicorn
echo "Starting application on port $PORT..."
echo "========================================"
exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --log-level debug