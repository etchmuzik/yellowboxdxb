# n8n Google Sheets OAuth Setup Guide

## Your Google OAuth Client ID
```
47222199157-t3nec9ls81gfuu8oav3d2gpdd9vam35f.apps.googleusercontent.com
```

## Step-by-Step Setup in n8n

### 1. Configure OAuth2 Credentials in n8n

1. **Go to n8n Credentials**:
   - https://n8n.srv924607.hstgr.cloud/
   - Click "Credentials" in the left sidebar
   - Click "Add Credential"
   - Search for "Google Sheets OAuth2 API"

2. **Enter OAuth2 Details**:
   - **Client ID**: `47222199157-t3nec9ls81gfuu8oav3d2gpdd9vam35f.apps.googleusercontent.com`
   - **Client Secret**: (You need this from Google Cloud Console)
   - **Authorization URL**: Leave default
   - **Access Token URL**: Leave default
   - **Scope**: `https://www.googleapis.com/auth/spreadsheets`
   - **Auth URI Query Parameters**: Leave default
   - **Authentication**: Header

3. **Get OAuth Redirect URL**:
   - n8n will show you a redirect URL like:
   ```
   https://n8n.srv924607.hstgr.cloud/rest/oauth2-credential/callback
   ```
   - Copy this URL

### 2. Configure in Google Cloud Console

1. **Go to Google Cloud Console**:
   - https://console.cloud.google.com/
   - Select your project
   - Go to "APIs & Services" → "Credentials"

2. **Find Your OAuth Client**:
   - Look for the client ID ending in `...9vam35f.apps.googleusercontent.com`
   - Click on it to edit

3. **Add Authorized Redirect URI**:
   - In "Authorized redirect URIs" section
   - Add: `https://n8n.srv924607.hstgr.cloud/rest/oauth2-credential/callback`
   - Click "Save"

4. **Get Client Secret**:
   - Copy the Client Secret value
   - You'll need this for n8n

### 3. Complete n8n Setup

1. **Back in n8n**:
   - Paste the Client Secret
   - Click "Connect my account"
   - Google login window will open
   - Sign in and authorize access
   - You should see "Account connected"
   - Save the credential with name: "YellowBox Google Sheets"

### 4. Update the Workflow

1. **Edit the Workflow**:
   - Go to "Workflows" → "Yellow Box - Real-time Data Sync"
   - Click "Open in Editor"

2. **For EACH Google Sheets Node**:
   - Click on the node
   - In "Credential for Google Sheets OAuth2 API"
   - Select "YellowBox Google Sheets" (the one you just created)
   - In "Document ID" field, enter your Google Sheet ID
   - Update field mappings (see below)

3. **Fix Field Mappings**:
   In "Sync Rider Data" node, change:
   ```
   B: {{ $json.data.fullName }}          // was 'name'
   E: {{ $json.data.applicationStage }}  // was 'status'
   ```

4. **Activate the Workflow**:
   - Toggle the workflow to "Active" (top right)
   - Save the workflow

### 5. Test the Integration

Run the test again:
```bash
node test-complete-integration.js
```

Then check your Google Sheet for the test data!

## Getting Your Google Sheet ID

From your Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/[SHEET_ID_HERE]/edit
```

Example:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                       This is your Sheet ID
```

## Troubleshooting

If you see errors:
- **"insufficient authentication scopes"**: Add more scopes in credentials
- **"The caller does not have permission"**: Share the sheet with your Google account
- **"Requested entity was not found"**: Wrong Sheet ID or tab names

## Required Google Sheet Structure

Make sure your Google Sheet has these exact tab names:
- `Riders`
- `Expenses`
- `Documents`
- `Sync_Log`

With headers in the first row as specified in the setup guide.