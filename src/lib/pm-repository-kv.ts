import {
  Project,
  Epic,
  Story,
  Person,
  parseProject,
  parseEpic,
  parseStory,
  parsePeople,
  generateTimestamp,
} from './types'

// ============================================================================
// Redis/KV Client Setup
// ============================================================================

// Support both @upstash/redis (Marketplace - recommended) and @vercel/kv (legacy)
// Lazy initialization to avoid build-time errors
let kvClient: any = null
let initError: Error | null = null

function getKVClient() {
  if (kvClient) return kvClient
  if (initError) throw initError

  // Check which environment variables are available
  const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  const hasVercelKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

  try {
    // Prioritize Upstash Redis (Marketplace - recommended) over Vercel KV (legacy)
    // Upstash Redis from Marketplace uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
    if (hasUpstash) {
      try {
        const { Redis } = require('@upstash/redis')
        kvClient = Redis.fromEnv()
        return kvClient
      } catch (error: any) {
        console.warn('Failed to initialize Upstash Redis, trying Vercel KV:', error?.message)
        // Fall through to try Vercel KV
      }
    }

    // Fall back to Vercel KV (legacy) if Upstash is not available
    if (hasVercelKV) {
      try {
        const vercelKv = require('@vercel/kv')
        kvClient = vercelKv.kv
        return kvClient
      } catch (error: any) {
        console.warn('Failed to initialize Vercel KV:', error?.message)
        // Fall through to try Upstash without env vars
      }
    }

    // Last resort: try Upstash Redis without explicit env var check
    // (Redis.fromEnv() will check for the env vars itself)
    try {
      const { Redis } = require('@upstash/redis')
      kvClient = Redis.fromEnv()
      return kvClient
    } catch (error: any) {
      // If this fails, we'll throw a comprehensive error below
    }

    // If we get here, neither client could be initialized
    throw new Error(
      `Neither Upstash Redis nor Vercel KV could be initialized. ` +
      `Upstash env vars (UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN): ${hasUpstash ? 'present' : 'missing'}. ` +
      `Vercel KV env vars (KV_REST_API_URL/KV_REST_API_TOKEN): ${hasVercelKV ? 'present' : 'missing'}. ` +
      `Please ensure Upstash Redis is installed from the Vercel Marketplace and environment variables are set.`
    )
  } catch (error: any) {
    // Store error for better debugging
    initError = new Error(
      `Redis/KV client initialization failed: ${error?.message || String(error)}. ` +
      `Please ensure Upstash Redis is installed from the Vercel Marketplace and environment variables are configured.`
    )
    throw initError
  }
}

