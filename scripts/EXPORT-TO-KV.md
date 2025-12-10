# Export to KV Script

This script exports epics and stories from the local file system to Vercel KV (Redis).

## Prerequisites

1. **Environment Variables**: Create a `.env.local` file in the project root with your KV credentials:
   ```bash
   KV_REST_API_URL="https://your-redis-instance.upstash.io"
   KV_REST_API_TOKEN="your-token-here"
   ```

2. **Dependencies**: Install required packages (already done):
   ```bash
   npm install
   ```

3. **Project Name Consistency**: The project name must be identical for both local files and KV storage. The folder name in `/pm/` must match the project name in KV.

4. **People Data in KV**: ⚠️ **IMPORTANT**: Ensure `people.json` exists in KV before exporting epics. The script will check and warn if people data is missing, but it will not export people data automatically. Project metadata (manager, contributors) references person IDs, so missing people data will cause display issues in the UI.

## Usage

### Basic Usage
```bash
npm run export-to-kv <project-name> --
```

**Note**: Use `--` after the project name to pass arguments through npm scripts.

### With Options
```bash
# Dry run (preview without exporting)
npm run export-to-kv <project-name> -- --dry-run

# Force overwrite existing stories
npm run export-to-kv <project-name> -- --force

# Create backup before exporting
npm run export-to-kv <project-name> -- --backup

# Export specific epics only
npm run export-to-kv <project-name> -- --epics=epic1,epic2

# Combine options (example)
npm run export-to-kv umami-healthcare -- --dry-run --backup --epics=revenue-cycle-management
```

### Project Name Requirement

**Important**: The project name must be the same for both local files and KV storage:

- **Local Folder**: `/pm/<project-name>/project.json` (e.g., `/pm/umami-healthcare/`)
- **KV Storage**: `pm:project:<project-name>` (e.g., `pm:project:umami-healthcare`)

The script will error if it detects any mismatch between local and remote project names.

## Features

- **Interactive Epic Selection**: If `--epics` is not provided, the script will prompt you to select which epics to export
- **Duplicate Detection**: Automatically skips stories that already exist in KV (unless `--force` is used)
- **Story Ordering**: Preserves story order from local `epic.json`
- **Backup Creation**: Downloads current KV data to `kv-backups/` folder before export
- **Dry Run Mode**: Preview what would be exported without making changes
- **Error Handling**: Continues with remaining items if individual stories fail
- **Comprehensive Logging**: Shows progress and detailed summary

## Export Behavior

### Stories
- **New Stories**: Exported to KV
- **Existing Stories**: Skipped (unless `--force` is used)
- **Order**: Preserved from local `epic.json` `storyIds` array

### Epics
- **New Epics**: Created in KV with all metadata
- **Existing Epics**: Updated with merged `storyIds` array (local order preserved)
- **Metadata**: All epic fields are synced from local files

### Project
- Project metadata is updated to include exported epics in `epicIds` array

## Backup

When using `--backup`, the script creates a JSON backup file in `kv-backups/` folder:
- Format: `<project-name>-backup-<timestamp>.json`
- Contains: Project, all epics, and all stories from KV
- Purpose: Local backup before making changes (no remote backup to avoid costs)

## Example Output

```
🚀 Starting Export
   Project Name: umami-healthcare
   Mode: LIVE
   Force: No (skip existing)

📦 Exporting Epic: revenue-cycle-management
ℹ️  Found 42 stories in local epic
ℹ️  Epic exists in KV with 0 stories
  ✅ Exported F-RCM-001
  ✅ Exported F-RCM-002
  ⏭️  Skipped F-RCM-003 (already exists)
  ...

✅ Export completed!

📊 Export Summary
============================================================
Epics Processed: 1
Stories Exported: 40
Stories Skipped: 2
Stories Failed: 0
============================================================
```

## Important Notes

1. **People Data Check**: The script automatically checks if `people.json` exists in KV at the start and end of the export process. If missing, it will display warnings. **The script does NOT export `people.json`** - you must ensure people data is present in KV before using exported data. You can:
   - Copy `pm/people.json` to KV manually
   - Use the People page in the UI to add people (which writes to KV)
   - Ensure person IDs in `project.json` metadata match the IDs in KV

2. **No Overwrites by Default**: Existing stories in KV are never overwritten unless `--force` is explicitly used.

3. **Story Ordering**: The script preserves story order from local files. If a story exists in KV but not in local, it's appended to the end.

4. **Error Handling**: If a story fails to export, the script logs the error and continues with remaining stories.

5. **Environment Variables**: The script reads from `.env.local` file. Make sure it exists and contains valid KV credentials.

## Troubleshooting

### "Missing required environment variables"
- Ensure `.env.local` exists in project root
- Verify `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set

### "Project not found locally"
- Verify the project folder exists in `pm/<project-name>/`
- Check that `project.json` exists in the project folder

### "No epics found"
- Ensure epic folders exist in `pm/<project-name>/`
- Check that `epic.json` files exist in epic folders

### Network Errors
- Check your internet connection
- Verify KV credentials are correct
- Ensure KV instance is accessible

### "people.json does NOT exist in KV"
- **Before exporting**: Ensure people data is in KV. The script checks this and will warn you.
- **After exporting**: If you see this warning, export `pm/people.json` to KV using the People page in the UI or manually copy it.
- **Person ID Mismatch**: If project metadata shows person IDs that don't exist in KV, update `project.json` metadata to match the person IDs in KV, then re-export the project using `npm run update-project-kv <project-name>`.

## Safety

- **Dry Run**: Always test with `--dry-run` first
- **Backup**: Use `--backup` for important exports
- **No Remote Backup**: Backups are only local (to avoid KV costs)
- **No Overwrites**: By default, existing data is never overwritten

