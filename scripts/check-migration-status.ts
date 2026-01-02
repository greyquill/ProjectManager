#!/usr/bin/env node
/**
 * Check Migration Status
 *
 * Compares data in /pm directory vs KV storage to see what needs migration
 *
 * Usage: tsx scripts/check-migration-status.ts
 */

import { promises as fs } from 'fs'
import path from 'path'
import * as dotenv from 'dotenv'

const __filename = new URL(import.meta.url).pathname
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(projectRoot, '.env.local') })

const PM_DATA_DIR = path.join(projectRoot, 'pm')

async function checkMigrationStatus() {
  console.log('📊 Migration Status Check\n')

  // Check file-based storage
  console.log('1️⃣ Checking file-based storage (/pm)...')
  let fileProjects: string[] = []
  let filePeople: any[] = []

  try {
    const entries = await fs.readdir(PM_DATA_DIR, { withFileTypes: true })
    fileProjects = entries
      .filter((entry) => entry.isDirectory() && entry.name !== '.git')
      .map((entry) => entry.name)

    // Check people.json
    const peoplePath = path.join(PM_DATA_DIR, 'people.json')
    try {
      const peopleContent = await fs.readFile(peoplePath, 'utf-8')
      filePeople = JSON.parse(peopleContent)
    } catch {
      // people.json doesn't exist or is invalid
    }

    console.log(`   ✅ Found ${fileProjects.length} project(s) in /pm:`)
    fileProjects.forEach(p => console.log(`      - ${p}`))
    console.log(`   ✅ Found ${filePeople.length} person(s) in people.json`)
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('   ⚠️  /pm directory does not exist')
    } else {
      console.log(`   ❌ Error reading /pm: ${error.message}`)
    }
  }

  // Check KV storage
  console.log('\n2️⃣ Checking KV storage...')
  let kvProjects: string[] = []
  let kvPeople: any[] = []

  try {
    const pmRepositoryKV = (await import('../src/lib/pm-repository-kv.js')).pmRepositoryKV

    // Check if KV is available
    try {
      kvProjects = await pmRepositoryKV.listProjects()
      console.log(`   ✅ Found ${kvProjects.length} project(s) in KV:`)
      kvProjects.forEach(p => console.log(`      - ${p}`))
    } catch (error: any) {
      console.log(`   ⚠️  Cannot read from KV: ${error.message}`)
      console.log('   💡 Make sure USE_LOCAL_KV=true and Redis is running')
    }

    // Check people
    try {
      const peopleExist = await pmRepositoryKV.globalPeopleExists()
      if (peopleExist) {
        kvPeople = await pmRepositoryKV.readGlobalPeople()
        console.log(`   ✅ Found ${kvPeople.length} person(s) in KV`)
      } else {
        console.log('   ⚠️  No people data in KV')
      }
    } catch (error: any) {
      console.log(`   ⚠️  Cannot read people from KV: ${error.message}`)
    }

  } catch (error: any) {
    console.log(`   ❌ KV not available: ${error.message}`)
    console.log('   💡 Make sure:')
    console.log('      - USE_LOCAL_KV=true in .env.local')
    console.log('      - Redis services are running: npm run redis:start')
  }

  // Compare
  console.log('\n3️⃣ Comparison:')

  const projectsToMigrate = fileProjects.filter(p => !kvProjects.includes(p))
  const projectsInKVOnly = kvProjects.filter(p => !fileProjects.includes(p))
  const projectsInBoth = fileProjects.filter(p => kvProjects.includes(p))

  if (projectsToMigrate.length > 0) {
    console.log(`   ⚠️  ${projectsToMigrate.length} project(s) need migration:`)
    projectsToMigrate.forEach(p => console.log(`      - ${p}`))
  } else {
    console.log('   ✅ All projects are in KV (or no projects in /pm)')
  }

  if (projectsInKVOnly.length > 0) {
    console.log(`   ℹ️  ${projectsInKVOnly.length} project(s) in KV but not in /pm:`)
    projectsInKVOnly.forEach(p => console.log(`      - ${p}`))
  }

  if (projectsInBoth.length > 0) {
    console.log(`   ✅ ${projectsInBoth.length} project(s) exist in both:`)
    projectsInBoth.forEach(p => console.log(`      - ${p}`))
  }

  // People comparison
  const peopleToMigrate = filePeople.length > 0 && kvPeople.length === 0
  if (peopleToMigrate) {
    console.log(`   ⚠️  People data needs migration (${filePeople.length} people in /pm, 0 in KV)`)
  } else if (filePeople.length > 0 && kvPeople.length > 0) {
    console.log(`   ✅ People data exists in both (${filePeople.length} in /pm, ${kvPeople.length} in KV)`)
  }

  // Summary
  console.log('\n📋 Summary:')
  console.log(`   File-based storage: ${fileProjects.length} projects, ${filePeople.length} people`)
  console.log(`   KV storage: ${kvProjects.length} projects, ${kvPeople.length} people`)

  if (projectsToMigrate.length > 0 || peopleToMigrate) {
    console.log('\n   ⏭️  Next step: Run migration script')
    console.log('      npm run migrate-to-local-kv')
  } else if (fileProjects.length === 0 && kvProjects.length === 0) {
    console.log('\n   ℹ️  No data to migrate')
  } else {
    console.log('\n   ✅ Migration appears complete!')
  }
}

checkMigrationStatus().catch(console.error)

