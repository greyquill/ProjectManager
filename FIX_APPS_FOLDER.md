# Fix: Apps Folder Issue

## Problem
The `apps/pm-app` folder was being created even though we restructured to a simplified root layout.

## Solution Applied

### 1. Updated `.gitignore`
Added `/apps/` to prevent the folder from being tracked:
```
# legacy apps folder (should not exist)
/apps/
```

### 2. Updated `next.config.js`
Explicitly set `distDir: '.next'` to ensure Next.js uses the root `.next` folder:
```javascript
const nextConfig = {
  distDir: '.next',  // Explicitly set to root
  // ... rest of config
}
```

### 3. Verified Structure
- ✅ `.next` folder exists in root (correct)
- ✅ `apps` folder does not exist (correct)
- ✅ Build works correctly

## Verification

To verify Next.js is using the root `.next` folder:

```bash
# Check .next exists in root
ls -la .next

# Check apps folder doesn't exist
test -d apps && echo "ERROR: apps exists" || echo "OK: apps does not exist"

# Run build
npm run build

# Verify .next was created/updated in root
ls -la .next
```

## If Apps Folder Reappears

If the `apps` folder gets recreated:

1. **Check for workspace config**: Make sure `package.json` doesn't have `workspaces` field
2. **Check package-lock.json**: May need to regenerate it:
   ```bash
   rm package-lock.json
   npm install
   ```
3. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run build
   ```

## Current Status

✅ **Fixed**: Next.js now explicitly uses root `.next` folder
✅ **Ignored**: `/apps/` added to `.gitignore`
✅ **Verified**: Build works correctly with root structure

