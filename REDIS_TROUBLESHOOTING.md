# Redis/KV Environment Variables Troubleshooting

## Current Status
Your `/api/health` endpoint shows:
- ❌ No Redis/KV environment variables detected
- ❌ `availableEnvVarNames: []` (empty array)
- ❌ `redisStatus: "no_env_vars"`

## Step-by-Step Fix

### Step 1: Verify Integration is Connected

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your **project-manager** project
3. Navigate to **Settings** → **Integrations**
4. Look for **"Upstash Redis"** or **"Redis"** integration
5. **If it's NOT listed or shows "Not Connected"**:
   - Click **"Browse Marketplace"** or **"Add Integration"**
   - Search for **"Upstash Redis"**
   - Click **"Add"** or **"Install"**
   - Select your project
   - Follow the prompts to create/connect the database
   - **Make sure to select "Production" environment**

### Step 2: Verify Environment Variables

1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Look for these variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - OR (if using Vercel KV):
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`

3. **CRITICAL**: For each variable, check the checkboxes:
   - ✅ **Production** (MUST be checked)
   - ✅ Preview (optional but recommended)
   - ✅ Development (optional)

4. **If variables are missing**:
   - The integration might not be properly connected
   - Try disconnecting and reconnecting the integration
   - Or manually add them (see Step 3)

### Step 3: Manual Environment Variable Setup (If Integration Failed)

If the integration didn't automatically add variables, you can add them manually:

1. Go to **Settings** → **Environment Variables**
2. Click **"Add New"**
3. Add these variables one by one:

**For Upstash Redis:**
- Name: `UPSTASH_REDIS_REST_URL`
- Value: (Get from Upstash dashboard or integration details)
- Environments: ✅ Production, ✅ Preview, ✅ Development

- Name: `UPSTASH_REDIS_REST_TOKEN`
- Value: (Get from Upstash dashboard or integration details)
- Environments: ✅ Production, ✅ Preview, ✅ Development

**For Vercel KV (if using):**
- Name: `KV_REST_API_URL`
- Value: (Get from Vercel KV dashboard)
- Environments: ✅ Production, ✅ Preview, ✅ Development

- Name: `KV_REST_API_TOKEN`
- Value: (Get from Vercel KV dashboard)
- Environments: ✅ Production, ✅ Preview, ✅ Development

### Step 4: Redeploy (CRITICAL!)

**Environment variables are ONLY available to NEW deployments.**

1. Go to **Deployments** tab
2. Find your latest deployment
3. Click the **"..."** (three dots) menu
4. Select **"Redeploy"**
5. Wait for deployment to complete

**OR** push a new commit to trigger a new deployment:
```bash
git commit --allow-empty -m "Trigger redeploy for env vars"
git push
```

### Step 5: Verify After Redeploy

1. Wait for deployment to complete (2-3 minutes)
2. Visit: `https://project-manager.greyquill.io/api/health`
3. You should now see:
   - ✅ `hasUpstashEnv: true` OR `hasVercelKVEnv: true`
   - ✅ `redisStatus: "connected"`
   - ✅ `availableEnvVarNames` should list the variables

### Step 6: Test Project Creation

1. Go to: `https://project-manager.greyquill.io/projects`
2. Click **"Create Project"** or **"New Project"**
3. Fill in the form and submit
4. It should work without the "Missing environment variables" error

## Common Issues

### Issue: Variables exist but aren't available at runtime

**Cause**: Variables not enabled for Production environment

**Fix**:
1. Go to Settings → Environment Variables
2. For each variable, ensure **Production** checkbox is checked
3. Redeploy

### Issue: Integration shows as connected but variables are missing

**Cause**: Integration might be connected to a different project or environment

**Fix**:
1. Disconnect the integration
2. Reconnect it, making sure to select the correct project
3. Verify variables appear in Environment Variables
4. Redeploy

### Issue: Variables are set but health check still shows "no_env_vars"

**Cause**: Deployment was created before variables were added

**Fix**:
1. **Redeploy** (this is the most common fix)
2. Environment variables are only injected into new deployments

## Still Not Working?

If after following all steps, the health check still shows no variables:

1. **Check Vercel Dashboard**:
   - Go to your project → Settings → Environment Variables
   - Take a screenshot showing the variables and their environment checkboxes
   - Verify the variable names are EXACTLY:
     - `UPSTASH_REDIS_REST_URL` (case-sensitive)
     - `UPSTASH_REDIS_REST_TOKEN` (case-sensitive)

2. **Check Integration Status**:
   - Go to Settings → Integrations
   - Verify the Redis/Upstash integration shows as "Connected"
   - Check which project it's connected to

3. **Check Deployment Logs**:
   - Go to Deployments → Latest deployment → Logs
   - Look for any errors related to environment variables

4. **Try Manual Variable Addition**:
   - If integration isn't working, manually add the variables
   - Get the values from the Upstash dashboard (if you have access)
   - Or reconnect the integration and copy the values it provides

## Quick Checklist

- [ ] Integration is connected in Vercel
- [ ] Environment variables exist in Settings → Environment Variables
- [ ] Variables are enabled for **Production** environment
- [ ] Project has been **redeployed** after adding variables
- [ ] Health check (`/api/health`) shows variables are available
- [ ] Can create projects without errors


