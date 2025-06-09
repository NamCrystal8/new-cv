#!/bin/bash

# Setup script for creating admin user on Render

echo "🚀 Setting up admin user for CV Builder..."

# Run the admin creation script
python create_admin_simple.py

echo "✅ Admin setup completed!"
echo ""
echo "📋 Default Admin Credentials:"
echo "Email: admin@cvbuilder.com"
echo "Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Change the password after first login!"
echo "🔗 Access admin panel at: https://your-frontend-url.onrender.com/admin"
