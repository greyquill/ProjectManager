import { promises as fs } from 'fs'
import path from 'path'
import {
  Project,
  Epic,
  Story,
  Person,
  parseProject,
  parseEpic,
  parseStory,
  parsePeople,
  generateStoryId,
  generateTimestamp,
} from './types'

// ============================================================================
// Configuration
// ============================================================================

const PM_DATA_DIR = path.join(process.cwd(), 'pm')

// Determine storage backend: use Redis/KV in production (Vercel), files in development
// Supports both Upstash Redis (Marketplace) and Vercel KV (legacy)
//
// Logic (automatic detection):
// - Local development: ENVIRONMENT=DEV or NODE_ENV=development → use local files (pm/ folder)
// - Production: ENVIRONMENT=PROD or VERCEL=1 → use KV/Redis
// - Default: use local files for safety (prevents accidental KV usage in dev)
const USE_KV = (process.env.ENVIRONMENT === 'PROD' || process.env.VERCEL === '1') &&
               process.env.ENVIRONMENT !== 'DEV' &&
               process.env.NODE_ENV !== 'development'

// Lazy-load KV repository
let kvRepositoryPromise: Promise<typeof import('./pm-repository-kv').pmRepositoryKV | null> | null = null

async function getKVRepository() {
  if (!USE_KV) {
    return null
  }
  if (kvRepositoryPromise === null) {
    kvRepositoryPromise = import('./pm-repository-kv')
      .then(module => {
        return module.pmRepositoryKV
      })
      .catch(error => {
        console.warn('[Repository] Vercel KV not available, falling back to file system:', error)
        return null
      })
  }
  return await kvRepositoryPromise
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Ensure directory exists, create if it doesn't
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

/**
 * Get project directory path
 */
function getProjectDir(projectName: string): string {
  return path.join(PM_DATA_DIR, projectName)
}

/**
 * Get global people file path
 */
function getGlobalPeopleFilePath(): string {
  return path.join(PM_DATA_DIR, 'people.json')
}

/**
 * Get epic directory path
 */
function getEpicDir(projectName: string, epicName: string): string {
  return path.join(PM_DATA_DIR, projectName, epicName)
}

/**
 * Get project JSON file path
 */
function getProjectFilePath(projectName: string): string {
  return path.join(PM_DATA_DIR, projectName, 'project.json')
}

/**
 * Get people JSON file path
 */
function getPeopleFilePath(projectName: string): string {
  return path.join(PM_DATA_DIR, projectName, 'people.json')
}

/**
 * Get epic JSON file path
 */
function getEpicFilePath(projectName: string, epicName: string): string {
  return path.join(PM_DATA_DIR, projectName, epicName, 'epic.json')
}

/**
 * Get story JSON file path
 */
function getStoryFilePath(
  projectName: string,
  epicName: string,
  storyId: string
): string {
  return path.join(PM_DATA_DIR, projectName, epicName, `${storyId}.json`)
}

/**
 * Read and parse JSON file
 */
async function readJsonFile<T>(
  filePath: string,
  parser: (data: unknown) => T
): Promise<T> {
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

/**
 * Write JSON file atomically
 */
async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath)
  await ensureDirectory(dir)

  const content = JSON.stringify(data, null, 2)
  const tempPath = `${filePath}.tmp`

  try {
    // Write to temp file first
    await fs.writeFile(tempPath, content, 'utf-8')
    // Atomic move
    await fs.rename(tempPath, filePath)
  } catch (error) {
    // Clean up temp file on error
    try {
      await fs.unlink(tempPath)
    } catch {
      // Ignore cleanup errors
    }
    throw new Error(`Failed to write file: ${filePath} - ${error}`)
  }
}

// ============================================================================
// Project Operations
// ============================================================================

/**
 * Read a project by name
 */
export async function readProject(projectName: string): Promise<Project> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.readProject(projectName)
  }
  const filePath = getProjectFilePath(projectName)
  return readJsonFile(filePath, parseProject)
}

/**
 * Write a project
 */
export async function writeProject(
  projectName: string,
  project: Project
): Promise<void> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.writeProject(projectName, project)
  }
  const filePath = getProjectFilePath(projectName)
  // Validate before writing
  parseProject(project)
  await writeJsonFile(filePath, project)
}

