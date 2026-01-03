#!/bin/bash
# Script to update Vercel environment variables via CLI

echo "🔧 Updating Vercel Environment Variables"
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

echo "📋 Current environment variables:"
vercel env ls production 2>/dev/null | grep -E "KV_REST_API|UPSTASH" || echo "  (none found)"

echo ""
read -p "Delete old KV_REST_API_URL? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  vercel env rm KV_REST_API_URL production --yes 2>/dev/null || echo "  (variable not found or already deleted)"
fi

read -p "Delete old KV_REST_API_TOKEN? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  vercel env rm KV_REST_API_TOKEN production --yes 2>/dev/null || echo "  (variable not found or already deleted)"
fi

echo ""
echo "➕ Adding new variables..."

# Add new URL
echo "https://legal-snake-12550.upstash.io" | vercel env add KV_REST_API_URL production

# Add new token
echo "ATEGAAIncDI4OThlNmUyNTU5MWU0NDE2OTVjMTQzYjAyZjc4MWJiY3AyMTI1NTA" | vercel env add KV_REST_API_TOKEN production

# Add read-only token
echo "AjEGAAIgcDL1WPE3Y1TfpfW51GCaUtwdqFNkRITr_5lpu18ravYs5w" | vercel env add KV_REST_API_READ_ONLY_TOKEN production

echo ""
echo "✅ Environment variables updated!"
echo ""
echo "📋 Updated variables:"
vercel env ls production 2>/dev/null | grep -E "KV_REST_API|UPSTASH"

echo ""
read -p "Redeploy to production now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🚀 Redeploying..."
  vercel --prod
else
  echo "💡 To redeploy later, run: vercel --prod"
fi

