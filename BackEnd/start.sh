#!/bin/bash
# This script starts the application in production

# Ensure output directory exists
mkdir -p output_tex_files
chmod 777 output_tex_files

# Wait a moment for database to be fully available
echo "Waiting for database connection..."
sleep 5

# Get the PORT environment variable or default to 8000
PORT="${PORT:-8000}"

# Start the application with uvicorn
echo "Starting application on port $PORT..."
exec uvicorn main:app --host 0.0.0.0 --port "$PORT"