/**
 * List all projects
 */
export async function listProjects(): Promise<string[]> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.listProjects()
  }
  try {
    const entries = await fs.readdir(PM_DATA_DIR, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Directory doesn't exist yet, return empty array
      return []
    }
    throw new Error(`Failed to list projects: ${error}`)
  }
}

/**
 * Check if project exists
 */
export async function projectExists(projectName: string): Promise<boolean> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.projectExists(projectName)
  }
  try {
    const filePath = getProjectFilePath(projectName)
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Delete a project (and all its epics and stories)
 */
export async function deleteProject(projectName: string): Promise<void> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.deleteProject(projectName)
  }
  const projectDir = getProjectDir(projectName)
  try {
    await fs.rm(projectDir, { recursive: true, force: true })
  } catch (error) {
    throw new Error(`Failed to delete project: ${projectName} - ${error}`)
  }
}

// ============================================================================
// People Operations
// ============================================================================

/**
 * Read people for a project
 */
export async function readPeople(projectName: string): Promise<Person[]> {
  const filePath = getPeopleFilePath(projectName)
  try {
    return await readJsonFile(filePath, parsePeople)
  } catch (error) {
    // If file doesn't exist, return empty array
    // readJsonFile wraps errors, so check the error message
    if (error instanceof Error && error.message.includes('File not found')) {
      return []
    }
    // Also check for ENOENT in case the error is not wrapped
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
}

/**
 * Write people for a project
 */
export async function writePeople(
  projectName: string,
  people: Person[]
): Promise<void> {
  const filePath = getPeopleFilePath(projectName)
  // Validate before writing
  parsePeople(people)
  await ensureDirectory(getProjectDir(projectName))
  await writeJsonFile(filePath, people)
}

/**
 * Check if people file exists
 */
export async function peopleExists(projectName: string): Promise<boolean> {
  try {
    const filePath = getPeopleFilePath(projectName)
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Get all people from all projects (DEPRECATED - use readGlobalPeople instead)
 */
export async function getAllPeople(): Promise<Array<{ person: Person; projectName: string }>> {
  const projectNames = await listProjects()
  const allPeople: Array<{ person: Person; projectName: string }> = []

  for (const projectName of projectNames) {
    try {
      const people = await readPeople(projectName)
      people.forEach((person) => {
        allPeople.push({ person, projectName })
      })
    } catch {
      // Skip projects that can't be read
    }
  }

  return allPeople
}

/**
 * Read global people list
 */
export async function readGlobalPeople(): Promise<Person[]> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.readGlobalPeople()
  }
  const filePath = getGlobalPeopleFilePath()
  try {
    return await readJsonFile(filePath, parsePeople)
  } catch (error) {
    // If file doesn't exist, return empty array
    if (error instanceof Error && error.message.includes('File not found')) {
      return []
    }
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
}

/**
 * Write global people list
 */
export async function writeGlobalPeople(people: Person[]): Promise<void> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.writeGlobalPeople(people)
  }
  const filePath = getGlobalPeopleFilePath()
  // Validate before writing
  parsePeople(people)
  await ensureDirectory(PM_DATA_DIR)
  await writeJsonFile(filePath, people)
}

/**
 * Check if global people file exists
 */
