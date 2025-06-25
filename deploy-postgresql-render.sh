#!/bin/bash
# PostgreSQL Render Deployment Helper Script

set -e

echo "🚀 Fresh PostgreSQL Render Deployment Helper"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    print_error "render.yaml not found. Please run this script from the project root directory."
    exit 1
fi

print_info "Checking deployment configuration..."

# Check if required files exist
required_files=(
    "render.yaml"
    "BackEnd/Dockerfile"
    "BackEnd/build.sh"
    "BackEnd/start.sh"
    "BackEnd/requirements.txt"
    "BackEnd/fresh_deploy_init.py"
    "BackEnd/verify_fresh_deployment.py"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "Found $file"
    else
        print_error "Missing required file: $file"
        exit 1
    fi
done

# Check if scripts are executable
scripts=(
    "BackEnd/build.sh"
    "BackEnd/start.sh"
)

for script in "${scripts[@]}"; do
    if [ -x "$script" ]; then
        print_status "$script is executable"
    else
        print_warning "$script is not executable, fixing..."
        chmod +x "$script"
        print_status "Made $script executable"
    fi
done

# Check requirements.txt for PostgreSQL dependencies
print_info "Checking PostgreSQL dependencies..."

if grep -q "psycopg2-binary" BackEnd/requirements.txt; then
    print_status "psycopg2-binary found in requirements.txt"
else
    print_error "psycopg2-binary not found in requirements.txt"
    exit 1
fi

if grep -q "asyncpg" BackEnd/requirements.txt; then
    print_status "asyncpg found in requirements.txt"
else
    print_error "asyncpg not found in requirements.txt"
    exit 1
fi

# Check if .env file exists and warn about environment variables
if [ -f "BackEnd/.env" ]; then
    print_warning "Local .env file found. Remember to set environment variables in Render dashboard:"
    echo ""
    echo "Required environment variables for Render:"
    echo "- CLOUDINARY_CLOUD_NAME"
    echo "- CLOUDINARY_API_KEY"
    echo "- CLOUDINARY_API_SECRET"
    echo "- GOOGLE_GEMINI_API_KEY"
    echo "- JWT_SECRET"
    echo "- FRONTEND_URL (after frontend deployment)"
    echo ""
fi

# Check git status
print_info "Checking git status..."

if git status --porcelain | grep -q .; then
    print_warning "You have uncommitted changes. Consider committing them before deployment."
    git status --short
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled."
        exit 0
    fi
fi

# Check if we're on the main/master branch
current_branch=$(git branch --show-current)
if [[ "$current_branch" != "main" && "$current_branch" != "master" ]]; then
    print_warning "You're not on the main/master branch (current: $current_branch)"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled."
        exit 0
    fi
fi

# Push to GitHub if needed
if git status --porcelain | grep -q .; then
    print_info "Committing and pushing changes..."
    git add .
    git commit -m "PostgreSQL deployment configuration update"
    git push origin "$current_branch"
    print_status "Changes pushed to GitHub"
fi

print_status "Pre-deployment checks completed!"
echo ""
print_info "Next steps for Render deployment:"
echo ""
echo "1. 📊 Create PostgreSQL Database:"
echo "   - Go to render.com dashboard"
echo "   - Click 'New +' → 'PostgreSQL'"
echo "   - Name: new-cv-db"
echo "   - Database Name: new_cv"
echo "   - Plan: Free"
echo ""
echo "2. 🌐 Create Backend Web Service:"
echo "   - Click 'New +' → 'Web Service'"
echo "   - Connect GitHub repository"
echo "   - Name: new-cv-backend"
echo "   - Environment: Docker"
echo "   - Dockerfile Path: ./BackEnd/Dockerfile"
echo "   - Docker Context: ./BackEnd"
echo ""
echo "3. 🎨 Create Frontend Web Service:"
echo "   - Click 'New +' → 'Web Service'"
echo "   - Connect GitHub repository"
echo "   - Name: new-cv-frontend"
echo "   - Environment: Node"
echo "   - Root Directory: FrontEnd"
echo ""
echo "4. ⚙️ Set Environment Variables:"
echo "   - DATABASE_URL: (auto-configured from database)"
echo "   - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
echo "   - GOOGLE_GEMINI_API_KEY"
echo "   - JWT_SECRET"
echo "   - FRONTEND_URL (after frontend deployment)"
echo ""
echo "5. 🔍 Test Deployment:"
echo "   - Check health endpoint: https://your-backend.onrender.com/health"
echo "   - Login with admin@cvbuilder.com / admin123"
echo ""
print_status "Deployment configuration is ready!"
print_info "See RENDER_POSTGRESQL_DEPLOYMENT.md for detailed instructions."
