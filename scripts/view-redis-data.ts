#!/usr/bin/env node
/**
 * View Redis Data
 *
 * Displays all data stored in Redis/KV in a readable format
 *
 * Usage: tsx scripts/view-redis-data.ts [--keys-only] [--key=pattern]
 */

import * as dotenv from 'dotenv'
import path from 'path'

const __filename = new URL(import.meta.url).pathname
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(projectRoot, '.env.local') })

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function viewRedisData() {
  const args = process.argv.slice(2)
  const keysOnly = args.includes('--keys-only')
  const keyPattern = args.find(arg => arg.startsWith('--key='))?.split('=')[1]

  log('\n🔍 Viewing Redis Data\n', 'bright')

  try {
    const pmRepositoryKV = (await import('../src/lib/pm-repository-kv.js')).pmRepositoryKV

    // Get KV client to access raw Redis
    const { Redis } = await import('@upstash/redis')
    const redis = Redis.fromEnv()

    // List all keys with pm: prefix
    log('📋 Listing all keys...', 'cyan')
    const allKeys: string[] = []

    // Note: Upstash Redis doesn't support KEYS command directly
    // We'll use the repository methods to discover data

    // Get projects
    const projects = await pmRepositoryKV.listProjects()
    log(`\n📁 Projects (${projects.length}):`, 'bright')
    for (const projectName of projects) {
      log(`   ${projectName}`, 'cyan')

      if (!keysOnly) {
        try {
          const project = await pmRepositoryKV.readProject(projectName)
          log(`      Name: ${project.name}`, 'reset')
          log(`      Epics: ${project.epicIds?.length || 0}`, 'reset')
        } catch (e) {
          log(`      ⚠️  Could not read project details`, 'yellow')
        }
      }

      // Get epics
      if (!keysOnly) {
        try {
          const epics = await pmRepositoryKV.listEpics(projectName)
          log(`      Epics (${epics.length}):`, 'reset')
          for (const epicName of epics) {
            log(`        - ${epicName}`, 'reset')

            // Get stories count
            try {
              const stories = await pmRepositoryKV.listStories(projectName, epicName)
              log(`          Stories: ${stories.length}`, 'reset')
            } catch (e) {
              // Skip if can't list stories
            }
          }
        } catch (e) {
          log(`      ⚠️  Could not list epics`, 'yellow')
        }
      }
    }

    // Get people
    log(`\n👥 People:`, 'bright')
    try {
      const peopleExist = await pmRepositoryKV.globalPeopleExists()
      if (peopleExist) {
        const people = await pmRepositoryKV.readGlobalPeople()
        log(`   Found ${people.length} person(s):`, 'cyan')
        if (!keysOnly) {
          people.forEach(person => {
            log(`   - ${person.name} (${person.id})`, 'reset')
            log(`     Email: ${person.email}`, 'reset')
            log(`     Role: ${person.roleInProject || person.designation}`, 'reset')
          })
        }
      } else {
        log(`   No people data found`, 'yellow')
      }
    } catch (e) {
      log(`   ⚠️  Could not read people: ${e}`, 'yellow')
    }

    // Try to get raw key count (if possible)
    log(`\n📊 Summary:`, 'bright')
    log(`   Projects: ${projects.length}`, 'cyan')

    let totalEpics = 0
    let totalStories = 0

    for (const projectName of projects) {
      try {
        const epics = await pmRepositoryKV.listEpics(projectName)
        totalEpics += epics.length

        for (const epicName of epics) {
          try {
            const stories = await pmRepositoryKV.listStories(projectName, epicName)
            totalStories += stories.length
          } catch (e) {
            // Skip
          }
        }
      } catch (e) {
        // Skip
      }
    }

    log(`   Epics: ${totalEpics}`, 'cyan')
    log(`   Stories: ${totalStories}`, 'cyan')

    // If key pattern specified, show that key
    if (keyPattern) {
      log(`\n🔑 Key: ${keyPattern}`, 'bright')
      try {
        const value = await redis.get(keyPattern)
        if (value) {
          log(JSON.stringify(value, null, 2), 'reset')
        } else {
          log('   Key not found', 'yellow')
        }
      } catch (e) {
        log(`   Error reading key: ${e}`, 'yellow')
      }
    }

  } catch (error: any) {
    log(`\n❌ Error: ${error.message}`, 'reset')
    log('   Make sure:', 'reset')
    log('   1. Redis is running: npm run redis:status', 'reset')
    log('   2. USE_LOCAL_KV=true in .env.local', 'reset')
    log('   3. UPSTASH_REDIS_REST_URL is set correctly', 'reset')
    process.exit(1)
  }
}

viewRedisData().catch(console.error)