export async function globalPeopleExists(): Promise<boolean> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.globalPeopleExists()
  }
  try {
    const filePath = getGlobalPeopleFilePath()
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Check where a person is used (returns list of projects where person is manager or contributor)
 */
export async function checkPersonUsage(personId: string): Promise<{
  projects: Array<{ name: string; asManager: boolean; asContributor: boolean; inEpics: string[]; inStories: string[] }>
}> {
  const projectNames = await listProjects()
  const usage: Array<{ name: string; asManager: boolean; asContributor: boolean; inEpics: string[]; inStories: string[] }> = []

  for (const projectName of projectNames) {
    try {
      const project = await readProject(projectName)
      const isManager = project.metadata?.manager === personId
      const isContributor = project.metadata?.contributors?.includes(personId) || false
      const inEpics: string[] = []
      const inStories: string[] = []

      if (isManager || isContributor) {
        // Check epics and stories
        const epics = await listEpics(projectName)
        for (const epicName of epics) {
          try {
            const epic = await readEpic(projectName, epicName)
            if (epic.manager === personId) {
              inEpics.push(epicName)
            }
            // Check stories in this epic
            const stories = await listStories(projectName, epicName)
            for (const storyId of stories) {
              try {
                const story = await readStory(projectName, epicName, storyId)
                if (story.manager === personId) {
                  inStories.push(`${epicName}/${storyId}`)
                }
              } catch {
                // Skip stories that can't be read
              }
            }
          } catch {
            // Skip epics that can't be read
          }
        }
      } else {
        // Still check epics and stories even if not manager/contributor
        const epics = await listEpics(projectName)
        for (const epicName of epics) {
          try {
            const epic = await readEpic(projectName, epicName)
            if (epic.manager === personId) {
              inEpics.push(epicName)
            }
            const stories = await listStories(projectName, epicName)
            for (const storyId of stories) {
              try {
                const story = await readStory(projectName, epicName, storyId)
                if (story.manager === personId) {
                  inStories.push(`${epicName}/${storyId}`)
                }
              } catch {
                // Skip
              }
            }
          } catch {
            // Skip
          }
        }
      }

      if (isManager || isContributor || inEpics.length > 0 || inStories.length > 0) {
        usage.push({
          name: projectName,
          asManager: isManager,
          asContributor: isContributor,
          inEpics,
          inStories,
        })
      }
    } catch {
      // Skip projects that can't be read
    }
  }

  return { projects: usage }
}

// ============================================================================
// Epic Operations
// ============================================================================

/**
 * Read an epic
 */
export async function readEpic(
  projectName: string,
  epicName: string
): Promise<Epic> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.readEpic(projectName, epicName)
  }
  const filePath = getEpicFilePath(projectName, epicName)
  return readJsonFile(filePath, parseEpic)
}

/**
 * Write an epic
 */
export async function writeEpic(
  projectName: string,
  epicName: string,
  epic: Epic
): Promise<void> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.writeEpic(projectName, epicName, epic)
  }
  const filePath = getEpicFilePath(projectName, epicName)
  // Validate before writing
  parseEpic(epic)
  // Update timestamp
  epic.updatedAt = generateTimestamp()
  await writeJsonFile(filePath, epic)
}

/**
 * List all epics for a project
 * Returns both old format (title-based) and new format (EPIC-XXXX) epics
 */
export async function listEpics(projectName: string): Promise<string[]> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.listEpics(projectName)
  }
  try {
    const projectDir = getProjectDir(projectName)
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

/**
 * Check if epic exists
 */
export async function epicExists(
  projectName: string,
  epicName: string
): Promise<boolean> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.epicExists(projectName, epicName)
  }
  try {
    const filePath = getEpicFilePath(projectName, epicName)
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Delete an epic (and all its stories)
 */
export async function deleteEpic(
  projectName: string,
  epicName: string
): Promise<void> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.deleteEpic(projectName, epicName)
  }
  const epicDir = getEpicDir(projectName, epicName)
  try {
    await fs.rm(epicDir, { recursive: true, force: true })
  } catch (error) {
    throw new Error(
      `Failed to delete epic ${epicName} in project ${projectName}: ${error}`
    )
  }
}

// ============================================================================
// Story Operations
// ============================================================================

/**
 * Read a story
 */
export async function readStory(
  projectName: string,
  epicName: string,
  storyId: string
): Promise<Story> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.readStory(projectName, epicName, storyId)
  }
  const filePath = getStoryFilePath(projectName, epicName, storyId)
  return readJsonFile(filePath, parseStory)
}

/**
 * Write a story
 */
export async function writeStory(
  projectName: string,
  epicName: string,
  storyId: string,
  story: Story
): Promise<void> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.writeStory(projectName, epicName, storyId, story)
  }
  const filePath = getStoryFilePath(projectName, epicName, storyId)
  // Validate before writing
  parseStory(story)
  // Ensure ID matches
  if (story.id !== storyId) {
    story.id = storyId
  }
  // Update timestamp
  story.updatedAt = generateTimestamp()
  await writeJsonFile(filePath, story)
}

