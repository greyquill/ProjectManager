#!/usr/bin/env tsx
/**
 * Create Epic and Stories from JSON Input
 *
 * This script reads a JSON file with epic and story definitions and creates
 * all the necessary files in the pm/ folder structure.
 *
 * Usage:
 *   npm run create-epic-stories <input-json-file>
 *
 * Example:
 *   npm run create-epic-stories epic-input.json
 *
 * The JSON format should match scripts/epic-story-format.json schema.
 */

import { promises as fs } from 'fs'
import path from 'path'
import {
  Epic,
  Story,
  parseEpic,
  parseStory,
  generateTimestamp,
} from '../src/lib/types'

// ============================================================================
// Types
// ============================================================================

interface EpicInput {
  epicId: string
  title: string
  summary: string
  businessOverview: string
  technicalArchitecture?: string
  implementationTimeline?: string
  caseStudyReference?: string
}

interface StoryInput {
  title: string
  requirementType: 'functional' | 'non-functional'
  category: string
  summary?: string
  description: string
}

interface EpicStoriesInput {
  projectName: string
  epic: EpicInput
  stories: StoryInput[]
  manager?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

const PM_DATA_DIR = path.join(process.cwd(), 'pm')

function getProjectDir(projectName: string): string {
  return path.join(PM_DATA_DIR, projectName)
}

function getEpicDir(projectName: string, epicName: string): string {
  return path.join(PM_DATA_DIR, projectName, epicName)
}

function getEpicFilePath(projectName: string, epicName: string): string {
  return path.join(getEpicDir(projectName, epicName), 'epic.json')
}

function getStoryFilePath(projectName: string, epicName: string, storyId: string): string {
  return path.join(getEpicDir(projectName, epicName), `${storyId}.json`)
}

async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

function generateEpicName(title: string): string {
  // Convert title to kebab-case for folder name
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) // Limit length
}

function generateStoryId(epicId: string, requirementType: 'functional' | 'non-functional', index: number): string {
  const prefix = requirementType === 'functional' ? 'F' : 'NFR'
  const number = (index + 1).toString().padStart(3, '0')
  return `${prefix}-${epicId}-${number}`
}

function buildEpicDescription(
  businessOverview: string,
  technicalArchitecture?: string,
  implementationTimeline?: string,
  caseStudyReference?: string
): string {
  let description = businessOverview

  if (technicalArchitecture) {
    description += '\n\n' + technicalArchitecture
  }

  if (implementationTimeline) {
    description += '\n\n' + implementationTimeline
  }

  if (caseStudyReference) {
    description += '\n\n' + caseStudyReference
  }

  return description
}

// ============================================================================
// Main Functions
// ============================================================================

async function createEpic(
  projectName: string,
  epicName: string,
  epicInput: EpicInput,
  storyIds: string[],
  manager: string
): Promise<Epic> {
  const now = generateTimestamp()

  const description = buildEpicDescription(
    epicInput.businessOverview,
    epicInput.technicalArchitecture,
    epicInput.implementationTimeline,
    epicInput.caseStudyReference
  )

  const epic: Epic = {
    id: epicInput.epicId,
    title: epicInput.title,
    summary: epicInput.summary,
    description,
    status: 'todo',
    priority: 'medium',
    manager,
    createdAt: now,
    updatedAt: now,
    targetRelease: null,
    storyIds,
    metrics: {
      totalStoryPoints: 0,
      completedStoryPoints: 0,
    },
    metadata: {
      createdBy: 'system',
      lastEditedBy: 'system',
      custom: {},
    },
  }

  // Validate epic
  const validatedEpic = parseEpic(epic)

  // Ensure epic directory exists
  await ensureDirectory(getEpicDir(projectName, epicName))

  // Write epic.json
  const epicFilePath = getEpicFilePath(projectName, epicName)
  await fs.writeFile(epicFilePath, JSON.stringify(validatedEpic, null, 2) + '\n')

  console.log(`✅ Created epic: ${epicName}`)
  return validatedEpic
}

