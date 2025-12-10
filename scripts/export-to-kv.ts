#!/usr/bin/env node
/**
 * Export Project Epics and Stories from Local Files to Vercel KV
 *
 * This script exports selected epics and their stories from the local file system
 * to Vercel KV (Redis). It handles:
 * - Interactive epic selection
 * - Duplicate detection (skips existing stories)
 * - Story ordering preservation
 * - Backup creation (downloads KV data to local folder)
 * - Dry-run mode
 * - Comprehensive error handling and logging
 *
 * Usage:
 *   npm run export-to-kv <project-name> [--dry-run] [--force] [--backup] [--epics=epic1,epic2]
 */

import { promises as fs } from 'fs'
import path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
const __filename = new URL(import.meta.url).pathname
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(projectRoot, '.env.local') })

// Repository imports (will be loaded in main function)
let pmRepositoryKV: any

// Direct file system access functions (bypass KV check)
const PM_DATA_DIR = path.join(projectRoot, 'pm')

function getProjectFilePath(projectName: string): string {
  return path.join(PM_DATA_DIR, projectName, 'project.json')
}

function getEpicFilePath(projectName: string, epicName: string): string {
  return path.join(PM_DATA_DIR, projectName, epicName, 'epic.json')
}

function getStoryFilePath(projectName: string, epicName: string, storyId: string): string {
  return path.join(PM_DATA_DIR, projectName, epicName, `${storyId}.json`)
}

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

// File system only functions
async function readProjectFromFile(projectName: string): Promise<any> {
  const { parseProject } = await import('../src/lib/types.js')
  const filePath = getProjectFilePath(projectName)
  return readJsonFile(filePath, parseProject)
}

async function readEpicFromFile(projectName: string, epicName: string): Promise<any> {
  const { parseEpic } = await import('../src/lib/types.js')
  const filePath = getEpicFilePath(projectName, epicName)
  return readJsonFile(filePath, parseEpic)
}

async function readStoryFromFile(projectName: string, epicName: string, storyId: string): Promise<any> {
  const { parseStory } = await import('../src/lib/types.js')
  const filePath = getStoryFilePath(projectName, epicName, storyId)
  return readJsonFile(filePath, parseStory)
}

async function listEpicsFromFile(projectName: string): Promise<string[]> {
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

async function listStoriesFromFile(projectName: string, epicName: string): Promise<string[]> {
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

// Types
interface ExportOptions {
  dryRun: boolean
  force: boolean
  backup: boolean
}

interface ExportResult {
  epicName: string
  storiesExported: number
  storiesSkipped: number
  storiesFailed: number
  errors: string[]
}

interface BackupData {
  project: any
  epics: Record<string, any>
  stories: Record<string, Record<string, any>>
  timestamp: string
}

// Colors for console output (simple implementation)
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

// Validate environment variables
function validateEnvironment(): void {
  const requiredVars = ['KV_REST_API_URL', 'KV_REST_API_TOKEN']
  const missing = requiredVars.filter(v => !process.env[v])

  if (missing.length > 0) {
    logError(`Missing required environment variables: ${missing.join(', ')}`)
    logInfo('Please ensure .env.local file exists with KV credentials')
    process.exit(1)
  }
}

// Interactive epic selection using readline
async function selectEpicsInteractively(epics: string[]): Promise<string[]> {
  const readline = (await import('readline')).default
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    log('\n📋 Available Epics:', 'bright')
    epics.forEach((epic, index) => {
      log(`  ${index + 1}. ${epic}`, 'cyan')
    })

    rl.question('\nEnter epic numbers to export (comma-separated, e.g., 1,2,3) or "all" for all: ', (answer) => {
      rl.close()

      if (answer.trim().toLowerCase() === 'all') {
        resolve(epics)
        return
      }

      const indices = answer.split(',').map(s => parseInt(s.trim()) - 1).filter(n => !isNaN(n) && n >= 0 && n < epics.length)
      const selected = indices.map(i => epics[i])

      if (selected.length === 0) {
        logError('No valid epics selected')
        process.exit(1)
      }

      resolve(selected)
    })
  })
}

