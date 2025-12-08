# Deployment Guide

## Important: GitHub Pages Limitations

⚠️ **This application uses server-side features that GitHub Pages cannot support:**

- **API Routes** (`/api/*`) - Require a Node.js server
- **File System Operations** - Reading/writing JSON files needs server access
- **Middleware** - Authentication middleware needs server-side execution
- **Dynamic Routes** - Server-side data fetching

GitHub Pages only serves **static HTML/CSS/JS files** and cannot run a Node.js server.

## Deployment Options

### Option 1: Vercel (Recommended) ✅

**Free Tier (Hobby Plan):**
- ✅ **100 GB bandwidth/month**
- ✅ **6,000 build minutes/month**
- ✅ **Unlimited projects and deployments**
- ✅ **Custom domains** (including subdomains like `project-manager.greyquill.io`)
- ✅ **Free SSL certificates**
- ✅ **Global CDN**

Vercel is built by the Next.js team and supports all Next.js features:

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up (free)
3. Click "Add New Project" → Import your GitHub repository
4. Vercel will automatically detect Next.js and deploy
5. Add custom domain: Project Settings → Domains → Add `project-manager.greyquill.io`
6. Update DNS: Add a CNAME record pointing `project-manager` to `cname.vercel-dns.com`

**Advantages:**
- ✅ Full Next.js support (API routes, middleware, etc.)
- ✅ Automatic deployments on git push
- ✅ Zero configuration needed
- ✅ Built-in analytics and monitoring
- ✅ Preview deployments for PRs

**Custom Domain Setup for `project-manager.greyquill.io`:**
1. In Vercel dashboard: Settings → Domains → Add Domain
2. Enter: `project-manager.greyquill.io`
3. Vercel will show DNS instructions
4. In your DNS provider (where `greyquill.io` is managed):
   - Add CNAME record: `project-manager` → `cname.vercel-dns.com`
   - Or A record: `project-manager` → Vercel's IP (shown in dashboard)
5. Wait for DNS propagation (usually 5-10 minutes)
6. Vercel automatically provisions SSL certificate

### Option 2: Cloudflare Pages ⚠️

**Free Tier:**
- ✅ **Unlimited bandwidth**
- ✅ **500 builds/month**
- ✅ **Unlimited sites**
- ✅ **Custom domains** (including subdomains)
- ✅ **Free SSL certificates**
- ✅ **Global CDN**

**Important Limitation:**
- ⚠️ **API Routes require Cloudflare Workers** (also free, but needs additional setup)
- ⚠️ **File system operations** need to be moved to Workers or external storage
- ⚠️ **More complex setup** than Vercel

**Setup Steps:**

1. Push your code to GitHub
2. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → Pages
3. Connect your GitHub repository
4. Build settings:
   - Framework preset: Next.js
   - Build command: `npm run build`
   - Build output directory: `.next`
5. For API routes, you'll need to:
   - Set up Cloudflare Workers (free tier: 100,000 requests/day)
   - Migrate API routes to Workers
   - Update client code to call Workers endpoints

**Custom Domain Setup for `project-manager.greyquill.io`:**
1. In Cloudflare Pages: Settings → Custom domains → Add domain
2. Enter: `project-manager.greyquill.io`
3. If `greyquill.io` is already on Cloudflare DNS:
   - Add CNAME: `project-manager` → `your-project.pages.dev`
4. If not on Cloudflare:
   - Add CNAME in your DNS provider: `project-manager` → `your-project.pages.dev`
5. Cloudflare automatically provisions SSL

**Advantages:**
- ✅ Generous free tier (unlimited bandwidth)
- ✅ Excellent global CDN
- ✅ DDoS protection included
- ✅ Custom domain support

**Disadvantages:**
- ⚠️ API routes need Workers setup (more complex)
- ⚠️ Requires refactoring for file system operations
- ⚠️ More configuration needed

### Option 3: Netlify

Similar to Vercel:

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Import your GitHub repository
4. Set build command: `npm run build`
5. Set publish directory: `.next`

**Advantages:**
- ✅ Full Next.js support
- ✅ Free tier available (100 GB bandwidth/month)
- ✅ Custom domain support

### Option 3: GitHub Pages (Static Export Only) ⚠️

⚠️ **WARNING**: The build will fail because this app uses server-side features that cannot be statically exported.

#### Why It Won't Work

The build will fail with errors like:
- `Error: Cannot use output: 'export' with API routes`
- `Error: Route "/api/..." cannot be statically exported`
- `Error: Route "/projects/[...]" uses 'force-dynamic' which cannot be exported`

