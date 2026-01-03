#!/bin/bash
# Interactive script to fix Vercel environment variables

set -e

echo "🔧 Vercel Environment Variables Fix"
echo "===================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "❌ Vercel CLI not found. Installing..."
  npm i -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
  echo "🔐 Please login to Vercel:"
  vercel login
fi

echo "📋 Step 1: Link to your project"
echo "-------------------------------"
echo ""

# Try to link
if [ ! -f .vercel/project.json ]; then
  echo "Project not linked. Let's link it now..."
  echo ""
  echo "When prompted:"
  echo "  1. Select your team/account"
  echo "  2. Select your project (project-manager or similar)"
  echo "  3. Use default settings"
  echo ""
  read -p "Press Enter to continue with linking..."
  vercel link
else
  echo "✅ Project already linked"
  cat .vercel/project.json | grep -o '"name":"[^"]*"' | head -1
fi

echo ""
echo "📋 Step 2: Check current environment variables"
echo "----------------------------------------------"
vercel env ls production 2>/dev/null | grep -E "KV_REST_API|UPSTASH" || echo "  (none found)"

echo ""
echo "📋 Step 3: Remove old variables (if they exist)"
echo "-----------------------------------------------"
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
echo "Adding KV_REST_API_READ_ONLY_TOKEN (optional)..."
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
else
  echo "💡 To redeploy later, run: vercel --prod"
  echo ""
  echo "Or redeploy from Vercel Dashboard:"
  echo "  Deployments → Latest → Redeploy"
fi

echo ""
echo "✅ Done!"
echo ""
echo "Next steps:"
echo "  1. Wait for deployment to complete"
echo "  2. Visit: https://project-manager.greyquill.io/projects"
echo "  3. Projects should now appear"

