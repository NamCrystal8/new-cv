# Deployment Configuration

This directory contains all deployment-related files and configurations for the CV Generator backend.

## Directory Structure

```
deployment/
├── README.md                    # This file
├── Dockerfile                   # Production Docker configuration
├── Dockerfile.simple            # Simplified Docker configuration
├── render.yaml                  # Render.com deployment configuration
├── Procfile                     # Process configuration for Heroku-style deployments
├── build.sh                     # Build script for Render deployment
├── start.sh                     # Production startup script
├── start_simple.sh              # Simplified startup script
├── check_deployment.py          # Deployment verification script
├── fresh_deploy_init.py         # Fresh deployment initialization
├── verify_fresh_deployment.py   # Post-deployment verification
├── test_admin_login.py          # Admin authentication testing
├── test_auth_config.py          # Authentication configuration testing
├── test_postgres_connection.py  # Database connection testing
└── test_production_auth.py      # Production authentication testing
```

## Usage

### Local Development with Docker

```bash
# Build the Docker image
cd BackEnd
docker build -f deployment/Dockerfile -t cv-generator-backend .

# Run the container
docker run -p 8000:8000 cv-generator-backend
```

### Render.com Deployment

1. Ensure all scripts are executable:
   ```bash
   chmod +x deployment/*.sh
   ```

2. Deploy using the deployment script:
   ```bash
   # From project root
   ./deploy-to-render.sh
   ```

3. Or deploy manually using Render CLI:
   ```bash
   cd BackEnd/deployment
   render blueprint launch
   ```

### Environment Variables

The following environment variables need to be configured in your deployment platform:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `GOOGLE_GEMINI_API_KEY` - Google Gemini API key
- `FRONTEND_URL` - Frontend application URL
- `ENVIRONMENT` - Set to "production" for production deployments

### Testing Deployment

After deployment, run the verification scripts:

```bash
# Test database connection
python deployment/test_postgres_connection.py

# Test authentication configuration
python deployment/test_auth_config.py

# Test admin login functionality
python deployment/test_admin_login.py

# Comprehensive deployment verification
python deployment/verify_fresh_deployment.py
```

### Troubleshooting

1. **Build failures**: Check the build.sh script and ensure all dependencies are properly installed
2. **Startup issues**: Review the start_simple.sh script and verify environment variables
3. **Database connection**: Use test_postgres_connection.py to verify database connectivity
4. **Authentication problems**: Run test_auth_config.py to check authentication setup

## File Descriptions

- **Dockerfile**: Main production Docker configuration with all dependencies
- **Dockerfile.simple**: Simplified Docker configuration for basic deployments
- **render.yaml**: Complete Render.com service configuration including database setup
- **build.sh**: Installs system dependencies and Python packages for Render deployment
- **start_simple.sh**: Minimal startup script that starts the FastAPI application
- **Procfile**: Process configuration for Heroku-style platforms
- **check_deployment.py**: Validates deployment configuration and environment
- **fresh_deploy_init.py**: Initializes a fresh deployment with required setup
- **verify_fresh_deployment.py**: Comprehensive post-deployment verification

## Notes

- All scripts are designed to work with Render.com's deployment environment
- The Docker configuration includes LaTeX support for PDF generation
- Database migrations are handled automatically on startup
- Health checks are configured for monitoring deployment status
