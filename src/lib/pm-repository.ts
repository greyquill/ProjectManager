import { promises as fs } from 'fs'
import path from 'path'
import {
  Project,
  Epic,
  Story,
  parseProject,
  parseEpic,
  parseStory,
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
 */
export async function listEpics(projectName: string): Promise<string[]> {
  try {
    const projectDir = getProjectDir(projectName)
    const entries = await fs.readdir(projectDir, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isDirectory() && entry.name !== '.git')
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
 * Create a new story with generated ID
 */
export async function createStory(
  projectName: string,
  epicName: string,
  storyData: Partial<Story> = {}
): Promise<Story> {
  const storyId = generateStoryId()
  const now = generateTimestamp()

  const story: Story = {
    id: storyId,
    title: storyData.title || '',
    summary: storyData.summary || '',
    description: storyData.description || '',
    acceptanceCriteria: storyData.acceptanceCriteria || [],
    status: storyData.status || 'todo',
    priority: storyData.priority || 'medium',
    assignee: storyData.assignee || 'unassigned',
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
  // Projects
  readProject,
  writeProject,
  listProjects,
  projectExists,
  deleteProject,

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

