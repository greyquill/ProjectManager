# Vercel KV Setup Guide

This application now supports both file-based storage (for local development) and Vercel KV (for production deployment).

## How It Works

The application automatically detects the environment:
- **Local Development**: Uses file-based storage (`/pm` directory)
- **Vercel Production**: Uses Vercel KV (Redis) for storage

The detection is based on:
- `process.env.VERCEL === '1'` (automatically set by Vercel)
- `process.env.KV_REST_API_URL` (Vercel KV environment variable)

## Setting Up Vercel KV

### Step 1: Create Vercel KV Database

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database**
3. Select **KV** (Redis)
4. Choose a name for your database (e.g., "project-manager-kv")
5. Select your region
6. Click **Create**

### Step 2: Link to Your Project

1. In your Vercel project settings, go to **Storage**
2. Find your KV database and click **Connect**
3. Vercel will automatically add the required environment variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### Step 3: Deploy

The environment variables are automatically available in your Next.js API routes. No code changes needed!

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

### Error: "Vercel KV not available, falling back to file system"

This warning appears when:
- KV environment variables are not set
- The `@vercel/kv` package is not installed
- You're running locally without KV configured

**Solution**: This is expected in local development. The app will use file storage locally.

### Error: "EROFS: read-only file system"

This error occurs when trying to write files on Vercel's serverless functions.

**Solution**: Ensure Vercel KV is properly configured. The app should automatically use KV in production.

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

