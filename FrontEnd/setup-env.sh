#!/bin/bash

# Setup environment for frontend deployment

echo "🔧 Setting up frontend environment..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "✅ .env file created. Please update VITE_API_BASE_URL with your backend URL."
else
    echo "ℹ️  .env file already exists."
fi

# Make scripts executable
echo "🔐 Making scripts executable..."
chmod +x build.sh
chmod +x start.sh
chmod +x setup-env.sh

echo "✅ Frontend environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your backend URL"
echo "2. Run 'npm install' to install dependencies"
echo "3. Run 'npm run dev' for local development"
echo "4. Deploy to Render using the deployment guide"
