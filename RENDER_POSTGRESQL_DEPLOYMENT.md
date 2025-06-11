# Render PostgreSQL Deployment Guide

## 🚀 Complete Deployment Guide for PostgreSQL on Render

This guide covers deploying the CV Generator application with PostgreSQL database on Render.com.

## 📋 Prerequisites

1. **GitHub Repository**: Code pushed to GitHub
2. **Render Account**: Free account at render.com
3. **Environment Variables**: Prepared for production

## 🗄️ Database Setup

### Step 1: Create PostgreSQL Database

1. **Go to Render Dashboard**
   - Visit [render.com](https://render.com)
   - Sign in to your account

2. **Create New PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - **Name**: `new-cv-db`
   - **Database Name**: `new_cv`
   - **User**: (auto-generated)
   - **Region**: Choose closest to your users
   - **Plan**: Free (or paid for production)

3. **Note Database Details**
   - Save the connection string (starts with `postgres://`)
   - This will be automatically provided to your web service

## 🌐 Backend Service Setup

### Step 2: Create Backend Web Service

1. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - **Name**: `new-cv-backend`

2. **Configure Build Settings**
   - **Environment**: Docker
   - **Dockerfile Path**: `./BackEnd/Dockerfile`
   - **Docker Context**: `./BackEnd`
   - **Build Command**: `chmod +x ./build.sh && ./build.sh`
   - **Start Command**: `chmod +x ./start.sh && bash ./start.sh`

3. **Configure Service Settings**
   - **Plan**: Free (or paid for production)
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: Yes

### Step 3: Configure Environment Variables

Set these environment variables in the Render dashboard:

#### Required Variables:
```bash
# Database (Auto-configured)
DATABASE_URL=<from-database>

# Cloudinary (Required for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini AI (Required for CV analysis)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# JWT Security (Required)
JWT_SECRET=your_very_long_random_secret_key

# Frontend URL (Set after frontend deployment)
FRONTEND_URL=https://your-frontend-url.onrender.com
```

#### Optional Variables:
```bash
# Environment
ENVIRONMENT=production

# Database Optimization
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=10

# Logging
SQLALCHEMY_WARN_20=1
PYTHONUNBUFFERED=1
```

## 🎨 Frontend Service Setup

### Step 4: Create Frontend Web Service

1. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - **Name**: `new-cv-frontend`

2. **Configure Build Settings**
   - **Environment**: Node
   - **Root Directory**: `FrontEnd`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npx serve -s dist -l $PORT`

3. **Configure Environment Variables**
   ```bash
   # Backend API URL (Set after backend deployment)
   VITE_API_BASE_URL=https://your-backend-url.onrender.com
   ```

## 🔧 Configuration Files

The following files are optimized for PostgreSQL deployment:

### `render.yaml` (Auto-deployment)
```yaml
services:
  - type: web
    name: new-cv-backend
    env: docker
    dockerfilePath: ./BackEnd/Dockerfile
    dockerContext: ./BackEnd
    plan: free
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: new-cv-db
          property: connectionString
      # ... other environment variables

databases:
  - name: new-cv-db
    databaseName: new_cv
    plan: free
```

### Key Features:
- ✅ **PostgreSQL Optimized**: Uses asyncpg driver
- ✅ **Auto Database Init**: Creates schema and default data
- ✅ **Admin User**: Creates admin@cvbuilder.com / admin123
- ✅ **Health Checks**: Monitors application health
- ✅ **LaTeX Support**: Full LaTeX environment for CV generation

## 🚀 Deployment Steps

### Step 5: Deploy Services

1. **Deploy Database First**
   - Database will be created automatically
   - Wait for it to be "Available"

2. **Deploy Backend**
   - Push code to GitHub (triggers auto-deploy)
   - Monitor build logs for any issues
   - Check health endpoint: `https://your-backend.onrender.com/health`

3. **Deploy Frontend**
   - Update `VITE_API_BASE_URL` with backend URL
   - Push code to GitHub (triggers auto-deploy)

### Step 6: Verify Deployment

1. **Check Backend Health**
   ```bash
   curl https://your-backend.onrender.com/health
   ```

2. **Test Admin Login**
   - Email: `admin@cvbuilder.com`
   - Password: `admin123`

3. **Check Database**
   - Admin panel should show users, subscriptions, etc.

## 🔍 Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check DATABASE_URL is set correctly
   - Verify database is "Available" in Render dashboard

2. **Build Failures**
   - Check build logs in Render dashboard
   - Ensure all dependencies are in requirements.txt

3. **Admin User Not Created**
   - Check startup logs for initialization errors
   - Database might need manual admin creation

4. **CORS Issues**
   - Ensure FRONTEND_URL is set correctly in backend
   - Check VITE_API_BASE_URL in frontend

### Debug Commands:
```bash
# Check database connection
python test_postgres_connection.py

# Create admin user manually
python create_admin_with_fastapi_users.py

# Check database schema
python check_postgres_schema.py
```

## 📊 Monitoring

### Health Checks:
- **Backend**: `https://your-backend.onrender.com/health`
- **Frontend**: `https://your-frontend.onrender.com`
- **Database**: Monitor in Render dashboard

### Logs:
- View real-time logs in Render dashboard
- Check for database connection issues
- Monitor application startup

## 🎯 Production Considerations

1. **Upgrade Plans**: Consider paid plans for production
2. **Environment Variables**: Use secure, random values
3. **Database Backups**: Enable automatic backups
4. **Monitoring**: Set up alerts for downtime
5. **SSL**: Render provides SSL automatically

## ✅ Success Checklist

- [ ] PostgreSQL database created and available
- [ ] Backend service deployed and healthy
- [ ] Frontend service deployed and accessible
- [ ] Admin user can log in
- [ ] CV upload and analysis working
- [ ] All environment variables configured
- [ ] Health checks passing

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [PostgreSQL on Render](https://render.com/docs/databases)
- [Environment Variables](https://render.com/docs/environment-variables)

Your CV Generator application is now deployed with PostgreSQL on Render! 🎉
