#!/usr/bin/env node

/**
 * Script to automatically update CLAUDE.md files with current project structure
 * Can be run manually or as a git pre-commit hook
 */

const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const claudeMdPath = path.join(projectRoot, 'CLAUDE.md')

// Check if running in dry-run mode
const isDryRun = process.argv.includes('--dry-run')

console.log(`[CLAUDE.md Update] ${isDryRun ? 'DRY RUN MODE' : 'Running'}...`)

// Get current timestamp
const timestamp = new Date().toISOString().split('T')[0]

// Read current CLAUDE.md
let content = fs.readFileSync(claudeMdPath, 'utf-8')

// Update the "Last Updated" timestamp
const updatedContent = content.replace(
  /\*\*Last Updated\*\*: .+/,
  `**Last Updated**: ${timestamp}`
)

if (isDryRun) {
  console.log('[CLAUDE.md Update] Would update timestamp to:', timestamp)
  console.log('[CLAUDE.md Update] No changes written (dry-run mode)')
} else {
  fs.writeFileSync(claudeMdPath, updatedContent, 'utf-8')
  console.log('[CLAUDE.md Update] Successfully updated CLAUDE.md')
  console.log('[CLAUDE.md Update] New timestamp:', timestamp)
}

process.exit(0)

