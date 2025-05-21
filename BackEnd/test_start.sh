#!/bin/bash
# Test startup script

# Create test database directory
mkdir -p /app/data
touch /app/data/test.db
chmod 777 /app/data/test.db

# Create output directory
mkdir -p /app/output_tex_files
chmod 777 /app/output_tex_files

# Start application
exec uvicorn main:app --host 0.0.0.0 --port 8000