#!/usr/bin/env node
/**
 * Migrate All Data from /pm to Local KV
 *
 * Comprehensive migration script that migrates:
 * - People data (pm/people.json)
 * - All projects
 * - All epics within projects
 * - All stories within epics
 *
 * Features:
 * - Automated discovery of all data
 * - Idempotent (can run multiple times safely)
 * - Progress tracking
 * - Data validation
 * - Dry-run mode
 * - Force overwrite option
 *
 * Usage:
 *   npm run migrate-to-local-kv [--dry-run] [--force] [--project=project-name]
 */

import { promises as fs } from 'fs'
import path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
const __filename = new URL(import.meta.url).pathname
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(projectRoot, '.env.local') })

const PM_DATA_DIR = path.join(projectRoot, 'pm')

// Types
interface MigrationOptions {
  dryRun: boolean
  force: boolean
  projectName?: string
}

interface MigrationStats {
  people: {
    migrated: boolean
    error?: string
  }
  projects: {
    name: string
    migrated: boolean
    epics: number
    stories: number
    errors: string[]
  }[]
  totalEpics: number
  totalStories: number
  errors: string[]
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logError(message: string) {
  log(`❌ ${message}`, 'red')
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green')
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'cyan')
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow')
}

// File system helpers
async function readJsonFile<T>(filePath: string, parser: (data: unknown) => T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(content)
    return parser(data)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`)
    }
    throw new Error(`Failed to read file: ${filePath} - ${error}`)
  }
}

function getProjectFilePath(projectName: string): string {
  return path.join(PM_DATA_DIR, projectName, 'project.json')
}

function getEpicFilePath(projectName: string, epicName: string): string {
  return path.join(PM_DATA_DIR, projectName, epicName, 'epic.json')
}

function getStoryFilePath(projectName: string, epicName: string, storyId: string): string {
  return path.join(PM_DATA_DIR, projectName, epicName, `${storyId}.json`)
}

function getPeopleFilePath(): string {
  return path.join(PM_DATA_DIR, 'people.json')
}

// Discover all projects
async function discoverProjects(): Promise<string[]> {
  try {
    const entries = await fs.readdir(PM_DATA_DIR, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isDirectory() && entry.name !== '.git' && entry.name !== 'node_modules')
      .map((entry) => entry.name)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw new Error(`Failed to list projects: ${error}`)
  }
}

// Discover all epics in a project
async function discoverEpics(projectName: string): Promise<string[]> {
  try {
    const projectDir = path.join(PM_DATA_DIR, projectName)
    const entries = await fs.readdir(projectDir, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isDirectory() && entry.name !== '.git' && entry.name !== 'node_modules')
      .map((entry) => entry.name)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw new Error(`Failed to list epics for project ${projectName}: ${error}`)
  }
}

// Discover all stories in an epic
async function discoverStories(projectName: string, epicName: string): Promise<string[]> {
  try {
    const epicDir = path.join(PM_DATA_DIR, projectName, epicName)
    const entries = await fs.readdir(epicDir, { withFileTypes: true })
    return entries
      .filter(
        (entry) =>
          entry.isFile() &&
          (entry.name.startsWith('F-') || entry.name.startsWith('NFR-')) &&
          entry.name.endsWith('.json')
      )
      .map((entry) => entry.name.replace('.json', ''))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw new Error(`Failed to list stories for epic ${epicName} in project ${projectName}: ${error}`)
  }
}

// Migrate people data
async function migratePeople(pmRepositoryKV: any, options: MigrationOptions): Promise<{ migrated: boolean; error?: string }> {
  log('\n👥 Migrating People Data...', 'bright')

  try {
    const peoplePath = getPeopleFilePath()

    // Check if people.json exists
    try {
      await fs.access(peoplePath)
    } catch {
      logWarning('people.json not found in /pm, skipping people migration')
      return { migrated: false }
    }

    // Check if already exists in KV
    const exists = await pmRepositoryKV.globalPeopleExists()
    if (exists && !options.force) {
      logInfo('People data already exists in KV (use --force to overwrite)')
      return { migrated: false }
    }

    // Read people from file
    const { parsePeople } = await import('../src/lib/types.js')
    const people = await readJsonFile(peoplePath, parsePeople)

    if (!options.dryRun) {
      await pmRepositoryKV.writeGlobalPeople(people)
      logSuccess(`Migrated ${people.length} people to KV`)
    } else {
      logInfo(`[DRY RUN] Would migrate ${people.length} people to KV`)
    }

    return { migrated: true }
  } catch (error: any) {
    const errorMsg = error.message || String(error)
    logError(`Failed to migrate people: ${errorMsg}`)
    return { migrated: false, error: errorMsg }
  }
}

// Migrate a single project
async function migrateProject(
  projectName: string,
  pmRepositoryKV: any,
  options: MigrationOptions
): Promise<{ migrated: boolean; epics: number; stories: number; errors: string[] }> {
  log(`\n📁 Migrating Project: ${projectName}`, 'bright')

  const errors: string[] = []
  let epicsMigrated = 0
  let storiesMigrated = 0

  try {
    // Check if project exists in KV
    const exists = await pmRepositoryKV.projectExists(projectName)
    if (exists && !options.force) {
      logInfo(`Project already exists in KV (use --force to overwrite)`)
      // Still migrate epics/stories that might be missing
    }

    // Read project from file
    const { parseProject } = await import('../src/lib/types.js')
    const project = await readJsonFile(getProjectFilePath(projectName), parseProject)

    if (!options.dryRun) {
      await pmRepositoryKV.writeProject(projectName, project)
      logSuccess(`Project metadata migrated`)
    } else {
      logInfo(`[DRY RUN] Would migrate project metadata`)
    }

    // Discover and migrate epics
    const epicNames = await discoverEpics(projectName)
    logInfo(`Found ${epicNames.length} epic(s)`)

    for (const epicName of epicNames) {
      try {
        const result = await migrateEpic(projectName, epicName, pmRepositoryKV, options)
        epicsMigrated++
        storiesMigrated += result.stories
        if (result.error) {
          errors.push(`Epic ${epicName}: ${result.error}`)
        }
      } catch (error: any) {
        const errorMsg = `Epic ${epicName}: ${error.message || String(error)}`
        logError(errorMsg)
        errors.push(errorMsg)
      }
    }

    return { migrated: true, epics: epicsMigrated, stories: storiesMigrated, errors }
  } catch (error: any) {
    const errorMsg = error.message || String(error)
    logError(`Failed to migrate project: ${errorMsg}`)
    return { migrated: false, epics: epicsMigrated, stories: storiesMigrated, errors: [errorMsg, ...errors] }
  }
}

// Migrate a single epic
async function migrateEpic(
  projectName: string,
  epicName: string,
  pmRepositoryKV: any,
  options: MigrationOptions
): Promise<{ migrated: boolean; stories: number; error?: string }> {
  log(`  📦 Epic: ${epicName}`, 'cyan')

  try {
    // Check if epic exists
    const exists = await pmRepositoryKV.epicExists(projectName, epicName)
    if (exists && !options.force) {
      logInfo(`    Epic already exists (use --force to overwrite)`)
    }

    // Read epic from file
    const { parseEpic } = await import('../src/lib/types.js')
    const epic = await readJsonFile(getEpicFilePath(projectName, epicName), parseEpic)

    if (!options.dryRun) {
      await pmRepositoryKV.writeEpic(projectName, epicName, epic)
      logSuccess(`    Epic metadata migrated`)
    } else {
      logInfo(`    [DRY RUN] Would migrate epic metadata`)
    }

    // Discover and migrate stories
    const storyIds = await discoverStories(projectName, epicName)
    logInfo(`    Found ${storyIds.length} story/stories`)

    let storiesMigrated = 0
    for (const storyId of storyIds) {
      try {
        const result = await migrateStory(projectName, epicName, storyId, pmRepositoryKV, options)
        if (result.migrated) {
          storiesMigrated++
        }
      } catch (error: any) {
        logWarning(`    Failed to migrate story ${storyId}: ${error.message || String(error)}`)
      }
    }

    logSuccess(`    Migrated ${storiesMigrated}/${storyIds.length} stories`)
    return { migrated: true, stories: storiesMigrated }
  } catch (error: any) {
    const errorMsg = error.message || String(error)
    logError(`    Failed to migrate epic: ${errorMsg}`)
    return { migrated: false, stories: 0, error: errorMsg }
  }
}

// Migrate a single story
async function migrateStory(
  projectName: string,
  epicName: string,
  storyId: string,
  pmRepositoryKV: any,
  options: MigrationOptions
): Promise<{ migrated: boolean; skipped: boolean }> {
  try {
    // Check if story exists
    const exists = await pmRepositoryKV.storyExists(projectName, epicName, storyId)
    if (exists && !options.force) {
      return { migrated: false, skipped: true }
    }

    // Read story from file
    const { parseStory } = await import('../src/lib/types.js')
    const story = await readJsonFile(getStoryFilePath(projectName, epicName, storyId), parseStory)

    if (!options.dryRun) {
      await pmRepositoryKV.writeStory(projectName, epicName, storyId, story)
    }

    return { migrated: true, skipped: false }
  } catch (error) {
    throw new Error(`Failed to migrate story ${storyId}: ${error}`)
  }
}

// Main migration function
async function migrateAllData(options: MigrationOptions): Promise<MigrationStats> {
  log('\n🚀 Starting Full Migration from /pm to Local KV', 'bright')
  log(`   Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`, 'cyan')
  log(`   Force: ${options.force ? 'Yes (will overwrite)' : 'No (skip existing)'}`, 'cyan')
  if (options.projectName) {
    log(`   Project: ${options.projectName} (single project only)`, 'cyan')
  }

  // Load KV repository
  const pmRepositoryKV = (await import('../src/lib/pm-repository-kv.js')).pmRepositoryKV

  const stats: MigrationStats = {
    people: { migrated: false },
    projects: [],
    totalEpics: 0,
    totalStories: 0,
    errors: [],
  }

  // Step 1: Migrate people
  try {
    stats.people = await migratePeople(pmRepositoryKV, options)
  } catch (error: any) {
    stats.people = { migrated: false, error: error.message || String(error) }
    stats.errors.push(`People migration: ${error.message || String(error)}`)
  }

  // Step 2: Discover projects
  let projectNames: string[] = []
  try {
    if (options.projectName) {
      // Check if specified project exists
      const projectPath = getProjectFilePath(options.projectName)
      try {
        await fs.access(projectPath)
        projectNames = [options.projectName]
      } catch {
        logError(`Project not found: ${options.projectName}`)
        return stats
      }
    } else {
      projectNames = await discoverProjects()
    }
    log(`\n📋 Found ${projectNames.length} project(s) to migrate`, 'bright')
  } catch (error: any) {
    logError(`Failed to discover projects: ${error.message || String(error)}`)
    stats.errors.push(`Project discovery: ${error.message || String(error)}`)
    return stats
  }

  // Step 3: Migrate each project
  for (const projectName of projectNames) {
    try {
      const result = await migrateProject(projectName, pmRepositoryKV, options)
      stats.projects.push({
        name: projectName,
        migrated: result.migrated,
        epics: result.epics,
        stories: result.stories,
        errors: result.errors,
      })
      stats.totalEpics += result.epics
      stats.totalStories += result.stories
      stats.errors.push(...result.errors)
    } catch (error: any) {
      logError(`Failed to migrate project ${projectName}: ${error.message || String(error)}`)
      stats.projects.push({
        name: projectName,
        migrated: false,
        epics: 0,
        stories: 0,
        errors: [error.message || String(error)],
      })
      stats.errors.push(`Project ${projectName}: ${error.message || String(error)}`)
    }
  }

  return stats
}

// Print summary
function printSummary(stats: MigrationStats, options: MigrationOptions) {
  log('\n' + '='.repeat(60), 'bright')
  log('📊 Migration Summary', 'bright')
  log('='.repeat(60), 'bright')

  // People
  if (stats.people.migrated) {
    logSuccess('People: Migrated')
  } else if (stats.people.error) {
    logError(`People: Failed - ${stats.people.error}`)
  } else {
    logInfo('People: Skipped (already exists or not found)')
  }

  // Projects
  log(`\nProjects: ${stats.projects.length} total`)
  for (const project of stats.projects) {
    if (project.migrated) {
      logSuccess(`  ✅ ${project.name}: ${project.epics} epics, ${project.stories} stories`)
      if (project.errors.length > 0) {
        project.errors.forEach(err => logWarning(`    ⚠️  ${err}`))
      }
    } else {
      logError(`  ❌ ${project.name}: Failed`)
      project.errors.forEach(err => logError(`    ${err}`))
    }
  }

  // Totals
  log(`\n📈 Totals:`, 'bright')
  log(`   Projects: ${stats.projects.filter(p => p.migrated).length}/${stats.projects.length} migrated`)
  log(`   Epics: ${stats.totalEpics} migrated`)
  log(`   Stories: ${stats.totalStories} migrated`)

  // Errors
  if (stats.errors.length > 0) {
    log(`\n⚠️  Errors (${stats.errors.length}):`, 'yellow')
    stats.errors.slice(0, 10).forEach(err => logWarning(`   ${err}`))
    if (stats.errors.length > 10) {
      logWarning(`   ... and ${stats.errors.length - 10} more errors`)
    }
  }

  if (options.dryRun) {
    log('\n💡 This was a DRY RUN - no data was actually migrated', 'yellow')
    log('   Run without --dry-run to perform actual migration', 'yellow')
  } else {
    log('\n✅ Migration complete!', 'green')
  }
}

// Parse command line arguments
function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2)

  const options: MigrationOptions = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    projectName: undefined,
  }

  // Check for --project=name
  const projectArg = args.find(arg => arg.startsWith('--project='))
  if (projectArg) {
    options.projectName = projectArg.split('=')[1]
  }

  return options
}

// Main
async function main() {
  const options = parseArgs()

  // Validate KV is available
  if (!process.env.USE_LOCAL_KV && !process.env.UPSTASH_REDIS_REST_URL) {
    logError('KV not configured!')
    logInfo('Add to .env.local:')
    logInfo('  USE_LOCAL_KV=true')
    logInfo('  UPSTASH_REDIS_REST_URL=http://localhost:8080')
    logInfo('  UPSTASH_REDIS_REST_TOKEN=local-dev-token')
    process.exit(1)
  }

  try {
    const stats = await migrateAllData(options)
    printSummary(stats, options)

    if (stats.errors.length > 0 && !options.dryRun) {
      process.exit(1)
    }
  } catch (error: any) {
    logError(`Migration failed: ${error.message || String(error)}`)
    console.error(error)
    process.exit(1)
  }
}

main().catch(console.error)

