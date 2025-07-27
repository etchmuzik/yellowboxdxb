# 🚀 Yellow Box Complete Integration Guide

## Overview
This guide covers the two critical integrations for Yellow Box:
1. **N8N Workflow Fix** - For automated Google Sheets synchronization
2. **MCP Server Setup** - For real-time communication features

---

## Part 1: N8N Workflow Fix (CRITICAL - System is Broken)

### 🔴 Current Issue
- Workflow ID `sm5RUQQwjr2cR4mB` returns 404
- Webhook endpoint `/webhook/yellowbox-sync` returns 500 error
- No data synchronization to Google Sheets

### ✅ Step-by-Step Fix

#### 1. Access N8N Dashboard
```
URL: https://n8n.srv924607.hstgr.cloud
Login with your N8N credentials
```

#### 2. Import the Complete Workflow
1. In N8N, click **"Workflows"** → **"Add workflow"** → **"Import from JSON"**
2. Copy the entire contents from: `/Users/etch/Downloads/yellowbox/COMPLETE_N8N_WORKFLOW.json`
3. Paste and click **"Import"**

#### 3. Configure Google Sheets Credentials
1. Click on any **Google Sheets** node in the workflow
2. Click **"Create New"** credential
3. Choose **OAuth2** authentication
4. Add your Google Cloud Console credentials:
   - Client ID
   - Client Secret
5. Click **"Connect my account"** and authorize

#### 4. Update Google Sheets IDs
Replace placeholder sheet IDs in the workflow nodes:
- `1N8N_GOOGLE_SHEETS_YELLOWBOX_RIDERS_SHEET_ID`
- `1N8N_GOOGLE_SHEETS_YELLOWBOX_EXPENSES_SHEET_ID`
- `1N8N_GOOGLE_SHEETS_YELLOWBOX_BIKES_SHEET_ID`

#### 5. Activate the Workflow
1. Toggle the **"Active"** switch (top right)
2. Copy the webhook URL shown in the Webhook node
3. It should be: `https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync`

#### 6. Test the Connection
```bash
curl -X POST https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "test_connection",
    "data": {
      "message": "Testing Yellow Box Integration",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }'
```

Expected response: `{"success": true, "message": "Webhook processed successfully"}`

---

## Part 2: MCP Server Setup (Real-time Features)

### 🚀 What MCP Server Provides
- Real-time location tracking
- Instant expense status updates
- Live dashboard metrics
- WebSocket connections for all users
- Push notifications

### 📁 MCP Server Location
```
/Users/etch/Downloads/yellowbox/yellowboxdxb-main/mcp-server/
```

### 🛠️ Setup Steps

#### 1. Configure Environment
```bash
cd /Users/etch/Downloads/yellowbox/yellowboxdxb-main/mcp-server
cp .env.example .env
```

Edit `.env` with:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_PROJECT_ID=yellowbox-8e0e6
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@yellowbox-8e0e6.iam.gserviceaccount.com

# Redis (for message queuing)
REDIS_URL=redis://localhost:6379

# N8N Integration
N8N_WEBHOOK_URL=https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync
N8N_API_TOKEN=your_n8n_api_token

# CORS
ALLOWED_ORIGINS=https://yellowboxdxb.web.app,http://localhost:8080
```

#### 2. Install Dependencies & Start Development Server
```bash
npm install
npm run dev
```

Or use Docker:
```bash
docker-compose up
```

#### 3. Test MCP Server
```bash
# Health check
curl http://localhost:3001/health

# Test WebSocket connection
node test-client.js
```

#### 4. Deploy to Production (Google Cloud Run)
```bash
# Configure gcloud
gcloud config set project yellowbox-8e0e6

# Deploy
./deploy.sh
```

The script will:
- Build Docker image
- Push to Google Container Registry
- Deploy to Cloud Run
- Output the production URL

#### 5. Update Web App Configuration
In your Yellow Box web app `.env`:
```env
# Production MCP Server
VITE_MCP_WEBSOCKET_URL=wss://mcp-server-xxxxx-uc.a.run.app
VITE_MCP_API_URL=https://mcp-server-xxxxx-uc.a.run.app
```

---

## 🧪 Testing Complete Integration

### 1. Test N8N → Google Sheets
```javascript
// In Yellow Box web app console
await triggerWebhookSync('rider', 'test-123', 'added', {
  name: 'Test Rider',
  email: 'test@example.com',
  phone: '+971501234567',
  status: 'Applied'
});
```

Check Google Sheets for the new entry.

### 2. Test MCP Real-time Updates
```javascript
// Connect to WebSocket
const socket = io('wss://your-mcp-server-url', {
  auth: {
    token: 'your-firebase-auth-token'
  }
});

// Listen for updates
socket.on('expense:updated', (data) => {
  console.log('Expense updated:', data);
});
```

### 3. Full Integration Test
1. Create a new rider in Yellow Box
2. Check N8N execution history
3. Verify data in Google Sheets
4. Confirm real-time update via WebSocket

---

## 🔍 Troubleshooting

### N8N Issues
| Problem | Solution |
|---------|----------|
| Webhook returns 404 | Workflow not active or wrong URL |
| Webhook returns 500 | Check workflow for errors |
| No data in Sheets | Verify Google credentials |
| Authentication failed | Re-authorize OAuth2 |

### MCP Server Issues
| Problem | Solution |
|---------|----------|
| Cannot connect WebSocket | Check CORS settings |
| No real-time updates | Verify Firebase credentials |
| Redis connection failed | Start Redis server |
| Deployment fails | Check Google Cloud quotas |

---

## 📊 Architecture Overview

```
┌─────────────────┐     ┌──────────────┐     ┌────────────────┐
│  Yellow Box     │────▶│  MCP Server  │────▶│  Firebase      │
│  Web App        │◀────│  (Real-time) │◀────│  Firestore     │
└─────────────────┘     └──────────────┘     └────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────┐
│  N8N Workflows  │────▶│ Google Sheets│
│  (Automation)   │     │ (Reporting)  │
└─────────────────┘     └──────────────┘
```

---

## ✅ Success Checklist

- [ ] N8N workflow imported and active
- [ ] Google Sheets credentials configured
- [ ] Webhook endpoint responding with 200
- [ ] MCP server running locally
- [ ] WebSocket connections working
- [ ] Firebase integration verified
- [ ] Production deployment completed
- [ ] Real-time updates functional

---

## 📞 Support

For issues:
1. Check the detailed logs in N8N execution history
2. Review MCP server logs: `docker-compose logs -f`
3. Verify all environment variables are set correctly
4. Test each component independently before full integration