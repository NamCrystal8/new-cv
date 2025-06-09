# Frontend Deployment Guide for Render

This guide will help you deploy your React frontend to Render's free tier.

## Prerequisites

1. Your backend should already be deployed on Render
2. You have a Render account
3. Your code is pushed to a Git repository (GitHub, GitLab, etc.)

## Deployment Options

### Option 1: Deploy Both Frontend and Backend Together (Recommended)

This uses the updated `render.yaml` file to deploy both services at once.

#### Steps:

1. **Update Environment Variables**
   - Go to your Render dashboard
   - Find your existing backend service
   - Copy the backend service URL (something like `https://your-backend-app.onrender.com`)

2. **Deploy Using Blueprint**
   - In Render dashboard, click "New" → "Blueprint"
   - Connect your repository
   - Render will detect the updated `render.yaml`
   - Set the environment variable:
     - `VITE_API_BASE_URL`: Your backend URL (e.g., `https://your-backend-app.onrender.com`)

3. **Apply the Blueprint**
   - Click "Apply" to deploy both services
   - Wait for both services to build and deploy

### Option 2: Deploy Frontend Separately

If you prefer to deploy the frontend as a separate service:

#### Steps:

1. **Create New Web Service**
   - In Render dashboard, click "New" → "Web Service"
   - Connect your repository
   - Set the following:
     - **Name**: `new-cv-frontend` (or your preferred name)
     - **Environment**: `Node`
     - **Root Directory**: `FrontEnd`
     - **Build Command**: `chmod +x ./build.sh && ./build.sh`
     - **Start Command**: `chmod +x ./start.sh && ./start.sh`

2. **Set Environment Variables**
   - Add environment variable:
     - `VITE_API_BASE_URL`: Your backend URL (e.g., `https://your-backend-app.onrender.com`)

3. **Deploy**
   - Click "Create Web Service"
   - Wait for the build and deployment to complete

## Important Configuration Notes

### Backend CORS Configuration

Make sure your backend allows requests from your frontend domain. Update the `FRONTEND_URL` environment variable in your backend service to include your frontend URL.

### API Calls

The frontend is configured to:
- Use `/api` proxy in development (localhost)
- Use the `VITE_API_BASE_URL` environment variable in production
- Fall back to relative paths if no environment variable is set

### Build Process

The build process:
1. Installs dependencies with `npm ci`
2. Builds the React app with `npm run build`
3. Creates a `dist` folder with static files
4. Serves the static files using the `serve` package

## Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check the build logs in Render dashboard
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation passes

2. **API Calls Fail**
   - Check that `VITE_API_BASE_URL` is set correctly
   - Verify backend CORS configuration
   - Check network tab in browser dev tools

3. **404 Errors on Refresh**
   - The `serve -s` command should handle this automatically
   - If issues persist, check the start command is correct

4. **Environment Variables Not Working**
   - Vite environment variables must start with `VITE_`
   - Restart the service after changing environment variables

### Checking Deployment Status:

1. **Frontend URL**: Your frontend will be available at `https://your-frontend-app.onrender.com`
2. **Logs**: Check the deployment logs in Render dashboard
3. **Health Check**: Visit your frontend URL to verify it loads

## Next Steps

After successful deployment:

1. **Update Backend CORS**: Add your frontend URL to backend's `FRONTEND_URL` environment variable
2. **Test API Integration**: Verify all API calls work correctly
3. **Custom Domain** (Optional): Configure a custom domain in Render settings

## Free Tier Limitations

- Services sleep after 15 minutes of inactivity
- May take 30+ seconds to wake up from sleep
- Limited build minutes per month
- Consider upgrading for production use
