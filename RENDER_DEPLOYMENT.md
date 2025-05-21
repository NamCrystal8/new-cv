# Deploying CV Generator to Render

This README provides instructions for deploying the CV Generator application to Render's free tier.

## Prerequisites

1. Create a [Render](https://render.com) account if you don't have one
2. Set up a [Cloudinary](https://cloudinary.com) account to store uploaded files
3. Make sure your Git repository is ready to be deployed

## Deployment Steps

### 1. Deploy Using the Render Blueprint

The easiest way to deploy is using the `render.yaml` blueprint:

1. Fork or clone this repository to your GitHub account
2. Go to your Render dashboard
3. Click "New" and select "Blueprint"
4. Connect your GitHub account if you haven't already
5. Select the repository containing your CV Generator
6. Render will detect the `render.yaml` file and offer to deploy the services
7. Add the required environment variables (see below)
8. Click "Apply" to start the deployment

### 2. Environment Variables

You'll need to set up the following environment variables in Render:

- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
- `FRONTEND_URL`: URL of your deployed frontend (if separate from backend)
- `JWT_SECRET`: Your JWT secret key for authentication (copy from your local .env file)
- `PORT`: Set to 8000 (Render will override this with its own port)

### 3. Database Setup

The blueprint includes a PostgreSQL database that Render will provision automatically on the free tier. Your application is configured to use this database through these steps:

1. Render creates a PostgreSQL database instance
2. The `DATABASE_URL` environment variable is automatically set
3. Your application's database.py is configured to:
   - Use PostgreSQL in production (on Render)
   - Fall back to MySQL for local development
   - Automatically handle the different connection formats

### 4. MiTeX and LaTeX Support

The deployment includes a Dockerfile with all necessary LaTeX packages installed to support PDF generation. The setup includes:

- texlive-latex-base
- texlive-fonts-recommended
- texlive-latex-extra
- texlive-fonts-extra

These packages ensure that all LaTeX commands used in your CV templates will work correctly. The application uses these packages to:

1. Convert your JSON data to LaTeX code
2. Generate PDF files from the LaTeX code
3. Serve the PDFs to users for download

The Dockerfile is configured to install these packages during the build process, so no additional setup is required after deployment.

### 5. Monitoring Your Application

After deployment:

1. Check the logs in your Render dashboard to ensure everything started correctly
2. Test the API endpoints to verify PDF generation is working
3. Confirm CORS is configured correctly for your frontend

## Troubleshooting

If you encounter issues with LaTeX:

1. Check the build logs to ensure all LaTeX packages were installed correctly
2. Verify output directories exist and have correct permissions
3. Test PDF generation with simple LaTeX files before trying more complex ones

For database issues:

1. Check connection strings are being set correctly
2. Verify your models match database schema
3. Check migration scripts if using Alembic

## Limitations of Free Tier

Note that Render's free tier has some limitations:

- Services sleep after 15 minutes of inactivity
- Limited compute resources 
- PostgreSQL databases are limited to 1GB storage
- May require up to 30 seconds to wake up from sleep

For production use, consider upgrading to a paid plan.
