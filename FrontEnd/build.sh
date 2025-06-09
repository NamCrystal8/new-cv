#!/bin/bash

# Frontend build script for Render deployment

echo "🚀 Starting frontend build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🔨 Building the application..."
npm run build

# Verify build output
if [ -d "dist" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build output directory: dist"
    ls -la dist/ || echo "Directory listing not available"
else
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "🎉 Frontend build process completed!"