/**
 * List all stories for an epic
 */
export async function listStories(
  projectName: string,
  epicName: string
): Promise<string[]> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.listStories(projectName, epicName)
  }
  try {
    const epicDir = getEpicDir(projectName, epicName)
    const entries = await fs.readdir(epicDir, { withFileTypes: true })
    return entries
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.endsWith('.json') &&
          entry.name !== 'epic.json' &&
          // Support both old format (STORY-XXX) and new format (F-XXX-### or NFR-XXX-###)
          (entry.name.startsWith('STORY-') ||
           /^(F|NFR)-[A-Z]{2,6}-\d{3}\.json$/.test(entry.name))
      )
      .map((entry) => entry.name.replace('.json', ''))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw new Error(
      `Failed to list stories for epic ${epicName} in project ${projectName}: ${error}`
    )
  }
}

/**
 * Check if story exists
 */
export async function storyExists(
  projectName: string,
  epicName: string,
  storyId: string
): Promise<boolean> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.storyExists(projectName, epicName, storyId)
  }
  try {
    const filePath = getStoryFilePath(projectName, epicName, storyId)
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * List only active (non-deleted) stories for an epic
 */
export async function listActiveStories(
  projectName: string,
  epicName: string
): Promise<string[]> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.listActiveStories(projectName, epicName)
  }

  try {
    const allStoryIds = await listStories(projectName, epicName)
    const activeStoryIds: string[] = []

    for (const storyId of allStoryIds) {
      try {
        const story = await readStory(projectName, epicName, storyId)
        if (!story.deleted) {
          activeStoryIds.push(storyId)
        }
      } catch (error) {
        // If story doesn't exist or can't be read, skip it
        console.warn(`Could not read story ${storyId} to check deleted status:`, error)
      }
    }

    return activeStoryIds
  } catch (error) {
    console.warn('Error listing active stories, returning empty array:', error)
    return []
  }
}

/**
 * Delete a story (soft delete - marks as deleted but preserves file for ID sequencing)
 */
export async function deleteStory(
  projectName: string,
  epicName: string,
  storyId: string
): Promise<void> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.deleteStory(projectName, epicName, storyId)
  }

  // Soft delete: mark story as deleted instead of actually deleting it
  try {
    const story = await readStory(projectName, epicName, storyId)
    const updatedStory = {
      ...story,
      deleted: true,
      updatedAt: generateTimestamp(),
    }
    await writeStory(projectName, epicName, storyId, updatedStory)

    // Remove from epic's storyIds array (so it doesn't show in UI)
    try {
      const epic = await readEpic(projectName, epicName)
      const epicStoryIds = epic.storyIds || []
      const updatedEpicStoryIds = epicStoryIds.filter((id: string) => id !== storyId)
      if (updatedEpicStoryIds.length !== epicStoryIds.length) {
        const updatedEpic = {
          ...epic,
          storyIds: updatedEpicStoryIds,
          updatedAt: generateTimestamp(),
        }
        await writeEpic(projectName, epicName, updatedEpic)
      }
    } catch (error) {
      console.warn(`Could not update epic's storyIds when deleting story ${storyId}:`, error)
    }
  } catch (error) {
    // If story doesn't exist, that's fine - it's already "deleted"
    console.warn(`Could not mark story ${storyId} as deleted:`, error)
  }

  // Note: We do NOT delete the file - this preserves the story ID for sequencing purposes
}

/**
 * Generate next sequential epic ID (EPIC-0001 to EPIC-9999)
 */
export async function generateNextEpicId(projectName: string): Promise<string> {
  const epicNames = await listEpics(projectName)
  const epicNumbers: number[] = []

  for (const epicName of epicNames) {
    const match = epicName.match(/^EPIC-(\d{4})$/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num)) {
        epicNumbers.push(num)
      }
    }
  }

  const nextNumber = epicNumbers.length > 0 ? Math.max(...epicNumbers) + 1 : 1
  if (nextNumber > 9999) {
    throw new Error('Maximum number of epics (9999) reached')
  }

  return `EPIC-${nextNumber.toString().padStart(4, '0')}`
}

