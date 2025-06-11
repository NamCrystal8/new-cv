#!/bin/bash
# Docker Deployment Testing Script for Linux/Mac
# This script tests the entire application stack locally before Render deployment

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${BLUE}🔍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Parse arguments
CLEAN=false
LOGS=false
STOP=false
TEST=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN=true
            shift
            ;;
        --logs)
            LOGS=true
            shift
            ;;
        --stop)
            STOP=true
            shift
            ;;
        --test)
            TEST=true
            shift
            ;;
        *)
            echo "Unknown option $1"
            echo "Usage: $0 [--clean|--logs|--stop|--test]"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🐳 Docker Deployment Testing${NC}"
echo -e "${BLUE}=============================${NC}"

# Check if Docker is running
print_status "Checking Docker status..."
if ! docker version >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker."
    exit 1
fi
print_success "Docker is running"

# Handle different operations
if [ "$STOP" = true ]; then
    print_status "Stopping all services..."
    docker-compose -f docker-compose.test.yml down
    print_success "Services stopped"
    exit 0
fi

if [ "$CLEAN" = true ]; then
    print_status "Cleaning up containers and volumes..."
    docker-compose -f docker-compose.test.yml down -v --remove-orphans
    docker system prune -f
    print_success "Cleanup completed"
    exit 0
fi

if [ "$LOGS" = true ]; then
    print_status "Showing service logs..."
    docker-compose -f docker-compose.test.yml logs -f
    exit 0
fi

# Check environment file
if [ ! -f ".env.test.local" ]; then
    print_warning "Environment file .env.test.local not found"
    print_info "Please copy .env.test to .env.test.local and fill in your API keys"
    print_info "Required variables:"
    echo -e "  ${YELLOW}- CLOUDINARY_CLOUD_NAME${NC}"
    echo -e "  ${YELLOW}- CLOUDINARY_API_KEY${NC}"
    echo -e "  ${YELLOW}- CLOUDINARY_API_SECRET${NC}"
    echo -e "  ${YELLOW}- GOOGLE_GEMINI_API_KEY${NC}"
    echo -e "  ${YELLOW}- JWT_SECRET${NC}"
    
    read -p "Continue with test values? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Load environment variables if file exists
if [ -f ".env.test.local" ]; then
    print_status "Loading environment variables from .env.test.local..."
    export $(grep -v '^#' .env.test.local | xargs)
    print_success "Environment variables loaded"
fi

# Build and start services
print_status "Building and starting services..."
print_info "This may take several minutes on first run..."

# Start services
docker-compose -f docker-compose.test.yml up -d --build

print_success "Services started successfully"
print_info "Waiting for services to be ready..."

# Wait for backend to be healthy
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    sleep 10
    attempt=$((attempt + 1))
    print_status "Checking backend health (attempt $attempt/$max_attempts)..."
    
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        print_success "Backend is healthy!"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Backend failed to start after $max_attempts attempts"
        print_info "Check logs with: ./test-docker-deployment.sh --logs"
        exit 1
    fi
done

# Check frontend
print_status "Checking frontend..."
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    print_success "Frontend is accessible!"
else
    print_warning "Frontend may not be ready yet"
fi

# Run tests if requested
if [ "$TEST" = true ]; then
    print_status "Running deployment tests..."
    
    # Test database connection
    print_status "Testing database connection..."
    if docker-compose -f docker-compose.test.yml exec backend python verify_fresh_deployment.py; then
        print_success "Database tests passed!"
    else
        print_error "Database tests failed!"
    fi
fi

# Display service information
echo ""
echo -e "${GREEN}🎉 Local Docker Testing Environment Ready!${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""
echo -e "${BLUE}📊 Service URLs:${NC}"
echo -e "  ${YELLOW}Frontend:  http://localhost:3000${NC}"
echo -e "  ${YELLOW}Backend:   http://localhost:8000${NC}"
echo -e "  ${YELLOW}API Docs:  http://localhost:8000/docs${NC}"
echo -e "  ${YELLOW}Health:    http://localhost:8000/health${NC}"
echo ""
echo -e "${BLUE}👤 Admin Login:${NC}"
echo -e "  ${YELLOW}Email:     admin@cvbuilder.com${NC}"
echo -e "  ${YELLOW}Password:  admin123${NC}"
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo -e "  ${YELLOW}View logs:     ./test-docker-deployment.sh --logs${NC}"
echo -e "  ${YELLOW}Run tests:     ./test-docker-deployment.sh --test${NC}"
echo -e "  ${YELLOW}Stop services: ./test-docker-deployment.sh --stop${NC}"
echo -e "  ${YELLOW}Clean up:      ./test-docker-deployment.sh --clean${NC}"
echo ""
echo -e "${BLUE}🗄️ Database:${NC}"
echo -e "  ${YELLOW}Host:      localhost:5433${NC}"
echo -e "  ${YELLOW}Database:  new_cv${NC}"
echo -e "  ${YELLOW}User:      postgres${NC}"
echo -e "  ${YELLOW}Password:  testpassword123${NC}"
