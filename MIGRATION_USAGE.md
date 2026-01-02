# Migration Script Usage Guide

## Quick Start

### Migrate All Data (First Time)

```bash
# 1. Make sure Redis is running
npm run redis:start

# 2. Run migration (dry-run first to preview)
npm run migrate-to-local-kv -- --dry-run

# 3. Run actual migration
npm run migrate-to-local-kv
```

### Update Data in Redis (After Making Changes to /pm)

```bash
# Migrate all changes (skips existing data by default)
npm run migrate-to-local-kv

# Force overwrite everything
npm run migrate-to-local-kv -- --force

# Migrate only specific project
npm run migrate-to-local-kv -- --project=umami-healthcare
```

## Command Options

### Basic Usage

```bash
# Dry run (preview without migrating)
npm run migrate-to-local-kv -- --dry-run

# Force overwrite existing data
npm run migrate-to-local-kv -- --force

# Migrate specific project only
npm run migrate-to-local-kv -- --project=umami-healthcare

# Combine options
npm run migrate-to-local-kv -- --project=umami-healthcare --force
```

## What Gets Migrated

The script automatically migrates:

1. **People Data** (`pm/people.json`)
   - Global people list
   - All person records

2. **Projects** (all `pm/[project-name]/project.json`)
   - Project metadata
   - Project configuration

3. **Epics** (all `pm/[project-name]/[epic-name]/epic.json`)
   - Epic metadata
   - Epic configuration

4. **Stories** (all `pm/[project-name]/[epic-name]/STORY-*.json`)
   - All story files (F-* and NFR-*)
   - Story data and metadata

## Behavior

### Idempotent (Safe to Run Multiple Times)

- **By default**: Skips data that already exists in KV
- **With `--force`**: Overwrites existing data
- **Safe**: Can run multiple times without duplicating data

### Automatic Discovery

- Discovers all projects in `/pm`
- Discovers all epics in each project
- Discovers all stories in each epic
- No manual configuration needed

### Progress Tracking

Shows real-time progress:
- ✅ Successfully migrated items
- ⚠️  Warnings (skipped items, etc.)
- ❌ Errors (with details)

## Example Output

```
🚀 Starting Full Migration from /pm to Local KV
   Mode: LIVE
   Force: No (skip existing)

👥 Migrating People Data...
✅ Migrated 2 people to KV

📋 Found 1 project(s) to migrate

📁 Migrating Project: umami-healthcare
✅ Project metadata migrated
Found 15 epic(s)
  📦 Epic: revenue-cycle-management
    ✅ Epic metadata migrated
    Found 45 story/stories
    ✅ Migrated 45/45 stories
  📦 Epic: intelligent-scheduling
    ✅ Epic metadata migrated
    Found 32 story/stories
    ✅ Migrated 32/32 stories
  ...

📊 Migration Summary
============================================================
✅ People: Migrated
✅ umami-healthcare: 15 epics, 523 stories

📈 Totals:
   Projects: 1/1 migrated
   Epics: 15 migrated
   Stories: 523 migrated

✅ Migration complete!
```

## Workflow: Making Changes

### Scenario 1: You Modified Files in /pm

```bash
# After editing files in /pm, sync to KV
npm run migrate-to-local-kv
```

### Scenario 2: You Added New Stories

```bash
# New stories will be automatically discovered and migrated
npm run migrate-to-local-kv
```

### Scenario 3: You Want to Overwrite Everything

```bash
# Force overwrite all data in KV
npm run migrate-to-local-kv -- --force
```

## Troubleshooting

### "KV not configured"

**Solution:**
1. Check `.env.local` has:
   ```bash
   USE_LOCAL_KV=true
   UPSTASH_REDIS_REST_URL=http://localhost:8080
   UPSTASH_REDIS_REST_TOKEN=local-dev-token
   ```

2. Verify Redis is running:
   ```bash
   npm run redis:status
   ```

### "File not found" Errors

**Solution:**
- Check that `/pm` directory exists
- Verify file paths are correct
- Check file permissions

### Migration Partially Failed

**Solution:**
1. Check the error messages in the summary
2. Fix the issues (e.g., invalid JSON, missing files)
3. Run migration again (it will skip successfully migrated items)

### Data Not Appearing in App

**Solution:**
1. Verify migration completed successfully
2. Check KV connection: `npm run test:local-kv`
3. Restart dev server: `npm run dev`
4. Check migration status: `npm run check:migration`

## Next Steps After Migration

1. **Verify Migration:**
   ```bash
   npm run check:migration
   ```

2. **Test Application:**
   - Start dev server: `npm run dev`
   - Visit `http://localhost:3004`
   - Verify all projects/epics/stories appear

3. **Switch to KV-Only Mode** (Phase 5):
   - Once verified, you can switch to KV-only mode
   - App will use KV exclusively

4. **Archive /pm** (Phase 6):
   - Once confident, rename `/pm` to `/pm-backup`

## Automation Tips

### Watch for Changes (Optional)

You can set up a file watcher to auto-migrate on changes:

```bash
# Using nodemon (install: npm install -g nodemon)
nodemon --watch pm --exec "npm run migrate-to-local-kv"
```

### Scheduled Sync (Optional)

Add to your workflow:
- Run migration before starting work
- Run migration after making bulk changes
- Run migration before committing changes

## Related Commands

```bash
# Check what needs migration
npm run check:migration

# Test KV connection
npm run test:local-kv

# View Redis data (via Redis CLI)
docker-compose exec redis redis-cli
> KEYS pm:*
> GET pm:project:umami-healthcare
```

