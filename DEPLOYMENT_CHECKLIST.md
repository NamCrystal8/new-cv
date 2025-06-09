# Deployment Checklist

## Pre-Deployment

- [ ] Backend is already deployed and working on Render
- [ ] You have the backend URL (e.g., `https://your-backend-app.onrender.com`)
- [ ] Code is pushed to your Git repository
- [ ] All environment variables are ready

## Frontend Deployment Steps

### Option 1: Using Blueprint (Recommended)

1. **Prepare Environment Variables**
   - [ ] Copy your backend URL
   - [ ] Note down all required environment variables

2. **Deploy via Blueprint**
   - [ ] Go to Render Dashboard
   - [ ] Click "New" → "Blueprint"
   - [ ] Select your repository
   - [ ] Set environment variables:
     - [ ] `VITE_API_BASE_URL`: Your backend URL
   - [ ] Click "Apply"

3. **Wait for Deployment**
   - [ ] Monitor build logs
   - [ ] Wait for both services to be "Live"

### Option 2: Separate Frontend Service

1. **Create Web Service**
   - [ ] Go to Render Dashboard
   - [ ] Click "New" → "Web Service"
   - [ ] Connect repository
   - [ ] Set Root Directory: `FrontEnd`
   - [ ] Set Build Command: `chmod +x ./build.sh && ./build.sh`
   - [ ] Set Start Command: `chmod +x ./start.sh && ./start.sh`

2. **Configure Environment**
   - [ ] Add `VITE_API_BASE_URL` environment variable
   - [ ] Set value to your backend URL

3. **Deploy**
   - [ ] Click "Create Web Service"
   - [ ] Monitor deployment logs

## Post-Deployment

### Backend Configuration
- [ ] Update backend's `FRONTEND_URL` environment variable with your frontend URL
- [ ] Restart backend service if needed

### Testing
- [ ] Visit your frontend URL
- [ ] Test user registration/login
- [ ] Test CV upload functionality
- [ ] Test PDF generation
- [ ] Check browser console for errors
- [ ] Test API calls in Network tab

### Troubleshooting
- [ ] Check deployment logs if build fails
- [ ] Verify environment variables are set correctly
- [ ] Test API endpoints directly if frontend can't connect
- [ ] Check CORS configuration if getting cross-origin errors

## URLs to Save

- **Frontend URL**: `https://your-frontend-app.onrender.com`
- **Backend URL**: `https://your-backend-app.onrender.com`
- **Admin Panel**: `https://your-frontend-app.onrender.com/admin`

## Common Issues

1. **Build Fails**: Check Node.js version, dependencies, and TypeScript errors
2. **API Calls Fail**: Verify `VITE_API_BASE_URL` and backend CORS settings
3. **404 on Refresh**: Should be handled by `serve -s`, check start command
4. **Slow Loading**: Free tier services sleep after 15 minutes of inactivity

## Success Criteria

- [ ] Frontend loads without errors
- [ ] User can register and login
- [ ] CV upload and analysis works
- [ ] PDF generation works
- [ ] Admin panel is accessible (if applicable)
- [ ] No console errors
- [ ] All API calls succeed
