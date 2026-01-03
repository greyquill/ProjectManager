#!/usr/bin/env node
/**
 * Sync Data from Production Vercel Upstash to Local KV
 *
 * This script syncs all data from production Vercel Upstash Redis to local KV (Docker Redis).
 * This ensures local development uses the same data as production.
 *
 * Usage:
 *   npm run sync:from-production [--dry-run] [--force]
 *
 * Prerequisites:
 * 1. Production KV credentials in .env.local (KV_REST_API_URL, KV_REST_API_TOKEN)
 * 2. Local KV running (npm run redis:start)
 * 3. Local KV credentials in .env.local (UPSTASH_REDIS_REST_URL=http://localhost:8080)
 */

import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
const __filename = new URL(import.meta.url).pathname
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(projectRoot, '.env.local') })

// Colors for console output
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

  log('\n🔄 Syncing from Production Vercel Upstash to Local KV', 'bright')
  log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`, 'cyan')
  log(`   Force: ${force ? 'Yes (will overwrite)' : 'No (skip existing)'}`, 'cyan')

  // Validate production credentials
  const hasProductionKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

  if (!hasProductionKV && !hasUpstash) {
    logError('Missing production KV credentials!')
    logInfo('Add to .env.local:')
    logInfo('  KV_REST_API_URL=https://your-production-redis.upstash.io')
    logInfo('  KV_REST_API_TOKEN=your-production-token')
    process.exit(1)
  }

  // Validate local KV
  const hasLocalKV = process.env.USE_LOCAL_KV === 'true' &&
                     process.env.UPSTASH_REDIS_REST_URL === 'http://localhost:8080'

  if (!hasLocalKV) {
    logError('Local KV not configured!')
    logInfo('Add to .env.local:')
    logInfo('  USE_LOCAL_KV=true')
    logInfo('  UPSTASH_REDIS_REST_URL=http://localhost:8080')
    logInfo('  UPSTASH_REDIS_REST_TOKEN=local-dev-token')
    logInfo('\nThen start local Redis: npm run redis:start')
    process.exit(1)
  }

  try {
    // Import repositories
    const { Redis } = await import('@upstash/redis')

    // Production KV client (from Vercel credentials)
    const productionRedis = hasProductionKV
      ? new Redis({
          url: process.env.KV_REST_API_URL!,
          token: process.env.KV_REST_API_TOKEN!,
        })
      : Redis.fromEnv()

    // Local KV client (from local proxy)
    const localRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || 'local-dev-token',
    })

    logInfo('\n📥 Reading from production KV...')

    // Get projects list from production
    const productionProjectsList = await productionRedis.get('pm:projects:list')
    const projectNames = Array.isArray(productionProjectsList) ? productionProjectsList : []

    if (projectNames.length === 0) {
      logWarning('No projects found in production KV')
      return
    }

    logInfo(`Found ${projectNames.length} project(s) in production`)

    // Sync people data
    logInfo('\n👥 Syncing people data...')
    const productionPeople = await productionRedis.get('pm:people:global')
    if (productionPeople) {
      if (!dryRun) {
        await localRedis.set('pm:people:global', productionPeople)
        logSuccess(`Synced ${Array.isArray(productionPeople) ? productionPeople.length : 1} people`)
      } else {
        logInfo(`[DRY RUN] Would sync ${Array.isArray(productionPeople) ? productionPeople.length : 1} people`)
      }
    }

    // Sync each project
    for (const projectName of projectNames) {
      log(`\n📁 Syncing project: ${projectName}`, 'bright')

      // Sync project
      const projectKey = `pm:project:${projectName}`
      const productionProject = await productionRedis.get(projectKey)
      if (productionProject) {
        if (!dryRun) {
          await localRedis.set(projectKey, productionProject)
          logSuccess('  Project synced')
        } else {
          logInfo('  [DRY RUN] Would sync project')
        }
      }

      // Get epics list
      const epicsListKey = `pm:project:${projectName}:epics:list`
      const productionEpicsList = await productionRedis.get(epicsListKey)
      const epicNames = Array.isArray(productionEpicsList) ? productionEpicsList : []

      // Sync each epic
      for (const epicName of epicNames) {
        const epicKey = `pm:project:${projectName}:epic:${epicName}`
        const productionEpic = await productionRedis.get(epicKey)

        if (productionEpic) {
          if (!dryRun) {
            await localRedis.set(epicKey, productionEpic)
            logSuccess(`  Epic: ${epicName}`)
          } else {
            logInfo(`  [DRY RUN] Would sync epic: ${epicName}`)
          }
        }

        // Get stories list
        const storiesListKey = `pm:project:${projectName}:epic:${epicName}:stories:list`
        const productionStoriesList = await productionRedis.get(storiesListKey)
        const storyIds = Array.isArray(productionStoriesList) ? productionStoriesList : []

        // Sync each story
        for (const storyId of storyIds) {
          const storyKey = `pm:project:${projectName}:epic:${epicName}:story:${storyId}`
          const productionStory = await productionRedis.get(storyKey)

          if (productionStory) {
            if (!dryRun) {
              await localRedis.set(storyKey, productionStory)
            }
          }
        }

        if (!dryRun && storyIds.length > 0) {
          await localRedis.set(storiesListKey, storyIds)
          logInfo(`    ${storyIds.length} stories synced`)
        }
      }

      if (!dryRun && epicNames.length > 0) {
        await localRedis.set(epicsListKey, epicNames)
      }
    }

    // Update projects list in local KV
    if (!dryRun) {
      await localRedis.set('pm:projects:list', projectNames)
      logSuccess('\n✅ Sync completed!')
      logInfo(`   Projects: ${projectNames.length}`)
    } else {
      logWarning('\n⚠️  This was a DRY RUN - no data was actually synced')
    }

  } catch (error) {
    logError(`Sync failed: ${error instanceof Error ? error.message : String(error)}`)
    console.error(error)
    process.exit(1)
  }
}

main().catch(console.error)