async function createStory(
  projectName: string,
  epicName: string,
  storyId: string,
  storyInput: StoryInput,
  epicId: string,
  manager: string
): Promise<Story> {
  const now = generateTimestamp()

  // Generate summary if not provided
  const summary = storyInput.summary || `${storyInput.category}: ${storyInput.title}`

  // Build tags: requirementType, epicId, and category
  const tags = [
    storyInput.requirementType,
    epicId,
    storyInput.category,
  ]

  const story: Story = {
    id: storyId,
    requirementType: storyInput.requirementType,
    epicId: epicName, // Use folder name as epicId
    title: storyInput.title,
    summary,
    description: storyInput.description || '',
    acceptanceCriteria: [],
    status: 'todo',
    priority: 'medium',
    manager,
    createdAt: now,
    updatedAt: now,
    dueDate: null,
    plannedStartDate: null,
    plannedDueDate: null,
    actualStartDate: null,
    actualDueDate: null,
    tags,
    estimate: {
      storyPoints: 0,
      confidence: 'medium',
    },
    relatedStories: [],
    mentions: [],
    files: [],
    metadata: {
      createdBy: 'system',
      lastEditedBy: 'system',
      custom: {},
    },
    deleted: false,
    archived: false,
  }

  // Validate story
  const validatedStory = parseStory(story)

  // Write story file
  const storyFilePath = getStoryFilePath(projectName, epicName, storyId)
  await fs.writeFile(storyFilePath, JSON.stringify(validatedStory, null, 2) + '\n')

  return validatedStory
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('❌ Error: Please provide the path to the JSON input file')
    console.error('Usage: npm run create-epic-stories <input-json-file>')
    process.exit(1)
  }

  const inputFilePath = path.resolve(args[0])

  // Read and parse input JSON
  let input: EpicStoriesInput
  try {
    const content = await fs.readFile(inputFilePath, 'utf-8')
    input = JSON.parse(content)
  } catch (error) {
    console.error(`❌ Error reading input file: ${inputFilePath}`)
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }

  // Validate required fields
  if (!input.projectName) {
    console.error('❌ Error: projectName is required')
    process.exit(1)
  }

  if (!input.epic) {
    console.error('❌ Error: epic is required')
    process.exit(1)
  }

  if (!input.epic.epicId || !input.epic.title || !input.epic.businessOverview) {
    console.error('❌ Error: epic.epicId, epic.title, and epic.businessOverview are required')
    process.exit(1)
  }

  if (!input.stories || input.stories.length === 0) {
    console.error('❌ Error: stories array is required and must not be empty')
    process.exit(1)
  }

  const manager = input.manager || 'person-001'
  const epicName = generateEpicName(input.epic.title)

  console.log(`\n📦 Creating epic and stories for project: ${input.projectName}`)
  console.log(`📋 Epic: ${input.epic.title}`)
  console.log(`📁 Epic folder: ${epicName}`)
  console.log(`👤 Manager: ${manager}`)
  console.log(`📊 Stories to create: ${input.stories.length}\n`)

  // Ensure project directory exists
  await ensureDirectory(getProjectDir(input.projectName))

  // Ensure epic directory exists (needed before creating stories)
  await ensureDirectory(getEpicDir(input.projectName, epicName))

  // Separate functional and non-functional stories
  const functionalStories: StoryInput[] = []
  const nonFunctionalStories: StoryInput[] = []

  for (const story of input.stories) {
    if (story.requirementType === 'functional') {
      functionalStories.push(story)
    } else {
      nonFunctionalStories.push(story)
    }
  }

  // Generate story IDs
  const storyIds: string[] = []
  const storyMap = new Map<string, StoryInput>()

  // Functional stories first
  functionalStories.forEach((story, index) => {
    const storyId = generateStoryId(input.epic.epicId, 'functional', index)
    storyIds.push(storyId)
    storyMap.set(storyId, story)
  })

  // Non-functional stories next
  nonFunctionalStories.forEach((story, index) => {
    const storyId = generateStoryId(input.epic.epicId, 'non-functional', index)
    storyIds.push(storyId)
    storyMap.set(storyId, story)
  })

  // Create all stories
  console.log('Creating stories...')
  for (const storyId of storyIds) {
    const storyInput = storyMap.get(storyId)!
    await createStory(
      input.projectName,
      epicName,
      storyId,
      storyInput,
      input.epic.epicId,
      manager
    )
    console.log(`  ✅ ${storyId}: ${storyInput.title}`)
  }

  // Create epic
  console.log('\nCreating epic...')
  await createEpic(
    input.projectName,
    epicName,
    input.epic,
    storyIds,
    manager
  )

  console.log(`\n✅ Successfully created epic and ${storyIds.length} stories!`)
  console.log(`\n📝 Next steps:`)
  console.log(`   1. Update project.json to add "${epicName}" to epicIds array`)
  console.log(`   2. Verify the files in pm/${input.projectName}/${epicName}/`)
  console.log(`   3. Restart your dev server to see the new epic in the UI`)
}

// Run main function
main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})

