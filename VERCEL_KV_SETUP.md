# Vercel KV Setup Guide

This application now supports both file-based storage (for local development) and Vercel KV (for production deployment).

## How It Works

The application automatically detects the environment:
- **Local Development**: Uses file-based storage (`/pm` directory)
- **Vercel Production**: Uses Vercel KV (Redis) for storage

The detection is based on:
- `process.env.VERCEL === '1'` (automatically set by Vercel)
- `process.env.KV_REST_API_URL` (Vercel KV environment variable)

## Setting Up Redis/KV Storage

### Step 1: Add Redis via Marketplace

Vercel has moved KV/Redis to the Marketplace. We support both **Upstash Redis** (recommended) and **Vercel KV** (legacy):

**Option A: Upstash Redis (Recommended)**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Integrations** (or go to [vercel.com/marketplace](https://vercel.com/marketplace))
3. Search for **"Upstash Redis"** or **"Redis"**
4. Click **"Add Integration"** or **"Install"**
5. Select your project
6. Follow the prompts to create the Redis database
7. Choose a name for your database (e.g., "project-manager-redis")
8. Select your region
9. Click **Create** or **Add**

**Option B: Vercel KV (If Available)**
1. Search for **"Vercel KV"** in the Marketplace
2. Follow the same steps as above

### Step 2: Verify Environment Variables

After installing Redis from the Marketplace, Vercel should automatically add the required environment variables. However, you need to verify they're set correctly:

**For Upstash Redis:**
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

**For Vercel KV (legacy):**
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

**To verify:**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Check that the variables are listed
4. **IMPORTANT**: Make sure they're available for **Production** environment (not just Preview/Development)
5. If they're missing or not set for Production:
   - Click **Add** to add them manually
   - Or reconnect the Redis integration and ensure it's linked to Production

### Step 3: Redeploy

**CRITICAL**: After adding or updating environment variables, you **must redeploy** your project:

1. Go to **Deployments** tab
2. Click the **"..."** menu on your latest deployment
3. Select **"Redeploy"**
4. Or push a new commit to trigger a new deployment

Environment variables are only available to new deployments - existing deployments won't have access to newly added variables!

## Free Tier Limits

Vercel KV Free Tier (Hobby Plan):
- ✅ **30,000 requests/month**
- ✅ **256 MB storage**
- ✅ **256 MB data transfer/month**

This should be more than sufficient for a project management application.

## Data Migration

### From Local Files to KV

When you first deploy to Vercel, your KV database will be empty. You have two options:

#### Option 1: Start Fresh (Recommended for new deployments)
- Your KV database starts empty
- Create new projects, epics, and stories through the UI
- All data will be stored in KV going forward

#### Option 2: Migrate Existing Data (For existing deployments)

You can create a migration script to copy data from your local `pm/` directory to KV:

```typescript
// scripts/migrate-to-kv.ts
import { kv } from '@vercel/kv'
import { readFileSync } from 'fs'
import { readdir } from 'fs/promises'
import path from 'path'

async function migrate() {
  const pmDir = path.join(process.cwd(), 'pm')

  // Read all projects
  const projects = await readdir(pmDir, { withFileTypes: true })

  for (const project of projects) {
    if (project.isDirectory()) {
      const projectName = project.name
      const projectPath = path.join(pmDir, projectName, 'project.json')
      const projectData = JSON.parse(readFileSync(projectPath, 'utf-8'))

      // Store in KV
      await kv.set(`pm:project:${projectName}`, projectData)

      // Migrate epics, stories, etc.
      // ... (similar pattern)
    }
  }
}
```

## Troubleshooting

### Health Check Shows "no_env_vars"

If `/api/health` shows `"redisStatus": "no_env_vars"`:

1. **Check Environment Variables in Vercel**:
   - Go to **Settings** → **Environment Variables**
   - Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are present (or `KV_REST_API_URL` and `KV_REST_API_TOKEN`)
   - **Ensure they're enabled for "Production"** (check the Production checkbox)

2. **Redeploy Your Project**:
   - Environment variables are only available to new deployments
   - Go to **Deployments** → Click **"..."** → **"Redeploy"**
   - Or push a new commit

3. **Verify Integration is Connected**:
   - Go to **Settings** → **Integrations**
   - Ensure the Redis/Upstash integration shows as "Connected"
   - If not, reconnect it

4. **Check the Health Endpoint**:
   - Visit `https://your-domain.vercel.app/api/health`
   - Look at `envVarDetails.availableEnvVarNames` to see what Redis-related variables are actually available

### Error: "Vercel KV not available, falling back to file system"

This warning appears when:
- KV environment variables are not set
- The `@vercel/kv` package is not installed
- You're running locally without KV configured

**Solution**: This is expected in local development. The app will use file storage locally.

### Error: "EROFS: read-only file system"

This error occurs when trying to write files on Vercel's serverless functions.

**Solution**: Ensure Vercel KV is properly configured. The app should automatically use KV in production.

### Error: "Redis client error: Missing required environment variables"

This means the environment variables are not available at runtime.

**Solution**:
1. Verify variables are set in Vercel (Settings → Environment Variables)
2. Ensure they're enabled for Production environment
3. **Redeploy your project** (this is critical - existing deployments don't get new env vars)
4. Check `/api/health` endpoint to see what variables are actually available

## Verification

To verify KV is working:

1. Deploy to Vercel
2. Create a new project through the UI
3. Check Vercel Dashboard → Storage → Your KV Database
4. You should see keys like:
   - `pm:project:your-project-name`
   - `pm:projects:list`
   - etc.

## Development vs Production

- **Local (`npm run dev`)**: Uses file system (`/pm` directory)
- **Vercel Production**: Uses Vercel KV automatically
- **No code changes needed**: The repository layer handles the switch automatically

