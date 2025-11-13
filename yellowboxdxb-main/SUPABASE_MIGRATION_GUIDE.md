# Firebase → Supabase Migration Guide

## ✅ Completed Steps

### 1. Supabase Infrastructure ✓
- **Supabase Instance**: yellowbox (`dco4okg04sc4w888cwww8ggs`)
- **Studio Dashboard**: http://31.97.59.237:3005
- **API Endpoint**: http://31.97.59.237:5557
- **Database**: PostgreSQL with all tables migrated

### 2. Database Schema ✓
- Created `/supabase/migrations/001_initial_schema.sql`
- Applied migration to database
- 9 tables with proper relationships
- Row Level Security (RLS) policies configured
- Indexes for performance
- Auto-update triggers

### 3. Configuration Files ✓
- Created `src/config/supabase.ts` - Supabase client
- Created `src/types/supabase.ts` - TypeScript types
- Created `.env.example` with Supabase credentials
- Updated `package.json` with `@supabase/supabase-js`

---

## 🔄 Next Steps

### Step 1: Install Dependencies
```bash
cd /Users/etch/Downloads/APPS/yellowbox-fresh/yellowboxdxb-main
npm install @supabase/supabase-js@^2.39.0 --legacy-peer-deps
```

### Step 2: Create .env File
```bash
cp .env.example .env.local
```

### Step 3: Replace Firebase Imports (135 instances)

**Files to Update:**
1. `src/config/firebase.ts` → Delete or comment out
2. `src/contexts/auth-context.tsx` → Replace Firebase Auth with Supabase Auth
3. All service files using Firestore → Update to Supabase queries

**Example Conversion:**

**Before (Firebase):**
```typescript
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './config/firebase';

const ridersRef = collection(db, 'riders');
const q = query(ridersRef, where('status', '==', 'active'));
const snapshot = await getDocs(q);
const riders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

**After (Supabase):**
```typescript
import { supabase } from './config/supabase';

const { data: riders, error } = await supabase
  .from('riders')
  .select('*')
  .eq('status', 'active');

if (error) throw error;
```

### Step 4: Update Authentication

**Firebase Auth → Supabase Auth:**
```typescript
// Old Firebase
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './config/firebase';
await signInWithEmailAndPassword(auth, email, password);

// New Supabase
import { supabase } from './config/supabase';
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});
```

### Step 5: Update Storage

**Firebase Storage → Supabase Storage:**
```typescript
// Old Firebase
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config/firebase';

const storageRef = ref(storage, `documents/${file.name}`);
await uploadBytes(storageRef, file);
const url = await getDownloadURL(storageRef);

// New Supabase
import { supabase } from './config/supabase';

const { data, error } = await supabase.storage
  .from('documents')
  .upload(`${riderId}/${file.name}`, file);

if (error) throw error;

const { data: { publicUrl } } = supabase.storage
  .from('documents')
  .getPublicUrl(data.path);
```

---

## 📊 Migration Checklist

### Authentication (`src/contexts/auth-context.tsx`)
- [ ] Replace `firebase/auth` with `@supabase/supabase-js`
- [ ] Update `signInWithEmailAndPassword` → `supabase.auth.signInWithPassword()`
- [ ] Update `createUserWithEmailAndPassword` → `supabase.auth.signUp()`
- [ ] Update `signOut` → `supabase.auth.signOut()`
- [ ] Update `onAuthStateChanged` → `supabase.auth.onAuthStateChange()`
- [ ] Add custom claims handling via user metadata

### Data Fetching (Services)
- [ ] Replace all `collection()` calls with `supabase.from()`
- [ ] Replace all `getDocs()` with `.select()`
- [ ] Replace all `addDoc()` with `.insert()`
- [ ] Replace all `updateDoc()` with `.update()`
- [ ] Replace all `deleteDoc()` with `.delete()`
- [ ] Update query syntax (where, orderBy, limit)

### Real-time Subscriptions
- [ ] Replace Firestore `onSnapshot` with Supabase Realtime
```typescript
// Old Firebase
onSnapshot(collection(db, 'riders'), (snapshot) => {
  // handle changes
});