// Create backup of KV data
async function createBackup(targetProjectName: string): Promise<string> {
  logInfo('Creating backup of KV data...')

  const backupDir = path.join(projectRoot, 'kv-backups')
  await fs.mkdir(backupDir, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(backupDir, `${targetProjectName}-backup-${timestamp}.json`)

  try {
    const backup: BackupData = {
      project: null,
      epics: {},
      stories: {},
      timestamp: new Date().toISOString(),
    }

    // Backup project
    try {
      backup.project = await pmRepositoryKV.readProject(targetProjectName)
    } catch (error) {
      logWarning(`Project not found in KV: ${targetProjectName}`)
    }

    // Backup epics and stories
    try {
      const epics = await pmRepositoryKV.listEpics(targetProjectName)
      for (const epicName of epics) {
        try {
          backup.epics[epicName] = await pmRepositoryKV.readEpic(targetProjectName, epicName)

          const stories = await pmRepositoryKV.listStories(targetProjectName, epicName)
          backup.stories[epicName] = {}

          for (const storyId of stories) {
            try {
              backup.stories[epicName][storyId] = await pmRepositoryKV.readStory(targetProjectName, epicName, storyId)
            } catch (error) {
              logWarning(`Failed to backup story ${storyId}: ${error}`)
            }
          }
        } catch (error) {
          logWarning(`Failed to backup epic ${epicName}: ${error}`)
        }
      }
    } catch (error) {
      logWarning(`No epics found in KV for project ${targetProjectName}`)
    }

    await fs.writeFile(backupFile, JSON.stringify(backup, null, 2))
    logSuccess(`Backup created: ${backupFile}`)
    return backupFile
  } catch (error) {
    logError(`Failed to create backup: ${error}`)
    throw error
  }
}

// Export a single story
async function exportStory(
  projectName: string,
  epicName: string,
  storyId: string,
  options: ExportOptions
): Promise<{ exported: boolean; skipped: boolean; error?: string }> {
  try {
    // Check if story exists in KV
    const exists = await pmRepositoryKV.storyExists(projectName, epicName, storyId)

    if (exists && !options.force) {
      return { exported: false, skipped: true }
    }

    // Read story from file system
    const story = await readStoryFromFile(projectName, epicName, storyId)

    if (!options.dryRun) {
      // Write to KV
      await pmRepositoryKV.writeStory(projectName, epicName, storyId, story)
    }

    return { exported: true, skipped: false }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return { exported: false, skipped: false, error: errorMsg }
  }
}

// Export an epic and all its stories
async function exportEpic(
  projectName: string,
  epicName: string,
  options: ExportOptions
): Promise<ExportResult> {
  const result: ExportResult = {
    epicName,
    storiesExported: 0,
    storiesSkipped: 0,
    storiesFailed: 0,
    errors: [],
  }

  log(`\n📦 Exporting Epic: ${epicName}`, 'bright')

  try {
    // Read epic from file system
    const localEpic = await readEpicFromFile(projectName, epicName)

    // Get local stories
    const localStories = await listStoriesFromFile(projectName, epicName)
    logInfo(`Found ${localStories.length} stories in local epic`)

    // Check if epic exists in KV
    const epicExists = await pmRepositoryKV.epicExists(projectName, epicName)
    let kvStories: string[] = []

    if (epicExists) {
      kvStories = await pmRepositoryKV.listStories(projectName, epicName)
      logInfo(`Epic exists in KV with ${kvStories.length} stories`)
    } else {
      logInfo('Epic does not exist in KV (will be created)')
      // Create epic first to avoid warnings when writing stories
      if (!options.dryRun) {
        const epicToCreate = {
          ...localEpic,
          storyIds: [], // Will be updated after stories are exported
        }
        await pmRepositoryKV.writeEpic(projectName, epicName, epicToCreate)
        logInfo('Epic created in KV')
      } else {
        logInfo('[DRY RUN] Would create epic in KV')
      }
    }

    // Export stories
    for (const storyId of localStories) {
      const storyResult = await exportStory(projectName, epicName, storyId, options)

      if (storyResult.error) {
        result.storiesFailed++
        result.errors.push(`Story ${storyId}: ${storyResult.error}`)
        logError(`Failed to export ${storyId}: ${storyResult.error}`)
      } else if (storyResult.skipped) {
        result.storiesSkipped++
        log(`  ⏭️  Skipped ${storyId} (already exists)`, 'yellow')
      } else if (storyResult.exported) {
        result.storiesExported++
        log(`  ✅ Exported ${storyId}`, 'green')
      }
    }

    // Update epic in KV with merged storyIds (preserving order from local)
    if (!options.dryRun) {
      const mergedStoryIds = [...new Set([...localEpic.storyIds || [], ...kvStories])]
      // Preserve local order, then append any KV-only stories
      const orderedStoryIds = [
        ...localEpic.storyIds || [],
        ...kvStories.filter(id => !localEpic.storyIds?.includes(id))
      ]

      const updatedEpic = {
        ...localEpic,
        storyIds: orderedStoryIds,
        updatedAt: new Date().toISOString(),
      }

      await pmRepositoryKV.writeEpic(projectName, epicName, updatedEpic)
      logSuccess(`Epic metadata updated in KV`)
    } else {
      logInfo(`[DRY RUN] Would update epic metadata in KV`)
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    result.errors.push(`Epic export failed: ${errorMsg}`)
    logError(`Failed to export epic ${epicName}: ${errorMsg}`)
  }

  return result
}

// Main export function
async function exportProjectToKV(
  projectName: string,
  epicNames: string[],
  options: ExportOptions
): Promise<void> {
  log(`\n🚀 Starting Export`, 'bright')
  log(`   Project Name: ${projectName}`, 'cyan')
  log(`   Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`, 'cyan')
  log(`   Force: ${options.force ? 'Yes (will overwrite)' : 'No (skip existing)'}`, 'cyan')

  // Check if project exists in KV
  const projectExistsInKV = await pmRepositoryKV.projectExists(projectName)
  if (projectExistsInKV) {
    logInfo(`Project "${projectName}" exists in KV`)
  } else {
    logWarning(`⚠️  Project "${projectName}" does NOT exist in KV - will be created`)
  }

  // Validate project exists locally
  try {
    await readProjectFromFile(projectName)
  } catch (error) {
    logError(`Project not found locally: ${projectName}`)
    logError(`   Expected folder: pm/${projectName}/project.json`)
    process.exit(1)
  }

  // Create backup if requested
  let backupFile: string | null = null
  if (options.backup && !options.dryRun) {
    try {
      backupFile = await createBackup(projectName)
    } catch (error) {
      logWarning('Backup creation failed, continuing with export...')
    }
  }

  // Export/update project.json in KV
  logInfo('\n📄 Exporting project.json to KV...')
  try {
    const localProject = await readProjectFromFile(projectName)

    // Check if project exists in KV and merge epicIds
    let existingProject = null
    try {
      existingProject = await pmRepositoryKV.readProject(projectName)
    } catch {
      // Project doesn't exist, will create new one
    }

    // Merge epicIds: combine local epicIds with exported epics and existing KV epics
    const existingEpicIds = existingProject?.epicIds || []
    const localEpicIds = localProject.epicIds || []
    const exportedEpicIds = epicNames
    const mergedEpicIds = [...new Set([...existingEpicIds, ...localEpicIds, ...exportedEpicIds])]

    const projectToWrite = {
      ...localProject,
      epicIds: mergedEpicIds,
      updatedAt: new Date().toISOString(),
    }

    if (!options.dryRun) {
      await pmRepositoryKV.writeProject(projectName, projectToWrite)
      logSuccess(`Project.json exported/updated in KV`)
    } else {
      logInfo(`[DRY RUN] Would export/update project.json in KV`)
    }
  } catch (error) {
    logError(`Failed to export project.json: ${error}`)
    logWarning('Continuing with epic export...')
  }

  // Export each epic
  const results: ExportResult[] = []
  for (const epicName of epicNames) {
    try {
      const result = await exportEpic(projectName, epicName, options)
      results.push(result)
    } catch (error) {
      logError(`Failed to export epic ${epicName}: ${error}`)
      results.push({
        epicName,
        storiesExported: 0,
        storiesSkipped: 0,
        storiesFailed: 0,
        errors: [error instanceof Error ? error.message : String(error)],
      })
    }
  }

  // Update project.json again with final epicIds (in case new epics were created)
  if (!options.dryRun && results.length > 0) {
    try {
      const localProject = await readProjectFromFile(projectName)
      const existingProject = await pmRepositoryKV.readProject(projectName).catch(() => null)
      const existingEpicIds = existingProject?.epicIds || []
      const localEpicIds = localProject.epicIds || []
      const exportedEpicIds = epicNames
      const mergedEpicIds = [...new Set([...existingEpicIds, ...localEpicIds, ...exportedEpicIds])]

      const finalProject = {
        ...localProject,
        epicIds: mergedEpicIds,
        updatedAt: new Date().toISOString(),
      }

      await pmRepositoryKV.writeProject(projectName, finalProject)
      logInfo('Project.json updated with final epicIds')
    } catch (error) {
      logWarning(`Failed to update project.json with final epicIds: ${error}`)
    }
  }

  // Print summary
  printSummary(results, options, backupFile)

  // Check for people.json
  logWarning('\n⚠️  Please ensure people.json is present in KV before using the exported data')
}

// Print export summary
function printSummary(
  results: ExportResult[],
  options: ExportOptions,
  backupFile: string | null
): void {
  log('\n' + '='.repeat(60), 'bright')
  log('📊 Export Summary', 'bright')
  log('='.repeat(60), 'bright')

  const totalExported = results.reduce((sum, r) => sum + r.storiesExported, 0)
  const totalSkipped = results.reduce((sum, r) => sum + r.storiesSkipped, 0)
  const totalFailed = results.reduce((sum, r) => sum + r.storiesFailed, 0)
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)

  log(`\nEpics Processed: ${results.length}`, 'cyan')
  log(`Stories Exported: ${totalExported}`, 'green')
  log(`Stories Skipped: ${totalSkipped}`, 'yellow')
  log(`Stories Failed: ${totalFailed}`, totalFailed > 0 ? 'red' : 'reset')

  if (backupFile) {
    log(`\nBackup Location: ${backupFile}`, 'cyan')
  }

  if (totalErrors > 0) {
    log('\n❌ Errors:', 'red')
    results.forEach(result => {
      if (result.errors.length > 0) {
        log(`\n  Epic: ${result.epicName}`, 'yellow')
        result.errors.forEach(error => {
          log(`    - ${error}`, 'red')
        })
      }
    })
  }

  if (options.dryRun) {
    log('\n⚠️  This was a DRY RUN - no data was actually exported', 'yellow')
  } else {
    log('\n✅ Export completed!', 'green')
  }

  log('='.repeat(60) + '\n', 'bright')
}

// Main function
async function main() {
  // Load KV repository only (file functions are defined above)
  const kvModule = await import('../src/lib/pm-repository-kv.js')
  pmRepositoryKV = kvModule.pmRepositoryKV

  const args = process.argv.slice(2)

  // Parse arguments
  const projectName = args.find(arg => !arg.startsWith('--'))
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force')
  const backup = args.includes('--backup')
  const epicNamesArg = args.find(arg => arg.startsWith('--epics='))

  if (!projectName) {
    logError('Usage: npm run export-to-kv <project-name> [--dry-run] [--force] [--backup] [--epics=epic1,epic2]')
    logInfo('\n  Note: Project name must be the same for both local files and KV storage.')
    process.exit(1)
  }

  // Enforce that local and remote project names are the same
  // The project name is used for both local folder and KV storage
  const targetProjectName = projectName

  // Validate environment
  validateEnvironment()

  // Get epic names
  let epicNames: string[] = []
  if (epicNamesArg) {
    epicNames = epicNamesArg.split('=')[1].split(',').map(e => e.trim())
  } else {
    // List epics from file system
    const allEpics = await listEpicsFromFile(projectName)
    if (allEpics.length === 0) {
      logError(`No epics found for project: ${projectName}`)
      process.exit(1)
    }

    // Interactive selection
    epicNames = await selectEpicsInteractively(allEpics)
  }

  if (epicNames.length === 0) {
    logError('No epics selected')
    process.exit(1)
  }

  // Run export (project name is the same for local and KV)
  await exportProjectToKV(projectName, epicNames, {
    dryRun,
    force,
    backup,
  })
}

// Run main function
main().catch(error => {
  logError(`Fatal error: ${error}`)
  process.exit(1)
})