/**
 * Generate a unique 2-6 character acronym from an epic name
 * Examples: "Revenue Cycle Management" -> "RCM", "Scheduling" -> "SCHED", "AI" -> "AI"
 */
async function generateEpicAcronym(
  projectName: string,
  epicName: string
): Promise<string> {
  // Read the epic to get its title
  const epic = await readEpic(projectName, epicName)
  const epicTitle = epic.title || epicName

  // Get all epics in the project to check for uniqueness
  const allEpics = await listEpics(projectName)
  const existingAcronyms = new Set<string>()

  // Extract existing acronyms from story IDs (2-6 characters)
  for (const epic of allEpics) {
    const stories = await listStories(projectName, epic)
    for (const storyId of stories) {
      const match = storyId.match(/^(F|NFR)-([A-Z]{2,6})-\d{3}$/)
      if (match) {
        existingAcronyms.add(match[2])
      }
    }
  }

  // Generate acronym from epic title
  // Remove common words and extract meaningful words
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])
  const words = epicTitle
    .toLowerCase()
    .split(/[\s\-_]+/)
    .filter(word => word.length > 0 && !commonWords.has(word))

  let acronym = ''
  if (words.length >= 3) {
    // Use first letter of first 3-6 meaningful words (prefer shorter)
    const maxWords = Math.min(words.length, 6)
    acronym = words.slice(0, maxWords).map(word => word[0].toUpperCase()).join('')
  } else if (words.length === 2) {
    // Use first letters of both words, optionally add more letters for clarity
    const word1 = words[0]
    const word2 = words[1]
    // Try to create a meaningful 2-6 char acronym
    if (word1.length >= 3 && word2.length >= 3) {
      // Use first 2-3 letters of each word (e.g., "Scheduling" + "Management" -> "SCHED" or "SCHMAN")
      const len1 = Math.min(3, word1.length)
      const len2 = Math.min(3, word2.length)
      acronym = (word1.substring(0, len1) + word2.substring(0, len2)).toUpperCase()
    } else {
      // Use first letters
      acronym = (word1[0] + word2[0]).toUpperCase()
    }
  } else if (words.length === 1) {
    // Use first 2-6 letters of the word (prefer shorter meaningful acronyms)
    const word = words[0]
    if (word.length <= 6) {
      acronym = word.toUpperCase()
    } else {
      // For longer words, try to create a meaningful acronym
      // Prefer 3-5 characters for readability
      const preferredLength = Math.min(5, Math.max(3, Math.floor(word.length / 2)))
      acronym = word.substring(0, preferredLength).toUpperCase()
    }
  } else {
    // Fallback: use first 2-6 letters of epic name
    const fallback = epicName.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    acronym = fallback.substring(0, Math.min(6, Math.max(2, fallback.length)))
    if (acronym.length < 2) {
      acronym = (acronym + 'XX').substring(0, 2)
    }
  }

  // Ensure minimum length of 2
  if (acronym.length < 2) {
    acronym = (acronym + 'XX').substring(0, 2)
  }
  // Ensure maximum length of 6
  if (acronym.length > 6) {
    acronym = acronym.substring(0, 6)
  }

  // Ensure uniqueness - if acronym exists, try variations
  let finalAcronym = acronym
  let attempts = 0
  const maxAttempts = 100

  while (existingAcronyms.has(finalAcronym) && attempts < maxAttempts) {
    attempts++

    // Strategy 1: If length < 6, try appending a letter
    if (finalAcronym.length < 6) {
      const lastChar = finalAcronym[finalAcronym.length - 1]
      const nextChar = String.fromCharCode(((lastChar.charCodeAt(0) - 65 + 1) % 26) + 65)
      finalAcronym = finalAcronym + nextChar
    } else {
      // Strategy 2: Replace last character with next letter
      const lastChar = finalAcronym[finalAcronym.length - 1]
      const nextChar = String.fromCharCode(((lastChar.charCodeAt(0) - 65 + 1) % 26) + 65)
      finalAcronym = finalAcronym.substring(0, finalAcronym.length - 1) + nextChar
    }
  }

  // If still not unique, append a number (but keep within 6 char limit)
  if (existingAcronyms.has(finalAcronym)) {
    let num = 1
    const baseAcronym = finalAcronym.substring(0, Math.min(5, finalAcronym.length))
    while (existingAcronyms.has(baseAcronym + num.toString()) && num < 10) {
      num++
    }
    finalAcronym = baseAcronym + num.toString()
  }

  return finalAcronym
}