// Create a proxy that initializes the client on first use
const kv = new Proxy({} as any, {
  get(_target, prop) {
    try {
      const client = getKVClient()
      if (!client) {
        throw new Error('Redis/KV client not available. Please install @upstash/redis from the Vercel Marketplace.')
      }
      const method = client[prop]
      if (typeof method === 'function') {
        return method.bind(client)
      }
      return method
    } catch (error) {
      // Provide better error message
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Redis client error: ${errorMessage}. Make sure Upstash Redis is connected and environment variables are set.`)
    }
  }
})

// ============================================================================
// Key Helpers
// ============================================================================

function getProjectKey(projectName: string): string {
  return `pm:project:${projectName}`
}

function getEpicKey(projectName: string, epicName: string): string {
  return `pm:project:${projectName}:epic:${epicName}`
}

function getStoryKey(projectName: string, epicName: string, storyId: string): string {
  return `pm:project:${projectName}:epic:${epicName}:story:${storyId}`
}

function getPeopleKey(): string {
  return `pm:people`
}

function getProjectsListKey(): string {
  return `pm:projects:list`
}

function getEpicsListKey(projectName: string): string {
  return `pm:project:${projectName}:epics:list`
}

function getStoriesListKey(projectName: string, epicName: string): string {
  return `pm:project:${projectName}:epic:${epicName}:stories:list`
}

// ============================================================================
// Project Operations
// ============================================================================

export async function readProject(projectName: string): Promise<Project> {
  const key = getProjectKey(projectName)
  const data = await kv.get(key)
  if (!data) {
    throw new Error(`Project "${projectName}" not found`)
  }
  return parseProject(data)
}

export async function writeProject(projectName: string, project: Project): Promise<void> {
  const key = getProjectKey(projectName)
  parseProject(project)

  // Write the project first
  await kv.set(key, project)

  // Update projects list - ensure this always succeeds
  try {
    const projectsList = await kv.get(getProjectsListKey())
    const updatedList = Array.isArray(projectsList) ? projectsList : []
    if (!updatedList.includes(projectName)) {
      updatedList.push(projectName)
      await kv.set(getProjectsListKey(), updatedList)
    }
  } catch (error) {
    // If projects list doesn't exist or update failed, create/overwrite it
    console.warn('Failed to update projects list, creating new list:', error)
    try {
      await kv.set(getProjectsListKey(), [projectName])
    } catch (setError) {
      console.error('Failed to create projects list:', setError)
      // Don't throw - the project was written successfully, list can be rebuilt later
    }
  }
}

export async function listProjects(): Promise<string[]> {
  try {
    const projectsList = await kv.get(getProjectsListKey())
    if (Array.isArray(projectsList) && projectsList.length > 0) {
      return projectsList
    }

    // If list is empty or doesn't exist, try to discover projects by scanning keys
    // This is a fallback in case the list wasn't properly maintained
    try {
      // Note: Redis doesn't support wildcard searches directly in Vercel KV
      // So we'll just return the list (even if empty) and let the writeProject fix it
      // For now, return empty array - the list should be maintained by writeProject
      return []
    } catch (error) {
      console.warn('Error discovering projects, returning empty array:', error)
      return []
    }
  } catch (error) {
    // If database is empty or key doesn't exist, return empty array
    console.warn('Error reading projects list from Redis, returning empty array:', error)
    return []
  }
}

export async function projectExists(projectName: string): Promise<boolean> {
  const key = getProjectKey(projectName)
  const result = await kv.exists(key)
  // Upstash returns number (0 or 1), Vercel KV returns boolean
  return typeof result === 'number' ? result === 1 : Boolean(result)
}

export async function deleteProject(projectName: string): Promise<void> {
  const key = getProjectKey(projectName)

  // Get all epics for this project
  const epics = await listEpics(projectName)

  // Delete all stories and epics
  for (const epicName of epics) {
    const stories = await listStories(projectName, epicName)
    for (const storyId of stories) {
      await kv.del(getStoryKey(projectName, epicName, storyId))
    }
    await kv.del(getEpicKey(projectName, epicName))
    await kv.del(getStoriesListKey(projectName, epicName))
  }

  await kv.del(key)
  await kv.del(getEpicsListKey(projectName))

  // Remove from projects list
  const projectsList = await kv.get(getProjectsListKey()) || []
  const updatedList = projectsList.filter((p: string) => p !== projectName)
  await kv.set(getProjectsListKey(), updatedList)
}

// ============================================================================
// People Operations (Global)
// ============================================================================

export async function readGlobalPeople(): Promise<Person[]> {
  try {
    const key = getPeopleKey()
    const data = await kv.get(key)
    if (!data) {
      return []
    }
    return parsePeople(data)
  } catch (error) {
    // If database is empty or key doesn't exist, return empty array
    console.error('[KV Repository] Error reading people from Redis:', error)
    return []
  }
}

export async function writeGlobalPeople(people: Person[]): Promise<void> {
  const key = getPeopleKey()
  parsePeople(people)
  await kv.set(key, people)
}

export async function globalPeopleExists(): Promise<boolean> {
  const key = getPeopleKey()
  const result = await kv.exists(key)
  // Upstash returns number (0 or 1), Vercel KV returns boolean
  return typeof result === 'number' ? result === 1 : Boolean(result)
}

// Legacy per-project people (for compatibility)
export async function readPeople(projectName: string): Promise<Person[]> {
  // In KV, we use global people
  return readGlobalPeople()
}

export async function writePeople(projectName: string, people: Person[]): Promise<void> {
  // In KV, we use global people
  await writeGlobalPeople(people)
}

export async function peopleExists(projectName: string): Promise<boolean> {
  return globalPeopleExists()
}

export async function getAllPeople(): Promise<Person[]> {
  return readGlobalPeople()
}

export async function checkPersonUsage(personId: string): Promise<{
  projects: string[]
  epics: { projectName: string; epicName: string }[]
  stories: { projectName: string; epicName: string; storyId: string }[]
}> {
  const projects: string[] = []
  const epics: { projectName: string; epicName: string }[] = []
  const stories: { projectName: string; epicName: string; storyId: string }[] = []

  const projectNames = await listProjects()

  for (const projectName of projectNames) {
    const project = await readProject(projectName)
    if (project.metadata?.manager === personId || project.metadata?.contributors?.includes(personId)) {
      projects.push(projectName)
    }

    const epicNames = await listEpics(projectName)
    for (const epicName of epicNames) {
      const epic = await readEpic(projectName, epicName)
      if (epic.manager === personId) {
        epics.push({ projectName, epicName })
      }

      const storyIds = await listStories(projectName, epicName)
      for (const storyId of storyIds) {
        const story = await readStory(projectName, epicName, storyId)
        if (story.manager === personId) {
          stories.push({ projectName, epicName, storyId })
        }
      }
    }
  }

  return { projects, epics, stories }
}

// ============================================================================
// Epic Operations
// ============================================================================

export async function readEpic(projectName: string, epicName: string): Promise<Epic> {
  const key = getEpicKey(projectName, epicName)
  const data = await kv.get(key)
  if (!data) {
    throw new Error(`Epic "${epicName}" not found in project "${projectName}"`)
  }
  return parseEpic(data)
}

export async function writeEpic(projectName: string, epicName: string, epic: Epic): Promise<void> {
  const key = getEpicKey(projectName, epicName)
  parseEpic(epic)

  // Update epics list
  const epicsList = await kv.get(getEpicsListKey(projectName)) || []
  if (!epicsList.includes(epicName)) {
    epicsList.push(epicName)
    await kv.set(getEpicsListKey(projectName), epicsList)
  }

  await kv.set(key, epic)
}

export async function listEpics(projectName: string): Promise<string[]> {
  try {
    const epicsList = await kv.get(getEpicsListKey(projectName))
    return Array.isArray(epicsList) ? epicsList : []
  } catch (error) {
    console.warn('Error reading epics list from Redis, returning empty array:', error)
    return []
  }
}

export async function epicExists(projectName: string, epicName: string): Promise<boolean> {
  const key = getEpicKey(projectName, epicName)
  const result = await kv.exists(key)
  // Upstash returns number (0 or 1), Vercel KV returns boolean
  return typeof result === 'number' ? result === 1 : Boolean(result)
}

export async function deleteEpic(projectName: string, epicName: string): Promise<void> {
  const key = getEpicKey(projectName, epicName)

  // Delete all stories
  const stories = await listStories(projectName, epicName)
  for (const storyId of stories) {
    await kv.del(getStoryKey(projectName, epicName, storyId))
  }

  await kv.del(key)
  await kv.del(getStoriesListKey(projectName, epicName))

  // Remove from epics list
  const epicsList = await kv.get(getEpicsListKey(projectName)) || []
  const updatedList = epicsList.filter((e: string) => e !== epicName)
  await kv.set(getEpicsListKey(projectName), updatedList)
}

// ============================================================================
// Story Operations
// ============================================================================

export async function readStory(
  projectName: string,
  epicName: string,
  storyId: string
): Promise<Story> {
  const key = getStoryKey(projectName, epicName, storyId)
  const data = await kv.get(key)
  if (!data) {
    throw new Error(`Story "${storyId}" not found in epic "${epicName}"`)
  }
  return parseStory(data)
}

export async function writeStory(
  projectName: string,
  epicName: string,
  storyId: string,
  story: Story
): Promise<void> {
  const key = getStoryKey(projectName, epicName, storyId)
  parseStory(story)

  // Ensure ID matches
  if (story.id !== storyId) {
    story.id = storyId
  }

  // Update timestamp
  story.updatedAt = generateTimestamp()

  // Update stories list
  const storiesList = await kv.get(getStoriesListKey(projectName, epicName)) || []
  const isNewStory = !storiesList.includes(storyId)
  if (isNewStory) {
    storiesList.push(storyId)
    await kv.set(getStoriesListKey(projectName, epicName), storiesList)
  }

  await kv.set(key, story)

  // If this is a new story, update the epic's storyIds array
  if (isNewStory) {
    try {
      const epic = await readEpic(projectName, epicName)
      const epicStoryIds = epic.storyIds || []
      if (!epicStoryIds.includes(storyId)) {
        const updatedEpic = {
          ...epic,
          storyIds: [...epicStoryIds, storyId],
          updatedAt: generateTimestamp(),
        }
        await writeEpic(projectName, epicName, updatedEpic)
      }
    } catch (error) {
      // If epic doesn't exist or can't be read, log warning but don't fail
      console.warn(`Could not update epic's storyIds for new story ${storyId}:`, error)
    }
  }
}

export async function listStories(
  projectName: string,
  epicName: string
): Promise<string[]> {
  try {
    const storiesList = await kv.get(getStoriesListKey(projectName, epicName))
    return Array.isArray(storiesList) ? storiesList : []
  } catch (error) {
    console.warn('Error reading stories list from Redis, returning empty array:', error)
    return []
  }
}

export async function storyExists(
  projectName: string,
  epicName: string,
  storyId: string
): Promise<boolean> {
  const key = getStoryKey(projectName, epicName, storyId)
  const result = await kv.exists(key)
  // Upstash returns number (0 or 1), Vercel KV returns boolean
  return typeof result === 'number' ? result === 1 : Boolean(result)
}

export async function deleteStory(
  projectName: string,
  epicName: string,
  storyId: string
): Promise<void> {
  const key = getStoryKey(projectName, epicName, storyId)
  await kv.del(key)

  // Remove from stories list
  const storiesList = await kv.get(getStoriesListKey(projectName, epicName)) || []
  const updatedList = storiesList.filter((s: string) => s !== storyId)
  await kv.set(getStoriesListKey(projectName, epicName), updatedList)

  // Update the epic's storyIds array
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
    // If epic doesn't exist or can't be read, log warning but don't fail
    console.warn(`Could not update epic's storyIds when deleting story ${storyId}:`, error)
  }
}

