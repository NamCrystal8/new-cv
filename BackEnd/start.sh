#!/bin/bash
# This script starts the application in production

# Ensure output directory exists
mkdir -p output_tex_files
chmod 777 output_tex_files

# Print Python version for debugging
echo "Python version:"
python --version

# Print installed packages for debugging
echo "Installed Python packages:"
pip list | grep -E 'sqlalchemy|psycopg2|asyncpg|aiosqlite|greenlet'

# Database connection string check (with sensitive info masked)
if [ ! -z "$DATABASE_URL" ]; then
  echo "Database URL is set and starts with: $(echo $DATABASE_URL | cut -d ':' -f 1)"
  
  # Check if we're using postgresql
  if [[ "$DATABASE_URL" == postgres* ]]; then
    echo "Using PostgreSQL database"
    
    # Install postgresql client for debugging if needed
    apt-get update -y && apt-get install -y postgresql-client
  fi
else
  echo "WARNING: DATABASE_URL is not set!"
fi

# Wait a moment for database to be fully available
echo "Waiting for database connection..."
sleep 5

# Get the PORT environment variable or default to 8000
PORT="${PORT:-8000}"

# Start the application with uvicorn
echo "Starting application on port $PORT..."
exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --log-level debug