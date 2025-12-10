#!/usr/bin/env tsx
/**
 * Cleanup script to remove a project and all its data from KV storage
 *
 * Usage: npm run cleanup-kv-project <project-name> [--dry-run] [--confirm]
 *
 * Example:
 *   npm run cleanup-kv-project healthcare-platform -- --dry-run
 *   npm run cleanup-kv-project healthcare-platform -- --confirm
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Color logging functions
function log(message: string, color: 'red' | 'green' | 'yellow' | 'cyan' | 'bright' | 'reset' = 'reset') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bright: '\x1b[1m',
    reset: '\x1b[0m',
  }
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logError(message: string) {
  log(`❌ ${message}`, 'red')
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green')
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'cyan')
}

// Validate environment
function validateEnvironment() {
  const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  const hasRedis = !!process.env.REDIS_URL

  if (!hasKV && !hasUpstash && !hasRedis) {
    logError('Missing required environment variables')
    logInfo('Please ensure one of the following is set in .env.local:')
    logInfo('  - KV_REST_API_URL and KV_REST_API_TOKEN (Vercel KV)')
    logInfo('  - UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (Upstash Redis)')
    logInfo('  - REDIS_URL (Generic Redis)')
    process.exit(1)
  }
}

// Get KV client
let kvClient: any = null

function getKVClient() {
  if (kvClient) return kvClient

  const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  const hasVercelKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

  try {
    // Try Upstash Redis first (Marketplace - recommended)
    if (hasUpstash) {
      try {
        const { Redis } = require('@upstash/redis')
        kvClient = Redis.fromEnv()
        logInfo('Using Upstash Redis client')
        return kvClient
      } catch (error: any) {
        logWarning(`Failed to initialize Upstash Redis: ${error?.message}`)
      }
    }

    // Fall back to Vercel KV (legacy)
    if (hasVercelKV) {
      try {
        const vercelKv = require('@vercel/kv')
        kvClient = vercelKv.kv
        logInfo('Using Vercel KV client')
        return kvClient
      } catch (error: any) {
        logWarning(`Failed to initialize Vercel KV: ${error?.message}`)
      }
    }

    throw new Error('Could not initialize KV client')
  } catch (error: any) {
    logError(`Failed to initialize KV client: ${error?.message}`)
    process.exit(1)
  }
}

// Key patterns for a project
function getProjectKeys(projectName: string): string[] {
  const keys: string[] = []

  // Main project key
  keys.push(`pm:project:${projectName}`)

  // Note: pm:projects:list is NOT deleted - we only remove the project name from the array
  // This is handled separately by removeFromProjectsList()

  // Project epics list
  keys.push(`pm:project:${projectName}:epics:list`)

  return keys
}

function getEpicKeys(projectName: string, epicName: string): string[] {
  const keys: string[] = []

  // Epic key
  keys.push(`pm:project:${projectName}:epic:${epicName}`)

  // Epic stories list
  keys.push(`pm:project:${projectName}:epic:${epicName}:stories:list`)

  return keys
}

function getStoryKey(projectName: string, epicName: string, storyId: string): string {
  return `pm:project:${projectName}:epic:${epicName}:story:${storyId}`
}

// Read project from KV to get epic names
async function readProjectFromKV(projectName: string): Promise<any> {
  const kv = getKVClient()
  const key = `pm:project:${projectName}`
  const data = await kv.get(key)
  if (!data) {
    throw new Error(`Project "${projectName}" not found in KV`)
  }
  return data
}

// List epics for a project
async function listEpicsFromKV(projectName: string): Promise<string[]> {
  const kv = getKVClient()
  const key = `pm:project:${projectName}:epics:list`
  const data = await kv.get(key)
  return Array.isArray(data) ? data : []
}

// List stories for an epic
async function listStoriesFromKV(projectName: string, epicName: string): Promise<string[]> {
  const kv = getKVClient()
  const key = `pm:project:${projectName}:epic:${epicName}:stories:list`
  const data = await kv.get(key)
  return Array.isArray(data) ? data : []
}

// Delete a key from KV
async function deleteKey(key: string, dryRun: boolean): Promise<boolean> {
  if (dryRun) {
    logInfo(`[DRY RUN] Would delete: ${key}`)
    return true
  }

  try {
    const kv = getKVClient()
    await kv.del(key)
    return true
  } catch (error: any) {
    logError(`Failed to delete ${key}: ${error?.message}`)
    return false
  }
}

// Remove project from projects list
async function removeFromProjectsList(projectName: string, dryRun: boolean): Promise<void> {
  const kv = getKVClient()
  const listKey = `pm:projects:list`

  if (dryRun) {
    logInfo(`[DRY RUN] Would remove "${projectName}" from projects list`)
    return
  }

  try {
    const projectsList = await kv.get(listKey)
    if (Array.isArray(projectsList)) {
      const updatedList = projectsList.filter((name: string) => name !== projectName)
      await kv.set(listKey, updatedList)
      logSuccess(`Removed "${projectName}" from projects list`)
    }
  } catch (error: any) {
    logWarning(`Could not update projects list: ${error?.message}`)
  }
}

// Delete all keys with a given prefix (for cases where project.json doesn't exist)
async function deleteKeysByPrefix(prefix: string, dryRun: boolean): Promise<number> {
  const kv = getKVClient()
  let deleted = 0

  // Note: Vercel KV/Upstash doesn't support SCAN directly
  // We'll try to delete known key patterns
  // If project.json exists, we'll use that; otherwise, we'll try common patterns

  // Try to get epics list
  try {
    const epicsList = await listEpicsFromKV(prefix.replace('pm:project:', '').replace(':epic:', ''))
    for (const epicName of epicsList) {
      const projectName = prefix.replace('pm:project:', '').split(':')[0]
      const storyIds = await listStoriesFromKV(projectName, epicName)
      for (const storyId of storyIds) {
        const key = getStoryKey(projectName, epicName, storyId)
        if (await deleteKey(key, dryRun)) deleted++
      }
      // Delete epic keys
      for (const key of getEpicKeys(projectName, epicName)) {
        if (await deleteKey(key, dryRun)) deleted++
      }
    }
  } catch {
    // If we can't list, we'll proceed with manual deletion
  }

  return deleted
}

// Main cleanup function
async function cleanupProject(projectName: string, options: { dryRun: boolean; confirm: boolean }): Promise<void> {
  log(`\n🗑️  Cleaning up project: ${projectName}`, 'bright')
  log(`   Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`, 'cyan')

  if (!options.confirm && !options.dryRun) {
    logError('❌ This will permanently delete all data for this project!')
    logError('   Use --confirm flag to proceed with deletion.')
    process.exit(1)
  }

  // Collect all keys to delete
  const keysToDelete: string[] = []
  let projectExists = false

  try {
    // Try to read project to get epic names
    logInfo('\n📖 Reading project data from KV...')
    const project = await readProjectFromKV(projectName)
    projectExists = true
    const epicNames = project.epicIds || []

    if (epicNames.length === 0) {
      logWarning('No epics found in project')
    } else {
      logInfo(`Found ${epicNames.length} epics`)
    }

    // Project-level keys
    keysToDelete.push(...getProjectKeys(projectName))

    // For each epic, get all story keys
    for (const epicName of epicNames) {
      logInfo(`\n📦 Processing epic: ${epicName}`)

      // Get epic keys
      keysToDelete.push(...getEpicKeys(projectName, epicName))

      // Get story IDs
      const storyIds = await listStoriesFromKV(projectName, epicName)
      logInfo(`   Found ${storyIds.length} stories`)

      // Add story keys
      for (const storyId of storyIds) {
        keysToDelete.push(getStoryKey(projectName, epicName, storyId))
      }
    }
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      logWarning(`Project "${projectName}" not found in KV`)
      logInfo('Attempting to delete keys by pattern...')

      // Try to delete known key patterns even if project.json doesn't exist
      // Add project-level keys
      keysToDelete.push(...getProjectKeys(projectName))

      // Try to get epics from the list
      try {
        const epicsList = await listEpicsFromKV(projectName)
        logInfo(`Found ${epicsList.length} epics in list`)

        for (const epicName of epicsList) {
          keysToDelete.push(...getEpicKeys(projectName, epicName))
          const storyIds = await listStoriesFromKV(projectName, epicName)
          for (const storyId of storyIds) {
            keysToDelete.push(getStoryKey(projectName, epicName, storyId))
          }
        }
      } catch (listError) {
        logWarning('Could not list epics, will try to delete known key patterns')
      }
    } else {
      logError(`Error reading project: ${error?.message}`)
      process.exit(1)
    }
  }

  // Summary
  log(`\n📊 Cleanup Summary`, 'bright')
  log(`   Total keys to delete: ${keysToDelete.length}`, 'cyan')

  if (keysToDelete.length === 0) {
    logWarning('No keys found to delete. Project may already be cleaned up.')
    return
  }

  if (options.dryRun) {
    logInfo('\n[DRY RUN] Keys that would be deleted:')
    keysToDelete.forEach((key, index) => {
      logInfo(`   ${(index + 1).toString().padStart(3, ' ')}. ${key}`)
    })
    logInfo(`\n   Also: Will remove "${projectName}" from pm:projects:list (without deleting the list itself)`)
  } else {
    // Delete all keys
    logInfo('\n🗑️  Deleting keys...')
    let deleted = 0
    let failed = 0

    for (const key of keysToDelete) {
      if (await deleteKey(key, false)) {
        deleted++
        if (deleted % 10 === 0) {
          process.stdout.write('.')
        }
      } else {
        failed++
      }
    }

    if (deleted > 0) {
      process.stdout.write('\n')
    }

    // Remove from projects list (special handling)
    await removeFromProjectsList(projectName, false)

    log(`\n✅ Cleanup completed!`, 'bright')
    log(`   Deleted: ${deleted} keys`, 'green')
    if (failed > 0) {
      log(`   Failed: ${failed} keys`, 'yellow')
    }
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2)

  const projectName = args.find(arg => !arg.startsWith('--'))
  const dryRun = args.includes('--dry-run')
  const confirm = args.includes('--confirm')

  if (!projectName) {
    logError('Usage: npm run cleanup-kv-project <project-name> [--dry-run] [--confirm]')
    logInfo('\n  --dry-run: Preview what would be deleted without actually deleting')
    logInfo('  --confirm: Required for actual deletion (safety measure)')
    logInfo('\nExample:')
    logInfo('  npm run cleanup-kv-project healthcare-platform -- --dry-run')
    logInfo('  npm run cleanup-kv-project healthcare-platform -- --confirm')
    process.exit(1)
  }

  // Validate environment
  validateEnvironment()

  // Run cleanup
  await cleanupProject(projectName, { dryRun, confirm })
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    logError(`Fatal error: ${error?.message}`)
    process.exit(1)
  })
}

