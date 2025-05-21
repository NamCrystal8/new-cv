# Render Deployment Steps for CV Generator

This guide provides step-by-step instructions for deploying your CV Generator application to Render.

## Prerequisites
- Make sure your code is pushed to a GitHub repository
- Ensure you have a Render account (sign up at https://render.com if needed)
- Have your Cloudinary account details ready

## Step 1: Prepare Your Application

1. Ensure your `.env.example` file documents all required environment variables
2. Verify that your `render.yaml` file is correctly configured
3. Make sure your Docker setup works locally:

```powershell
cd new-cv
docker build -t cv-generator-backend ./BackEnd
docker run -p 8000:8000 cv-generator-backend
```

## Step 2: Deploy Using Render Dashboard

1. Log in to your Render account
2. Click on "New" and select "Blueprint"
3. Connect your GitHub repository
4. Select the repository with your CV Generator
5. Render will detect the `render.yaml` file
6. Add your environment variables:
   - `JWT_SECRET` (copy from your `.env` file)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `GOOGLE_GEMINI_API_KEY`
   - `FRONTEND_URL` (if your frontend is deployed separately)
7. Click "Apply" to start the deployment

## Step 3: Monitor the Deployment

1. Render will create a PostgreSQL database and a web service
2. The build process will:
   - Install dependencies including TeX Live packages
   - Build your Docker container
   - Deploy the application
3. Monitor the build logs for any errors
4. Wait for the deployment to complete (typically 5-10 minutes)

## Step 4: Verify the Deployment

1. Once deployed, click on the service URL to open your application
2. Test the health endpoint: `https://your-service-url.onrender.com/health`
3. Try accessing the Swagger docs: `https://your-service-url.onrender.com/docs`
4. Test PDF generation functionality

## Step 5: Check Database Connection

1. In the Render Dashboard, go to your PostgreSQL database
2. Verify that your tables have been created
3. If needed, you can access the database directly using the connection details provided by Render

## Troubleshooting

If you encounter issues:

1. **Database Connection Problems**:
   - Check the connection string in the environment variables
   - Verify the database is running and accessible

2. **LaTeX/PDF Generation Issues**:
   - Check the logs for errors related to TeX Live
   - Verify that the output directory has proper permissions

3. **Missing Environment Variables**:
   - Make sure all required variables are set in the Render dashboard

4. **Deployment Failures**:
   - Check the build logs for specific error messages
   - Try redeploying after making necessary fixes

## Need Help?

If you continue to experience issues, you can:
- Check Render's documentation: https://render.com/docs
- Use the Render support system
- Review the error logs in detail for specific error messages
