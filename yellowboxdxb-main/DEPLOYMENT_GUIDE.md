# Yellow Box - Coolify Deployment Guide

## 🚀 Quick Deployment Checklist

### Prerequisites ✅
- ✅ Supabase instance running (http://31.97.59.237:3005)
- ✅ 284 records migrated to Supabase
- ✅ All services migrated to Supabase
- ✅ Build successful (zero errors)
- ✅ Environment variables ready

---

## 📋 Step-by-Step Deployment

### 1. Access Coolify Dashboard

**URL:** http://31.97.59.237:8000

Login with your Coolify credentials.

---

### 2. Create New Application

1. Click **"New Resource"** → **"Application"**
2. Select **"Public Repository"** (or connect your GitHub)
3. Configure:
   - **Name:** `yellowbox-fleet-management`
   - **Repository:** Your Git repository URL
   - **Branch:** `main`
   - **Build Pack:** Nixpacks (auto-detect) or Dockerfile

---

### 3. Configure Build Settings

**Build Command:**
```bash
npm install --legacy-peer-deps && npm run build
```

**Start Command:**
```bash
npx serve -s dist -l 3000
```

**Port:** `3000`

**Install Command:**
```bash
npm install --legacy-peer-deps
```

---

### 4. Environment Variables

Add these environment variables in Coolify:

```env
# Supabase Configuration
VITE_SUPABASE_URL=http://31.97.59.237:5557
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2Mjk0OTUyMCwiZXhwIjo0OTE4NjIzMTIwLCJyb2xlIjoiYW5vbiJ9.GSGsqnPTjpZKxI351mf7NBV_FxejYs6hn4KO1f9Rx3M

# App Configuration
VITE_APP_NAME=Yellowbox Fleet Management
VITE_APP_VERSION=2.0.0

# Google Maps (Optional - if needed)
VITE_GOOGLE_MAPS_API_KEY=your_key_here

# Node Environment
NODE_ENV=production
```

---

### 5. Deploy Application

1. Click **"Deploy"** button
2. Monitor build logs in real-time
3. Wait for deployment to complete (~2-3 minutes)

Expected output:
```
✓ Installing dependencies...
✓ Building application...
✓ Creating production bundle...
✓ Deployment successful!
```

---

### 6. Verify Deployment

Once deployed, Coolify will provide a URL (e.g., `https://yellowbox.your-domain.com`)

**Test Checklist:**
- [ ] App loads without errors
- [ ] Login page appears
- [ ] Can create test user
- [ ] Dashboard loads
- [ ] Riders list shows 142 riders
- [ ] Expenses, documents, bikes accessible

---

## 🔧 Alternative: Docker Deployment

If you prefer Docker, use this `Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start application
CMD ["serve", "-s", "dist", "-l", "3000"]
```

**Build & Run:**
```bash
docker build -t yellowbox-app .
docker run -p 3000:3000 \
  -e VITE_SUPABASE_URL=http://31.97.59.237:5557 \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  yellowbox-app
```

---

## 🌐 Custom Domain Setup (Optional)

### Configure in Coolify:

1. Go to **Application Settings** → **Domains**
2. Add your domain: `fleet.yellowbox.ae`
3. Coolify will automatically generate SSL certificate
4. Update DNS records:
   - **Type:** A
   - **Name:** fleet (or @)
   - **Value:** Your Coolify server IP (31.97.59.237)
   - **TTL:** 300

---

## 📊 Post-Deployment Monitoring

### Health Checks

Add these endpoints to monitor:

**Application Health:**
```bash
curl https://your-app-url.com
# Should return 200 OK
```

**Supabase Connection:**
```bash
curl http://31.97.59.237:5557/rest/v1/
# Should return API info
```

### Coolify Monitoring

Coolify provides built-in monitoring:
- CPU usage
- Memory usage
- Request logs
- Error logs

Access via: **Application** → **Metrics**

---

## 🔥 Troubleshooting

### Issue: Build fails with "legacy-peer-deps" error

**Solution:**
Ensure build command includes `--legacy-peer-deps`:
```bash
npm install --legacy-peer-deps && npm run build
```

### Issue: App loads but shows blank page

**Solution:**
Check browser console for errors. Likely missing environment variables.

Verify in Coolify:
1. Go to **Environment Variables**
2. Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Redeploy

### Issue: 404 on routes (e.g., /riders)

**Solution:**
The app uses React Router. Configure server to serve `index.html` for all routes.

For `serve`:
```bash
serve -s dist -l 3000
```
This handles all routes correctly.

### Issue: Can't connect to Supabase

**Solution:**
1. Verify Supabase is running: `http://31.97.59.237:3005`
2. Check network access from Coolify server to Supabase
3. Verify anon key is correct

---

## 🎯 Expected Performance

**Initial Load:** < 3 seconds
**API Response:** < 500ms
**Bundle Size:** ~2.5 MB (gzipped: ~700 KB)
**Concurrent Users:** 100+ (with current setup)

---

## 📝 Post-Deployment Tasks

1. **Create Admin User**
   - Use the registration flow
   - Manually set role to "Admin" in Supabase Studio

2. **Test All Features**
   - Authentication (login/logout)
   - Rider CRUD operations
   - Expense approval workflow
   - Document upload/verification
   - Bike assignment
   - Budget tracking

3. **Set Up Monitoring**
   - Configure error tracking (optional: Sentry)
   - Set up uptime monitoring
   - Enable backup for Supabase data

4. **Enable HTTPS**
   - Coolify handles SSL automatically
   - Verify certificate is valid
   - Update all API calls to use HTTPS

---

## 🚨 Rollback Plan

If deployment fails:

1. **Immediate Rollback:**
   - In Coolify, go to **Deployments**
   - Click on previous successful deployment
   - Click **"Redeploy"**

2. **Revert to Firebase (Emergency):**
   - The Firebase code is still in the codebase
   - Backup files preserved as `.backup.tsx`
   - Can switch back by reverting service adapters

---

## ✅ Success Criteria

Deployment is successful when:

- ✅ App is accessible via URL
- ✅ Users can login
- ✅ 142 riders visible in riders list
- ✅ All CRUD operations work
- ✅ No console errors
- ✅ API responses < 1 second
- ✅ SSL certificate valid (if using HTTPS)

---

## 📞 Support Resources

**Coolify Dashboard:** http://31.97.59.237:8000
**Supabase Studio:** http://31.97.59.237:3005
**Application Logs:** Coolify → Logs tab
**Database:** Supabase → Table Editor

---

## 🎉 You're Ready to Deploy!

All prerequisites are met. Just follow the steps above and you'll have Yellow Box running in production with Supabase!

**Estimated Deployment Time:** 10-15 minutes

Good luck! 🚀