// New Supabase
supabase
  .channel('riders')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'riders'
  }, (payload) => {
    // handle changes
  })
  .subscribe();
```

### Storage
- [ ] Create storage buckets in Supabase Studio
- [ ] Update file upload logic
- [ ] Update file URL generation
- [ ] Set bucket policies for public/private access

---

## 🚀 Deployment to Coolify

### Step 1: Prepare for Deployment
```bash
# Test build locally
npm run build

# Verify build output
ls -la dist/
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "feat: Migrate from Firebase to Supabase"
git push origin main
```

### Step 3: Deploy to Coolify
1. Go to Coolify: http://31.97.59.237:8000
2. Click "+ New Resource" → "Application"
3. Select "Public Repository"
4. Repository: `https://github.com/etchmuzik/yellowboxdxb.git`
5. Branch: `main`
6. Build Pack: **Nixpacks** (auto-detect Vite)
7. Port: **3000**
8. Environment Variables:
   ```
   VITE_SUPABASE_URL=http://31.97.59.237:5557
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
9. Click "Deploy"

---

## 🤖 MCP Automation Setup

### Create n8n Workflow for CI/CD

1. **Trigger**: GitHub Webhook (on push to main)
2. **Build**: Run `npm install && npm run build`
3. **Deploy**: Trigger Coolify deployment API
4. **Notify**: Send Slack/email notification

### Example n8n Workflow:
```json
{
  "nodes": [
    {
      "name": "GitHub Webhook",
      "type": "n8n-nodes-base.githubTrigger",
      "parameters": {
        "events": ["push"],
        "repository": "etchmuzik/yellowboxdxb"
      }
    },
    {
      "name": "Coolify Deploy API",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://31.97.59.237:8000/api/deploy",
        "method": "POST"
      }
    }
  ]
}
```

---

## 📝 Testing Checklist

Before going live:
- [ ] Test user authentication (login/logout)
- [ ] Test user registration
- [ ] Test rider creation and updates
- [ ] Test expense submission and approval
- [ ] Test document upload
- [ ] Test real-time notifications
- [ ] Test GPS tracking
- [ ] Test all role-based permissions
- [ ] Test offline functionality (PWA)

---

## 🔍 Supabase Studio Access

**Dashboard Login:**
- URL: http://31.97.59.237:3005
- Username: `IYhCVcKqDDJ1b4mT`
- Password: `WbKBCWS2avBirjyDO9Oe2K7sFco2OD4j`

**What you can do:**
- View and edit data in all tables
- Run SQL queries
- Create storage buckets
- Monitor real-time connections
- View API logs
- Manage database migrations

---

## 🆘 Troubleshooting

### Connection Issues
```typescript
// Test Supabase connection
import { supabase } from './config/supabase';

const { data, error } = await supabase.from('users').select('count');
console.log('Connection test:', { data, error });
```

### CORS Issues
If you get CORS errors, add your domain to Supabase allowed origins in the Kong configuration.

### RLS Policy Issues
If queries fail with permission errors, check RLS policies in Supabase Studio.

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Migration from Firebase](https://supabase.com/docs/guides/migrations/firebase)
- [Coolify Documentation](https://coolify.io/docs)

---

## 🎯 Summary

**What's Ready:**
✅ Database schema migrated
✅ Supabase instance configured
✅ API endpoints exposed
✅ TypeScript types generated
✅ Configuration files created

**What's Next:**
🔄 Replace 135 Firebase imports
🔄 Update authentication context
🔄 Migrate data fetching logic
🔄 Test thoroughly
🔄 Deploy to Coolify
🔄 Set up MCP automation

**Estimated Time:** 4-6 hours for code migration + 2 hours for testing
