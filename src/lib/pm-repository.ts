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
  const filePath = getProjectFilePath(projectName)
  // Validate before writing
  parseProject(project)
  await writeJsonFile(filePath, project)
}

/**
 * List all projects
 */
export async function listProjects(): Promise<string[]> {
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
  try {
    const epicDir = getEpicDir(projectName, epicName)
    const entries = await fs.readdir(epicDir, { withFileTypes: true })
    return entries
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.startsWith('STORY-') &&
          entry.name.endsWith('.json')
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
  try {
    const filePath = getStoryFilePath(projectName, epicName, storyId)
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Delete a story
 */
export async function deleteStory(
  projectName: string,
  epicName: string,
  storyId: string
): Promise<void> {
  const filePath = getStoryFilePath(projectName, epicName, storyId)
  try {
    await fs.unlink(filePath)
  } catch (error) {
    throw new Error(
      `Failed to delete story ${storyId} in epic ${epicName}, project ${projectName}: ${error}`
    )
  }
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
 * Generate next sequential story ID (STORY-001 to STORY-999)
 */
export async function generateNextStoryId(
  projectName: string,
  epicName: string
): Promise<string> {
  const storyIds = await listStories(projectName, epicName)
  const storyNumbers: number[] = []

  for (const storyId of storyIds) {
    const match = storyId.match(/^STORY-(\d{3})$/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num)) {
        storyNumbers.push(num)
      }
    }
  }

  const nextNumber = storyNumbers.length > 0 ? Math.max(...storyNumbers) + 1 : 1
  if (nextNumber > 999) {
    throw new Error('Maximum number of stories (999) reached for this epic')
  }

  return `STORY-${nextNumber.toString().padStart(3, '0')}`
}

/**
 * Create a new story with generated ID
 */
export async function createStory(
  projectName: string,
  epicName: string,
  storyData: Partial<Story> = {}
): Promise<Story> {
  const storyId = await generateNextStoryId(projectName, epicName)
  const now = generateTimestamp()

  const story: Story = {
    id: storyId,
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
    ...storyData,
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
  storyExists,
  deleteStory,
  createStory,
}

