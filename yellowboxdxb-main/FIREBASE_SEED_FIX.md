# Firebase Seed Script Fix

## Problem Analysis

The error occurs when running `npx tsx src/scripts/seedData.ts` because:

1. **Environment Variable Loading Issue**: The script uses `import.meta.env` which is Vite-specific and doesn't work in Node.js environments
2. **Missing Environment Variables**: The `.env.production` file exists but isn't being loaded by `tsx`
3. **Firebase Configuration**: The firebase configuration expects Vite's environment variable syntax

## Root Cause

- `import.meta.env` is only available in Vite-built applications
- When running standalone TypeScript files with `tsx`, we need to use Node.js-compatible environment variable loading
- The current firebase configuration is tightly coupled to Vite's environment system

## Solution Strategy

### Option 1: Create Standalone Seed Script (Recommended)
Create a Node.js-compatible seed script that:
- Uses `dotenv` package to load environment variables
- Uses CommonJS or ES modules compatible with Node.js
- Loads Firebase configuration from environment variables

### Option 2: Modify Existing Configuration
Update the firebase configuration to work with both Vite and Node.js environments by detecting the runtime environment.

### Option 3: Use Vite Build Process
Build the seed script as part of the Vite build process and run it from the built output.

## Implementation Plan

### Step 1: Create Environment-Agnostic Firebase Configuration
Create a new firebase configuration that works in both Vite and Node.js environments.

### Step 2: Create Standalone Seed Script
Create a new seed script specifically for Node.js execution.

### Step 3: Update Package.json Scripts
Add npm scripts to run the seed script with proper environment loading.

### Step 4: Create .env File
Create a `.env` file for local development based on `.env.production`.

## Files to Create/Modify

1. `scripts/seed-data.js` - New standalone seed script
2. `src/config/firebase-node.js` - Node.js compatible firebase config
3. `.env` - Local development environment file
4. `package.json` - Add seed script commands

## Commands to Run

```bash
# Install required dependencies
npm install dotenv

# Run the seed script
npm run seed

# Or run directly
node scripts/seed-data.js
```

## Testing Steps

1. Verify environment variables are loaded correctly
2. Test Firebase connection
3. Verify data is seeded properly
4. Test both development and production environments

## Dependencies Required

- `dotenv` - For environment variable loading in Node.js
- `firebase-admin` (optional) - For admin-level access if needed

## Security Considerations

- Ensure `.env` files are in `.gitignore`
- Use `.env.production` for production values
- Never commit actual API keys to version control