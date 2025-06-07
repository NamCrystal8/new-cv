# 🚀 Quick Start: Admin Panel

## 5-Minute Setup Guide

### Step 1: Create Admin User
```bash
cd BackEnd
python create_admin_user.py
```
**Output**: Admin user created with email `admin@cvbuilder.com` and password `admin123`

### Step 2: Start Backend
```bash
cd BackEnd
uvicorn main:app --reload
```
**Expected**: Server running on http://localhost:8000

### Step 3: Start Frontend
```bash
cd FrontEnd
npm start
```
**Expected**: App running on http://localhost:3000

### Step 4: Test Admin Access
```bash
python test_admin.py
```
**Expected**: All tests pass ✅

### Step 5: Login & Access Admin Panel
1. Go to http://localhost:3000
2. Login with `admin@cvbuilder.com` / `admin123`
3. Click "Admin Panel" in sidebar (red border, shield icon)
4. **Change the default password immediately!**

## 🎯 What You'll See

### Dashboard
- Total users, active users, CVs, subscriptions
- Monthly revenue and recent activity
- Quick action buttons

### User Management
- Searchable user table
- Activate/deactivate users
- Delete users with confirmation
- Bulk operations

### Security
- Only admin users see the admin link
- Protected routes with proper error handling
- Confirmation dialogs for destructive actions

## 🔧 Troubleshooting

**Admin link not showing?**
- Ensure you're logged in as admin user
- Check role_id = 1 in database

**Access denied error?**
- Verify admin user was created properly
- Check authentication is working

**API errors?**
- Ensure backend is running on port 8000
- Check database connection

## 📚 Full Documentation
- `ADMIN_SETUP.md` - Complete setup guide
- `ADMIN_IMPLEMENTATION_SUMMARY.md` - Technical details

## 🎉 You're Ready!
Your comprehensive admin panel is now live and ready to manage your CV Builder application!
