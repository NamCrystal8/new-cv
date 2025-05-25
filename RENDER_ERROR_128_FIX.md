# Troubleshooting Render Deployment Issues

This guide addresses common deployment issues with Render, including the Exit Status 128 error.

## Error 128 During Deployment

If you're seeing `==> Exited with status 128` during deployment, try these solutions:

### Solution 1: Deploy via Render Dashboard

Instead of using the CLI or render.yaml blueprint:

1. Log into [Render Dashboard](https://dashboard.render.com)
2. Click "New +" > "Web Service"
3. Connect your GitHub repository
4. Configure with these settings:
   - **Name**: new-cv-backend
   - **Environment**: Docker
   - **Docker Command**: ./start.sh
   - **Region**: Choose closest to you
   - **Branch**: main
   - **Root Directory**: BackEnd
   - **Health Check Path**: /health

### Solution 2: Check Permissions

Ensure your scripts have proper execute permissions:

```bash
git update-index --chmod=+x BackEnd/build.sh
git update-index --chmod=+x BackEnd/start.sh
git update-index --chmod=+x BackEnd/test_database.sh
git commit -m "Fix script permissions"
git push
```

### Solution 3: Verify Docker Configuration

1. Ensure all paths in your Dockerfile are correct
2. Check that dockerContext in render.yaml is properly set
3. Make sure your Docker build doesn't exceed resource limits

### Solution 4: Verify Database Configuration

1. Visit the `/debug/database` endpoint after deployment
2. Check logs for database connection errors
3. Ensure DATABASE_URL is properly formatted

### Solution 5: Contact Render Support

If problems persist:
1. Collect full logs from the Render dashboard
2. Check [Render Status](https://status.render.com/)
3. Contact Render support with your logs and error details

## Testing Your Docker Build Locally

Before deploying, test locally:

```powershell
# From project root
.\test-database-fix.ps1
.\docker-run-local.ps1
```

## Getting Additional Help

If you continue experiencing issues:
1. Review [Render's Troubleshooting Guide](https://render.com/docs/troubleshooting-deploys)
2. Check Docker logs carefully
3. Try deploying directly via the Render Dashboard UI
