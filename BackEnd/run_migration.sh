#!/bin/bash

# Script to manually run database migration

echo "🚀 Running Database Migration..."
echo "================================"

# Check if migration script exists
if [ ! -f "migrate_database.py" ]; then
    echo "❌ migrate_database.py not found!"
    exit 1
fi

# Run the migration
echo "📋 Executing database migration..."
python migrate_database.py

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully!"
    echo ""
    echo "📋 What was updated:"
    echo "- Database schema updated to match current models"
    echo "- Missing tables created"
    echo "- Admin user created (admin@cvbuilder.com / admin123)"
    echo "- Default subscription plans added"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Restart your application"
    echo "2. Test user registration and login"
    echo "3. Access admin panel at /admin"
else
    echo "❌ Database migration failed!"
    echo "Check the error messages above for details."
    exit 1
fi