/**
 * Generate next sequential story ID (F-XX-001 to F-XXXXXX-999 or NFR-XX-001 to NFR-XXXXXX-999)
 * Story IDs are unique per epic, starting from 001 for each epic
 * Format: F-{2-6 chars}-### for functional requirements, NFR-{2-6 chars}-### for non-functional requirements
 */
export async function generateNextStoryId(
  projectName: string,
  epicName: string,
  requirementType: 'functional' | 'non-functional' = 'functional'
): Promise<string> {
  const kvRepo = await getKVRepository()
  if (kvRepo) {
    return kvRepo.generateNextStoryId(projectName, epicName, requirementType)
  }

  // Generate epic acronym
  const acronym = await generateEpicAcronym(projectName, epicName)

  // Get all stories in this epic to find the next number
  const storyIds = await listStories(projectName, epicName)

  // Extract story numbers for this epic with matching prefix and acronym
  // Escape special regex characters in acronym
  const prefix = requirementType === 'functional' ? 'F' : 'NFR'
  const escapedAcronym = acronym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`^${prefix}-${escapedAcronym}-(\\d{3})$`)

  const storyNumbers: number[] = []
  for (const storyId of storyIds) {
    const match = storyId.match(pattern)
    if (match) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num)) {
        storyNumbers.push(num)
      }
    }
  }

  // Start from 001 for each epic
  const nextNumber = storyNumbers.length > 0 ? Math.max(...storyNumbers) + 1 : 1
  if (nextNumber > 999) {
    throw new Error(`Maximum number of stories (999) reached for epic ${epicName}`)
  }

  return `${prefix}-${acronym}-${nextNumber.toString().padStart(3, '0')}`
}

/**
 * Create a new story with generated ID
 */
export async function createStory(
  projectName: string,
  epicName: string,
  storyData: Partial<Story> = {}
): Promise<Story> {
  const requirementType = storyData.requirementType || 'functional'
  const storyId = await generateNextStoryId(projectName, epicName, requirementType)
  const now = generateTimestamp()

  const story: Story = {
    id: storyId,
    requirementType,
    title: storyData.title || '',
    summary: storyData.summary || '',
    description: storyData.description || '',
    acceptanceCriteria: storyData.acceptanceCriteria || [],
    status: storyData.status || 'todo',
    priority: storyData.priority || 'medium',
    manager: storyData.manager || 'unassigned',
    createdAt: now,
    updatedAt: now,
    tags: storyData.tags || [],
    estimate: storyData.estimate || { storyPoints: 0 },
    relatedStories: storyData.relatedStories || [],
    mentions: storyData.mentions || [],
    files: storyData.files || [],
    metadata: storyData.metadata || {
      createdBy: 'unassigned',
      lastEditedBy: 'unassigned',
      custom: {},
    },
    deleted: false, // New stories are always active
    ...storyData,
    // Ensure archived is always a boolean (not undefined)
    archived: storyData.archived ?? false,
  }

  await writeStory(projectName, epicName, storyId, story)
  return story
}

// ============================================================================
// Repository Object (for convenience)
// ============================================================================

export const pmRepository = {
  // ID Generation
  generateNextEpicId,
  generateNextStoryId,
  // Projects
  readProject,
  writeProject,
  listProjects,
  projectExists,
  deleteProject,

  // People (per-project - deprecated)
  readPeople,
  writePeople,
  peopleExists,
  getAllPeople,
  checkPersonUsage,

  // People (global)
  readGlobalPeople,
  writeGlobalPeople,
  globalPeopleExists,

  // Epics
  readEpic,
  writeEpic,
  listEpics,
  epicExists,
  deleteEpic,

  // Stories
  readStory,
  writeStory,
  listStories,
  listActiveStories,
  storyExists,
  deleteStory,
  createStory,
}

