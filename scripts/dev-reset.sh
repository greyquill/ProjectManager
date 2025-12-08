#!/bin/bash
# Development reset script - clears all caches and restarts dev server

echo "🧹 Clearing Next.js cache..."
rm -rf .next

echo "🧹 Clearing node_modules cache..."
rm -rf node_modules/.cache

echo "🚀 Starting development server..."
NODE_OPTIONS='--no-deprecation' next dev --port 3004

