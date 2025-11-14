# Yellow Box - Quick Start Guide

## 🚀 Application URLs

- **Application**: http://31.97.59.237:3002
- **Supabase API**: http://31.97.59.237:5557
- **Supabase Studio**: http://31.97.59.237:3005
- **Coolify Dashboard**: http://31.97.59.237:8000

## 🔑 Admin Credentials

**Email**: `admin@yellowbox.ae`
**Password**: `Admin123!`

## 📊 Database Schema

The application uses **Supabase PostgreSQL** with these tables:

### Core Tables
- `users` - User accounts with roles (admin, finance, operations, rider)
- `riders` - Rider profiles and application status
- `documents` - Document uploads (visa, license, etc.)
- `expenses` - Expense tracking with approval workflow
- `budgets` - Monthly budget allocation
- `bikes` - Fleet inventory and GPS tracking
- `notifications` - System notifications
- `activity_logs` - Audit logs and system events

### Supporting Tables
- `bike_locations` - Real-time GPS tracking data
- `deliveries` - Delivery orders and tracking

## ⚠️ Important: Database Migration

**ONLY use the first migration file:**
- ✅ Use: `supabase/migrations/001_initial_schema.sql`
- ❌ DO NOT use: `002_real_schema_update.sql` (incompatible with application code)

If you need to restore the database:
1. Run the SQL from `SCHEMA_FIX.sql` in Supabase Studio
2. This will drop all tables and recreate the correct schema

## 🔧 First Time Setup

### 1. Apply Database Schema

Open Supabase Studio (http://31.97.59.237:3005):
1. Navigate to **SQL Editor** in left sidebar
2. Copy contents of `SCHEMA_FIX.sql`
3. Paste and click **Run**
4. Verify admin user appears in results

### 2. Login to Application

1. Go to http://31.97.59.237:3002
2. Clear browser cache (F12 → Application → Clear site data)
3. Login with admin credentials
4. Should redirect to **/admin** dashboard

## 🛠️ Troubleshooting

### Admin Redirected to Rider Dashboard

**Cause**: Database schema mismatch
**Fix**: Run `SCHEMA_FIX.sql` in Supabase Studio

### 500/404 Errors in Console

**Cause**: Missing or incompatible database tables
**Fix**: Run `SCHEMA_FIX.sql` in Supabase Studio

### Can't Login

1. Check Supabase is running: `curl http://31.97.59.237:5557/rest/v1/`
2. Verify user exists in Supabase Studio → Authentication → Users
3. Check users table has matching record with role='admin'

### Application Not Loading

1. Check container status in Coolify
2. Verify port 3002 is accessible: `curl http://31.97.59.237:3002`
3. Check container logs in Coolify

## 📝 User Roles

- **Admin**: Full system access, user management, analytics
- **Finance**: Expense approval, budget management
- **Operations**: Rider verification, bike tracking, documents
- **Rider**: Personal dashboard, expense submission, document upload

## 🗂️ Key Files

- `Dockerfile` - Production container configuration
- `SCHEMA_FIX.sql` - Database restoration script
- `supabase/migrations/001_initial_schema.sql` - Correct schema
- `package.json` - Build scripts and dependencies
- `.env` - Environment variables (Supabase URL, API key)

## 🔐 Environment Variables

Required in Coolify:
```env
VITE_SUPABASE_URL=http://31.97.59.237:5557
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2Mjk0OTUyMCwiZXhwIjo0OTE4NjIzMTIwLCJyb2xlIjoiYW5vbiJ9.GSGsqnPTjpZKxI351mf7NBV_FxejYs6hn4KO1f9Rx3M
NODE_ENV=production
```

## 🚦 Health Checks

**Container Health**: Coolify shows "Healthy" status
**Application**: http://31.97.59.237:3002 returns HTML page
**Supabase**: http://31.97.59.237:5557/rest/v1/ returns 401 (expected - auth required)

## 📚 Documentation

- `DEPLOYMENT_READY.md` - Coolify deployment guide
- `TESTING_REPORT.md` - Testing checklist
- `MIGRATION_FINAL_SUMMARY.md` - Firebase to Supabase migration details
- `SUPABASE_MIGRATION_GUIDE.md` - Migration technical reference
