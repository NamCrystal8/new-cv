# Admin Panel Setup and Usage Guide

This document provides instructions for setting up and using the comprehensive admin panel for the CV Builder application.

## Features Implemented

### ✅ Completed Features

1. **Admin Dashboard**
   - Key metrics display (total users, active users, CVs, subscriptions, revenue)
   - Visual metric cards with icons and trends
   - Quick action buttons for common tasks
   - Real-time data fetching from backend

2. **User Management**
   - Paginated user table with search and filtering
   - User details: email, role, status, CV count, registration date
   - Actions: View, Activate/Deactivate, Delete
   - Bulk operations: Activate, Deactivate, Delete multiple users
   - Role-based access control

3. **Admin Authentication & Authorization**
   - Role-based access (Admin role_id = 1)
   - Protected admin routes with permission checking
   - Admin-only sidebar navigation link
   - Secure admin endpoints with proper error handling

4. **Backend Infrastructure**
   - Complete admin API endpoints (`/api/admin/*`)
   - Admin service layer with database operations
   - Admin-specific schemas and data models
   - Proper error handling and validation

### 🚧 Placeholder Features (Coming Soon)

1. **CV Management**
   - CV listing with owner information and upload dates
   - CV preview and download functionality
   - Content moderation and approval workflow
   - File size and format analytics

2. **Subscription Management**
   - Subscription overview with plan details and billing
   - Revenue analytics and financial metrics
   - Plan management and pricing control
   - Churn analysis and retention insights

## Setup Instructions

### 1. Database Setup

First, ensure your roles are properly set up in the database:

```sql
-- Create roles table if not exists
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert default roles
INSERT INTO roles (id, role_name) VALUES 
(1, 'ADMIN'),
(2, 'USER')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);
```

### 2. Create Admin User

Run the admin user creation script:

```bash
cd BackEnd
python create_admin_user.py
```

This will create an admin user with:
- **Email**: admin@cvbuilder.com
- **Password**: admin123
- **Role**: Admin (role_id = 1)

⚠️ **Important**: Change the default password after first login!

### 3. Backend Setup

The admin routes are automatically included when you start the FastAPI server:

```bash
cd BackEnd
uvicorn main:app --reload
```

Admin endpoints will be available at:
- `GET /api/admin/dashboard` - Dashboard metrics
- `GET /api/admin/users` - User management
- `PATCH /api/admin/users/{user_id}` - Update user
- `DELETE /api/admin/users/{user_id}` - Delete user
- `POST /api/admin/users/bulk-action` - Bulk user operations

### 4. Frontend Setup

The admin panel is automatically included in the React application:

```bash
cd FrontEnd
npm start
```

Admin panel will be accessible at: `http://localhost:3000/admin`

## Usage Guide

### Accessing the Admin Panel

1. **Login** with admin credentials
2. **Admin Link** will appear in the sidebar (red border, shield icon)
3. **Click "Admin Panel"** to access the admin interface

### Dashboard Overview

The dashboard provides:
- **Total Users**: All registered users
- **Active Users**: Verified and active users
- **Total CVs**: All uploaded CVs
- **Active Subscriptions**: Current paid subscriptions
- **Monthly Revenue**: Current month's revenue
- **Recent Activity**: 30-day registration and upload trends

### User Management

**Search and Filter:**
- Search by email address
- Filter by role, active status, verification status
- Pagination with configurable page sizes

**User Actions:**
- **View**: Display user details (coming soon)
- **Activate/Deactivate**: Toggle user active status
- **Delete**: Permanently remove user and associated data

**Bulk Operations:**
- Select multiple users with checkboxes
- Perform bulk activate, deactivate, or delete operations
- Confirmation dialogs for destructive actions

### Security Features

- **Role-based Access**: Only users with role_id = 1 can access admin features
- **Protected Routes**: All admin endpoints require admin authentication
- **Permission Checking**: Frontend checks admin status before showing admin links
- **Secure Operations**: Confirmation dialogs for destructive actions

## API Documentation

### Admin Endpoints

#### Dashboard
```
GET /api/admin/dashboard
Response: DashboardMetrics
```

#### User Management
```
GET /api/admin/users?search=&role_id=&is_active=&page=1&page_size=20
Response: PaginatedUsersResponse

GET /api/admin/users/{user_id}
Response: AdminUserRead

PATCH /api/admin/users/{user_id}
Body: UserUpdateAdmin
Response: AdminUserRead

DELETE /api/admin/users/{user_id}
Response: {"message": "User deleted successfully"}

POST /api/admin/users/bulk-action
Body: BulkUserAction
Response: {"results": [...]}
```

### Data Models

#### DashboardMetrics
```typescript
interface DashboardMetrics {
  total_users: number;
  active_users: number;
  total_cvs: number;
  total_subscriptions: number;
  active_subscriptions: number;
  monthly_revenue: number;
  recent_registrations: number;
  recent_cv_uploads: number;
}
```

#### AdminUserRead
```typescript
interface AdminUserRead {
  id: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  role_id: number;
  created_at: string;
  cv_count: number;
  subscription_status?: string;
}
```

## Troubleshooting

### Common Issues

1. **"Access Denied" Error**
   - Ensure user has role_id = 1 (Admin)
   - Check if admin user was created properly
   - Verify authentication is working

2. **Admin Link Not Showing**
   - Check if user is logged in
   - Verify admin role assignment
   - Check browser console for errors

3. **API Errors**
   - Ensure backend server is running
   - Check database connection
   - Verify admin routes are included in main.py

### Development Notes

- Admin components are located in `FrontEnd/src/components/admin/`
- Admin routes are in `BackEnd/routes/admin_routes.py`
- Admin service logic is in `BackEnd/services/admin_service.py`
- Admin schemas are in `BackEnd/schemas/admin.py`

## Future Enhancements

1. **Advanced Analytics**
   - User engagement metrics
   - CV usage patterns
   - Revenue forecasting

2. **System Monitoring**
   - Performance metrics
   - Error tracking
   - Health monitoring

3. **Content Management**
   - CV template management
   - System announcements
   - Feature flags

4. **Audit Logging**
   - Admin action tracking
   - User activity logs
   - Security event monitoring