// ============================================================================
// ID Generation
// ============================================================================

export async function generateNextEpicId(projectName: string): Promise<string> {
  const epics = await listEpics(projectName)
  const existingNumbers = epics
    .map((name: string) => {
      // Try to extract EPIC-XXXX from epic name or read the epic to get its ID
      const match = name.match(/^EPIC-(\d{4})$/)
      return match ? parseInt(match[1], 10) : null
    })
    .filter((n): n is number => n !== null)

  let nextNumber = 1
  if (existingNumbers.length > 0) {
    const maxNumber = Math.max(...existingNumbers)
    nextNumber = maxNumber + 1
  }

  if (nextNumber > 9999) {
    throw new Error('Maximum number of epics (9999) reached')
  }

  return `EPIC-${nextNumber.toString().padStart(4, '0')}`
}

export async function generateNextStoryId(
  projectName: string,
  epicName: string
): Promise<string> {
  const stories = await listStories(projectName, epicName)
  const existingNumbers = stories
    .map((id: string) => {
      const match = id.match(/^STORY-(\d{3})$/)
      return match ? parseInt(match[1], 10) : null
    })
    .filter((n): n is number => n !== null)

  let nextNumber = 1
  if (existingNumbers.length > 0) {
    const maxNumber = Math.max(...existingNumbers)
    nextNumber = maxNumber + 1
  }

  if (nextNumber > 999) {
    throw new Error('Maximum number of stories (999) reached')
  }

  return `STORY-${nextNumber.toString().padStart(3, '0')}`
}

// ============================================================================
// Story Creation
// ============================================================================

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

export const pmRepositoryKV = {
  // ID Generation
  generateNextEpicId,
  generateNextStoryId,
  // Projects
  readProject,
  writeProject,
  listProjects,
  projectExists,
  deleteProject,

  // People (per-project - deprecated, uses global)
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
