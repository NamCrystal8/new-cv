#!/bin/bash
# Script to test database connection in a Render environment

echo "Testing database connection..."
python test_database.py

# If the test fails, show additional diagnostic information
if [ $? -ne 0 ]; then
  echo "Database test failed. Collecting diagnostic information..."
  
  # Check environment variables (hiding sensitive data)
  echo "Environment variables:"
  env | grep -i -E 'DATABASE|POSTGRES|SQL' | sed 's/\(.*=\).*@.*/\1****@****/'
  
  # Check if PostgreSQL is accessible (if using PostgreSQL)
  if [[ "$DATABASE_URL" == postgres* ]]; then
    echo "Checking PostgreSQL connectivity with psql..."
    
    # Extract host and port from DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -E 's/.*@([^:]+):.*/\1/')
    DB_PORT=$(echo $DATABASE_URL | sed -E 's/.*:([0-9]+).*/\1/')
    
    echo "Attempting to connect to $DB_HOST on port $DB_PORT..."
    nc -zv $DB_HOST $DB_PORT
  fi
fi

echo "Database test script complete."
