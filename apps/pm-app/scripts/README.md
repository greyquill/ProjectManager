# CLAUDE.md Scripts

This directory contains scripts for automating CLAUDE.md updates.

## Scripts

### `update-claude-md.js`
Updates the CLAUDE.md file with current project information and timestamps.

**Usage:**
```bash
# Update CLAUDE.md
npm run update-claude

# Dry run (shows what would change)
npm run update-claude:dry-run
```

### `setup-git-hook.sh`
Sets up a git pre-commit hook to automatically update CLAUDE.md before each commit.

**Usage:**
```bash
# Run once to setup the hook
npm run setup-git-hook

# Or run directly
bash scripts/setup-git-hook.sh
```

## Automation Strategy

The CLAUDE.md files serve as context for AI assistants (like Cursor AI). They should be kept up-to-date with:
- Current project structure
- Latest dependencies
- API routes and patterns
- Important notes and guidelines

The scripts ensure these files stay current automatically.

