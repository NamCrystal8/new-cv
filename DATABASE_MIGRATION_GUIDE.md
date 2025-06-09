# 🔄 Database Migration Guide for Render

## 🔍 The Problem
Your Render database is using an **old schema** that doesn't match your current models. This causes errors because:

- Missing tables (subscription_plans, user_subscriptions, etc.)
- Missing columns (role_id, updated schema changes)
- Outdated structure from earlier development

## ✅ The Complete Solution

I've created a **comprehensive migration system** that will:

1. **Update your database schema** to match current models
2. **Create missing tables** (subscription_plans, user_subscriptions, etc.)
3. **Handle role column migration** properly
4. **Create admin user** with correct schema
5. **Add default subscription plans**
6. **Run automatically on deployment**

## 🛠️ Migration Files Created

### **`migrate_database.py`** - Main Migration Script
- Analyzes current database schema
- Creates/updates all tables to match models
- Handles role column migration intelligently
- Creates admin user with proper role handling
- Adds default subscription plans
- Comprehensive error handling

### **`run_migration.sh`** - Manual Migration Runner
- Simple script to run migration manually if needed
- Provides clear feedback on migration status

### **Updated `start.sh`** - Automatic Migration
- Runs migration automatically on every deployment
- Ensures database is always up-to-date

## 🚀 Deployment Process

### **Automatic Migration (Recommended)**

The migration will run automatically when you deploy:

```bash
git add .
git commit -m "Add comprehensive database migration system"
git push
```

**What happens during deployment:**
1. ✅ Backend builds successfully
2. ✅ Migration script runs automatically
3. ✅ Database schema updated to current models
4. ✅ Missing tables created
5. ✅ Admin user created
6. ✅ Default subscription plans added
7. ✅ Application starts normally

### **Manual Migration (If Needed)**

If you need to run migration manually:

1. **SSH into your Render service** (if available)
2. **Run the migration script:**
   ```bash
   ./run_migration.sh
   ```

## 📋 What the Migration Does

### **Schema Updates:**
- ✅ Creates all missing tables
- ✅ Updates user table to handle role column properly
- ✅ Creates subscription_plans table
- ✅ Creates user_subscriptions table
- ✅ Creates roles table (if needed)
- ✅ Adds proper foreign key relationships

### **Data Creation:**
- ✅ **Admin User:** admin@cvbuilder.com / admin123
- ✅ **Default Plans:** Free, Premium, Pro
- ✅ **Role Data:** Admin, User roles

### **Smart Handling:**
- 🔍 **Detects existing schema** and adapts accordingly
- 🛡️ **Prevents duplicate data** creation
- 🔄 **Handles different role column types** (role vs role_id)
- ⚠️ **Graceful error handling** - continues even if some steps fail

## 🎯 After Migration

### **Test Your Application:**

1. **Backend Health Check:**
   - Visit: `https://your-backend-url.onrender.com/health`
   - Should return: `{"status": "healthy"}`

2. **User Registration:**
   - Try registering a new user
   - Should work without 500 errors

3. **Admin Login:**
   - Email: `admin@cvbuilder.com`
   - Password: `admin123`
   - Should login successfully

4. **Admin Panel:**
   - Visit: `https://your-frontend-url.onrender.com/admin`
   - Should show user management, subscription plans

5. **CV Upload:**
   - Test CV upload and analysis
   - Should work normally

## 🔧 Troubleshooting

### **If Migration Fails:**

1. **Check deployment logs** in Render dashboard
2. **Look for migration error messages**
3. **Try manual migration** using `run_migration.sh`

### **Common Issues:**

**Issue:** "Table already exists"
**Solution:** ✅ Migration handles this gracefully

**Issue:** "Column already exists"  
**Solution:** ✅ Migration detects and skips existing columns

**Issue:** "Admin user already exists"
**Solution:** ✅ Migration skips if admin exists

### **Rollback (If Needed):**

If something goes wrong, you can:
1. **Restore from Render database backup**
2. **Or recreate the database** (will lose data)

## 📊 Migration Log Example

```
🚀 Starting database migration...
📋 Creating/updating tables from models...
✅ Tables created/updated successfully
🔍 Checking current database schema...
Found tables: user, cv, subscription_plans, user_subscriptions
👤 Checking user table schema...
🔧 Handling user role migration...
Found 'role' column (string type), keeping current structure
📋 Checking for missing tables...
All expected tables exist
👤 Creating admin user...
✅ Created admin user: admin@cvbuilder.com
💳 Creating default subscription plans...
✅ Created default subscription plans
🎉 Database migration completed successfully!
```

## 🎉 Success Criteria

After successful migration:
- ✅ No more database schema errors
- ✅ User registration works
- ✅ Admin user can login
- ✅ Admin panel accessible
- ✅ Subscription management works
- ✅ CV upload and analysis works
- ✅ All API endpoints return proper JSON

Your database will be fully updated and your application will work perfectly! 🚀
