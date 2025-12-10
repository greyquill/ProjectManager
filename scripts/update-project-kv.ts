#!/usr/bin/env node
/**
 * Quick script to update project.json in KV with correct person IDs
 * Usage: npm run update-project-kv <project-name>
 */

import * as dotenv from 'dotenv'
import path from 'path'
import { promises as fs } from 'fs'

const __filename = new URL(import.meta.url).pathname
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(projectRoot, '.env.local') })

async function main() {
  const projectName = process.argv[2]
  if (!projectName) {
    console.error('Usage: npm run update-project-kv <project-name>')
    process.exit(1)
  }

  // Validate environment
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error('Missing KV credentials in .env.local')
    process.exit(1)
  }

  // Load KV repository
  const kvModule = await import('../src/lib/pm-repository-kv.js')
  const pmRepositoryKV = kvModule.pmRepositoryKV

  // Read local project.json
  const { parseProject } = await import('../src/lib/types.js')
  const projectPath = path.join(projectRoot, 'pm', projectName, 'project.json')
  const projectContent = await fs.readFile(projectPath, 'utf-8')
  const localProject = parseProject(JSON.parse(projectContent))

  // Read existing project from KV to preserve epicIds
  let existingProject = null
  try {
    existingProject = await pmRepositoryKV.readProject(projectName)
  } catch {
    console.log('Project does not exist in KV, will create new one')
  }

  // Merge: use local metadata (with correct person IDs) but preserve KV epicIds
  const projectToWrite = {
    ...localProject,
    epicIds: existingProject?.epicIds || localProject.epicIds,
    updatedAt: new Date().toISOString(),
  }

  // Write to KV
  await pmRepositoryKV.writeProject(projectName, projectToWrite)
  console.log(`✅ Updated project.json in KV for ${projectName}`)
  console.log(`   Manager: ${projectToWrite.metadata.manager}`)
  console.log(`   Contributors: ${projectToWrite.metadata.contributors.join(', ')}`)
}

main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})

