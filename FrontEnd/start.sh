#!/bin/bash

# Start the frontend application
echo "🚀 Starting frontend application..."

# Install serve globally if not already installed
echo "📦 Installing serve package..."
npm install -g serve

# Serve the built application
echo "🌐 Serving application on port $PORT..."
serve -s dist -l $PORT