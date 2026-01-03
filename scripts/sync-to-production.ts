#!/usr/bin/env node
/**
 * Sync Data from Local KV to Production Vercel Upstash
 *
 * This script syncs data from local KV (Docker Redis) to production Vercel Upstash Redis.
 * Use this to push local changes to production.
 *
 * Usage:
 *   npm run sync:to-production [--dry-run] [--force] [--project=project-name]
 */

import * as dotenv from 'dotenv'
import path from 'path'

const __filename = new URL(import.meta.url).pathname
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(projectRoot, '.env.local') })

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
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

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force')
  const projectArg = args.find(arg => arg.startsWith('--project='))
  const projectName = projectArg ? projectArg.split('=')[1] : null

  log('\n🔄 Syncing from Local KV to Production Vercel Upstash', 'bright')
  log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`, 'cyan')

  // Validate credentials
  const hasProductionKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  const hasLocalKV = process.env.USE_LOCAL_KV === 'true' &&
                     process.env.UPSTASH_REDIS_REST_URL === 'http://localhost:8080'

  if (!hasProductionKV) {
    logError('Missing production KV credentials!')
    process.exit(1)
  }

  if (!hasLocalKV) {
    logError('Local KV not configured!')
    process.exit(1)
  }

  try {
    const { Redis } = await import('@upstash/redis')

    const localRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || 'local-dev-token',
    })

    const productionRedis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })

    // Get projects from local KV
    const localProjectsList = await localRedis.get('pm:projects:list')
    const projectNames = projectName
      ? [projectName]
      : (Array.isArray(localProjectsList) ? localProjectsList : [])

    if (projectNames.length === 0) {
      logWarning('No projects found in local KV')
      return
    }

    logInfo(`Syncing ${projectNames.length} project(s)...`)

    // Sync people data
    logInfo('\n👥 Syncing people data...')
    const localPeople = await localRedis.get('pm:people:global')
    if (localPeople) {
      if (!dryRun) {
        await productionRedis.set('pm:people:global', localPeople)
        logSuccess(`Synced ${Array.isArray(localPeople) ? localPeople.length : 1} people`)
      } else {
        logInfo(`[DRY RUN] Would sync ${Array.isArray(localPeople) ? localPeople.length : 1} people`)
      }
    }

    // Sync projects list
    logInfo('\n📋 Syncing projects list...')
    if (!dryRun) {
      await productionRedis.set('pm:projects:list', projectNames)
      logSuccess(`Synced projects list with ${projectNames.length} project(s)`)
    } else {
      logInfo(`[DRY RUN] Would sync projects list with ${projectNames.length} project(s)`)
    }

    // Sync each project
    for (const projName of projectNames) {
      log(`\n📁 Syncing project: ${projName}`, 'bright')

      // Sync project
      const projectKey = `pm:project:${projName}`
      const localProject = await localRedis.get(projectKey)
      if (localProject) {
        if (!dryRun) {
          await productionRedis.set(projectKey, localProject)
          logSuccess('  Project synced')
        } else {
          logInfo('  [DRY RUN] Would sync project')
        }
      }

      // Get epics list
      const epicsListKey = `pm:project:${projName}:epics:list`
      const localEpicsList = await localRedis.get(epicsListKey)
      const epicNames = Array.isArray(localEpicsList) ? localEpicsList : []

      // Sync each epic
      for (const epicName of epicNames) {
        const epicKey = `pm:project:${projName}:epic:${epicName}`
        const localEpic = await localRedis.get(epicKey)

        if (localEpic) {
          if (!dryRun) {
            await productionRedis.set(epicKey, localEpic)
            logSuccess(`  Epic: ${epicName}`)
          } else {
            logInfo(`  [DRY RUN] Would sync epic: ${epicName}`)
          }
        }

        // Get stories list
        const storiesListKey = `pm:project:${projName}:epic:${epicName}:stories:list`
        const localStoriesList = await localRedis.get(storiesListKey)
        const storyIds = Array.isArray(localStoriesList) ? localStoriesList : []

        // Sync each story
        for (const storyId of storyIds) {
          const storyKey = `pm:project:${projName}:epic:${epicName}:story:${storyId}`
          const localStory = await localRedis.get(storyKey)

          if (localStory) {
            if (!dryRun) {
              await productionRedis.set(storyKey, localStory)
            }
          }
        }

        if (!dryRun && storyIds.length > 0) {
          await productionRedis.set(storiesListKey, storyIds)
          logInfo(`    ${storyIds.length} stories synced`)
        }
      }

      if (!dryRun && epicNames.length > 0) {
        await productionRedis.set(epicsListKey, epicNames)
      }
    }

    // Update projects list in production KV
    if (!dryRun) {
      await productionRedis.set('pm:projects:list', projectNames)
      logSuccess('\n✅ Sync to production completed!')
      logInfo(`   Projects: ${projectNames.length}`)
    } else {
      logWarning('\n⚠️  This was a DRY RUN - no data was actually synced')
    }

  } catch (error) {
    logError(`Sync failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

main().catch(console.error)