#### If You Still Want to Try

1. **Update basePath** (if using GitHub subdomain):
   - For custom domain (e.g., `project-manager.greyquill.io`): Leave basePath empty
   - For GitHub subdomain (e.g., `username.github.io/repo`): Set `GITHUB_PAGES_BASE_PATH=/repo-name` in workflow

2. **Remove or comment out**:
   - All API routes (`src/app/api/**`)
   - `export const dynamic = 'force-dynamic'` from pages
   - Middleware (`src/middleware.ts`)
   - File system operations in components

3. **Refactor to client-side only**:
   - Move data storage to external service (Firebase, Supabase, etc.)
   - Handle authentication client-side only
   - Use client-side data fetching

4. **Build for GitHub Pages**:
   ```bash
   npm run build:gh-pages
   ```

**This is not recommended** as it requires significant refactoring and loses core functionality.

## Recommendation

### For Your Use Case (`project-manager.greyquill.io`):

**✅ Best Choice: Vercel**
- **100% free** for personal projects
- **Zero configuration** - works out of the box
- **Full Next.js support** - API routes, middleware, file system all work
- **Easy custom domain** setup
- **Automatic SSL** certificates
- **Perfect for this app** - no refactoring needed

**Setup Time:** ~5 minutes

**Alternative: Cloudflare Pages**
- Also free with unlimited bandwidth
- Requires Workers setup for API routes (more complex)
- Better if you need unlimited bandwidth and are already using Cloudflare
- Requires some refactoring

**Setup Time:** ~30-60 minutes (due to Workers configuration)

---

## Quick Start: Deploy to Vercel

### 1. Prepare Your Repository

Make sure your code is pushed to GitHub:
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

1. **Sign up/Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub (recommended) or email
   - Free account is sufficient

2. **Import Your Project**
   - Click "Add New Project" or "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Project** (usually auto-detected)
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (root)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install` (auto-detected)

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your app will be live at `your-project.vercel.app`

### 3. Add Custom Domain `project-manager.greyquill.io`

1. **In Vercel Dashboard:**
   - Go to your project
   - Click "Settings" → "Domains"
   - Click "Add Domain"
   - Enter: `project-manager.greyquill.io`
   - Click "Add"

2. **Vercel will show DNS instructions:**
   - You'll see something like: `CNAME project-manager → cname.vercel-dns.com`
   - Or IP addresses if using A records

3. **Update Your DNS** (where you manage `greyquill.io`):
   - Log into your DNS provider (where `greyquill.io` domain is registered)
   - Add a CNAME record:
     - **Name/Host:** `project-manager`
     - **Value/Target:** `cname.vercel-dns.com` (or the value Vercel shows)
     - **TTL:** 3600 (or default)

4. **Wait for DNS Propagation:**
   - Usually takes 5-10 minutes
   - Vercel will automatically provision SSL certificate
   - You'll see "Valid Configuration" in Vercel dashboard when ready

### 4. Automatic Deployments

Vercel automatically:
- ✅ Deploys on every push to `main` branch
- ✅ Creates preview deployments for pull requests
- ✅ Provides deployment URLs for each commit
- ✅ Handles rollbacks if needed

## Vercel Project Configuration

Your project is already configured for Vercel:
- ✅ Next.js 14.2.4 (fully supported)
- ✅ API routes (will work on Vercel)
- ✅ Middleware (will work on Vercel)
- ✅ File system operations (will work on Vercel)
- ✅ No special configuration needed

## Environment Variables (if needed)

If you add environment variables later:
1. Go to Project Settings → Environment Variables
2. Add variables for Production, Preview, and Development
3. Redeploy after adding variables

**Note:** Currently, your app doesn't require any environment variables.

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Check Node.js version (Vercel uses Node 18+ by default)

### Domain Not Working
- Wait 10-15 minutes for DNS propagation
- Check DNS records are correct
- Verify CNAME points to Vercel's DNS
- Check Vercel dashboard shows "Valid Configuration"

### API Routes Not Working
- Ensure routes are in `src/app/api/` directory
- Check Vercel function logs in dashboard
- Verify routes are exported correctly

## Post-Deployment

After deployment:
1. ✅ Test your app at `project-manager.greyquill.io`
2. ✅ Test API routes
3. ✅ Test authentication
4. ✅ Test file operations

Everything should work exactly as it does locally!

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Vercel Support: [vercel.com/support](https://vercel.com/support)

---

**That's it!** Your app will be live and automatically deploy on every git push. 🚀
