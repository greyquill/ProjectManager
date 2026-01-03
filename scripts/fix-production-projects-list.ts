#!/usr/bin/env node
/**
 * Fix Production Projects List
 *
 * This script ensures the pm:projects:list key exists in production KV
 * and contains the correct project names.
 */

import * as dotenv from 'dotenv'
import path from 'path'

const __filename = new URL(import.meta.url).pathname
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(projectRoot, '.env.local') })

async function main() {
  const { Redis } = await import('@upstash/redis')

  // Production Redis
  const productionRedis = new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  })

  console.log('🔍 Checking production KV...\n')

  // Check if projects list exists
  const projectsList = await productionRedis.get('pm:projects:list')
  console.log('Current projects list:', projectsList)

  // Check if project data exists
  const projectKey = 'pm:project:umami-healthcare'
  const projectExists = await productionRedis.exists(projectKey)
  console.log(`Project "umami-healthcare" exists: ${projectExists === 1 ? 'YES' : 'NO'}\n`)

  if (projectExists === 1) {
    // Project exists, but list might be missing or empty
    console.log('✅ Project data exists, updating projects list...')
    await productionRedis.set('pm:projects:list', ['umami-healthcare'])
    console.log('✅ Projects list updated!')

    // Verify
    const updatedList = await productionRedis.get('pm:projects:list')
    console.log('Updated list:', updatedList)
  } else {
    console.log('❌ Project data does not exist in production!')
    console.log('   Run: npm run sync:to-production')
  }
}

main().catch(console.error)

