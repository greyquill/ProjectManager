#!/bin/bash
# Script to update Vercel environment variables after logging into correct account

set -e

echo "🔧 Updating Vercel Environment Variables"
echo "=========================================="
echo ""

# Check if logged in
if ! vercel whoami &> /dev/null; then
  echo "❌ Not logged in. Please run: vercel login"
  exit 1
fi

echo "✅ Logged in as: $(vercel whoami)"
echo ""

# Check if project is linked
if [ ! -f .vercel/project.json ]; then
  echo "📋 Step 1: Link to your project"
  echo "-------------------------------"
  echo "When prompted:"
  echo "  - Select your PERSONAL account (not Greyquill Projects)"
  echo "  - Select your project (project-manager or similar)"
  echo ""
  read -p "Press Enter to continue..."
  vercel link
else
  echo "✅ Project already linked"
  PROJECT_NAME=$(cat .vercel/project.json | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "   Project: $PROJECT_NAME"
fi

echo ""
echo "📋 Step 2: Current environment variables"
echo "----------------------------------------"
vercel env ls production 2>/dev/null | grep -E "KV_REST_API|UPSTASH" || echo "  (none found)"

echo ""
echo "📋 Step 3: Remove old variables"
echo "-------------------------------"
read -p "Remove old KV_REST_API_URL? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  vercel env rm KV_REST_API_URL production --yes 2>/dev/null && echo "  ✅ Removed" || echo "  ℹ️  Not found (that's okay)"
fi

read -p "Remove old KV_REST_API_TOKEN? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  vercel env rm KV_REST_API_TOKEN production --yes 2>/dev/null && echo "  ✅ Removed" || echo "  ℹ️  Not found (that's okay)"
fi

echo ""
echo "📋 Step 4: Add new variables"
echo "---------------------------"
echo "Adding KV_REST_API_URL..."
echo "https://legal-snake-12550.upstash.io" | vercel env add KV_REST_API_URL production
echo "✅ Added"

echo ""
echo "Adding KV_REST_API_TOKEN..."
echo "ATEGAAIncDI4OThlNmUyNTU5MWU0NDE2OTVjMTQzYjAyZjc4MWJiY3AyMTI1NTA" | vercel env add KV_REST_API_TOKEN production
echo "✅ Added"

echo ""
echo "Adding KV_REST_API_READ_ONLY_TOKEN..."
echo "AjEGAAIgcDL1WPE3Y1TfpfW51GCaUtwdqFNkRITr_5lpu18ravYs5w" | vercel env add KV_REST_API_READ_ONLY_TOKEN production
echo "✅ Added"

echo ""
echo "📋 Step 5: Verify"
echo "----------------"
vercel env ls production | grep -E "KV_REST_API|UPSTASH"

echo ""
echo "📋 Step 6: Redeploy"
echo "-------------------"
read -p "Redeploy to production now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🚀 Redeploying..."
  vercel --prod
  echo ""
  echo "✅ Deployment started!"
  echo ""
  echo "Next steps:"
  echo "  1. Wait for deployment to complete"
  echo "  2. Visit: https://project-manager.greyquill.io/projects"
  echo "  3. Projects should now appear"
else
  echo "💡 To redeploy later:"
  echo "  - Run: vercel --prod"
  echo "  - Or: Vercel Dashboard → Deployments → Redeploy"
fi

echo ""
echo "✅ Done!"

