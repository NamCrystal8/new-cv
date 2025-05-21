#!/bin/bash
# A helper script to deploy to Render

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Preparing to deploy CV Generator to Render...${NC}"

# Check if render-cli is installed
if ! command -v render &> /dev/null
then
    echo -e "${YELLOW}Render CLI not found. Installing...${NC}"
    npm install -g @renderinc/cli
fi

# Verify the render.yaml file exists
if [ ! -f "render.yaml" ]; then
    echo "Error: render.yaml file not found in current directory!"
    exit 1
fi

echo -e "${YELLOW}Logging in to Render...${NC}"
render login

echo -e "${YELLOW}Deploying using Blueprint...${NC}"
render blueprint launch

echo -e "${GREEN}Deployment initiated! Check your Render dashboard for progress.${NC}"
echo "Visit: https://dashboard.render.com to monitor your deployment."

echo -e "${YELLOW}Important: Set these environment variables in your Render dashboard:${NC}"
echo "- JWT_SECRET"
echo "- CLOUDINARY_CLOUD_NAME"
echo "- CLOUDINARY_API_KEY"
echo "- CLOUDINARY_API_SECRET" 
echo "- GOOGLE_GEMINI_API_KEY"
echo "- FRONTEND_URL (if you have a separate frontend)"
