import { z } from 'zod'

// ============================================================================
// Enums and Constants
// ============================================================================

export const StoryStatusSchema = z.enum([
  'todo',
  'in_progress',
  'blocked',
  'done',
  'archived',
])

export const PrioritySchema = z.enum(['low', 'medium', 'high', 'critical'])

export const EpicStatusSchema = z.enum(['todo', 'in_progress', 'done', 'archived'])

export const FileRoleSchema = z.enum(['primary', 'supporting', 'test'])

export const ConfidenceSchema = z.enum(['low', 'medium', 'high']).optional()

// ============================================================================
// Story Types
// ============================================================================

export const StoryFileSchema = z.object({
  path: z.string().min(1, 'File path is required'),
  role: FileRoleSchema,
})

export const StoryEstimateSchema = z.object({
  storyPoints: z.number().int().min(0).default(0),
  confidence: ConfidenceSchema,
})

export const StoryMetadataSchema = z.object({
  createdBy: z.string().default('unassigned'),
  lastEditedBy: z.string().default('unassigned'),
  custom: z.record(z.unknown()).default({}),
})

export const StorySchema = z.object({
  id: z.string().regex(/^STORY-\d+$/, 'Story ID must match STORY-{number} format'),
  epicId: z.string().optional(), // Optional for hierarchical structure (epic name is in path)

  title: z.string().min(1, 'Title is required'),
  summary: z.string().min(1, 'Summary is required'),
  description: z.string().default(''),
  acceptanceCriteria: z.array(z.string()).default([]),

  status: StoryStatusSchema.default('todo'),
  priority: PrioritySchema.default('medium'),

  assignee: z.string().default('unassigned'),
  createdAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)),
  updatedAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)),
  dueDate: z.string().datetime().nullable().optional(),

  tags: z.array(z.string()).default([]),
  estimate: StoryEstimateSchema.default({ storyPoints: 0 }),

  relatedStories: z.array(z.string()).default([]),
  mentions: z.array(z.string()).default([]),

  files: z.array(StoryFileSchema).default([]),

  metadata: StoryMetadataSchema.default({
    createdBy: 'unassigned',
    lastEditedBy: 'unassigned',
    custom: {},
  }),
})

// ============================================================================
// Epic Types
// ============================================================================

export const EpicMetricsSchema = z.object({
  totalStoryPoints: z.number().int().min(0).default(0),
  completedStoryPoints: z.number().int().min(0).default(0),
})

export const EpicMetadataSchema = z.object({
  createdBy: z.string().default('unassigned'),
  custom: z.record(z.unknown()).default({}),
})

export const EpicSchema = z.object({
  id: z.string().optional(), // Optional for hierarchical structure (epic name is in folder)
  projectId: z.string().optional(), // Optional for hierarchical structure (project name is in path)

  title: z.string().min(1, 'Title is required'),
  summary: z.string().min(1, 'Summary is required'),
  description: z.string().default(''),

  status: EpicStatusSchema.default('todo'),
  priority: PrioritySchema.default('medium'),

  assignee: z.string().default('unassigned'),
  createdAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)),
  updatedAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)),
  targetRelease: z.string().nullable().optional(),

  storyIds: z.array(z.string()).default([]),

  metrics: EpicMetricsSchema.default({
    totalStoryPoints: 0,
    completedStoryPoints: 0,
  }),

  metadata: EpicMetadataSchema.default({
    createdBy: 'unassigned',
    custom: {},
  }),
})

// ============================================================================
// Project Types
// ============================================================================

export const ProjectMetadataSchema = z.object({
  owner: z.string().default('unassigned'),
  repoUrl: z.string().url().optional(),
  custom: z.record(z.unknown()).default({}),
})

export const ProjectSchema = z.object({
  id: z.string().optional(), // Optional for hierarchical structure (project name is folder name)
  name: z.string().min(1, 'Project name is required'),
  description: z.string().default(''),

  epicIds: z.array(z.string()).default([]),

  defaultStatuses: z.array(StoryStatusSchema).default([
    'todo',
    'in_progress',
    'blocked',
    'done',
  ]),
  defaultPriorities: z.array(PrioritySchema).default(['low', 'medium', 'high', 'critical']),

  metadata: ProjectMetadataSchema.default({
    owner: 'unassigned',
    custom: {},
  }),
})

// ============================================================================
// TypeScript Types (inferred from Zod schemas)
// ============================================================================

export type StoryStatus = z.infer<typeof StoryStatusSchema>
export type Priority = z.infer<typeof PrioritySchema>
export type EpicStatus = z.infer<typeof EpicStatusSchema>
export type FileRole = z.infer<typeof FileRoleSchema>
export type Confidence = z.infer<typeof ConfidenceSchema>

export type StoryFile = z.infer<typeof StoryFileSchema>
export type StoryEstimate = z.infer<typeof StoryEstimateSchema>
export type StoryMetadata = z.infer<typeof StoryMetadataSchema>
export type Story = z.infer<typeof StorySchema>

export type EpicMetrics = z.infer<typeof EpicMetricsSchema>
export type EpicMetadata = z.infer<typeof EpicMetadataSchema>
export type Epic = z.infer<typeof EpicSchema>

export type ProjectMetadata = z.infer<typeof ProjectMetadataSchema>
export type Project = z.infer<typeof ProjectSchema>

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a new story ID based on timestamp
 */
export function generateStoryId(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `STORY-${timestamp}-${random}`
}

/**
 * Generate ISO 8601 timestamp string
 */
export function generateTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Validate and parse a story from JSON
 */
export function parseStory(data: unknown): Story {
  return StorySchema.parse(data)
}

/**
 * Validate and parse an epic from JSON
 */
export function parseEpic(data: unknown): Epic {
  return EpicSchema.parse(data)
}

/**
 * Validate and parse a project from JSON
 */
export function parseProject(data: unknown): Project {
  return ProjectSchema.parse(data)
}

/**
 * Create a new story with defaults
 */
export function createStory(overrides: Partial<Story> = {}): Story {
  const now = generateTimestamp()
  return {
    id: generateStoryId(),
    title: '',
    summary: '',
    description: '',
    acceptanceCriteria: [],
    status: 'todo',
    priority: 'medium',
    assignee: 'unassigned',
    createdAt: now,
    updatedAt: now,
    tags: [],
    estimate: { storyPoints: 0 },
    relatedStories: [],
    mentions: [],
    files: [],
    metadata: {
      createdBy: 'unassigned',
      lastEditedBy: 'unassigned',
      custom: {},
    },
    ...overrides,
  }
}

/**
 * Create a new epic with defaults
 */
export function createEpic(overrides: Partial<Epic> = {}): Epic {
  const now = generateTimestamp()
  return {
    title: '',
    summary: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignee: 'unassigned',
    createdAt: now,
    updatedAt: now,
    storyIds: [],
    metrics: {
      totalStoryPoints: 0,
      completedStoryPoints: 0,
    },
    metadata: {
      createdBy: 'unassigned',
      custom: {},
    },
    ...overrides,
  }
}

/**
 * Create a new project with defaults
 */
export function createProject(overrides: Partial<Project> = {}): Project {
  return {
    name: '',
    description: '',
    epicIds: [],
    defaultStatuses: ['todo', 'in_progress', 'blocked', 'done'],
    defaultPriorities: ['low', 'medium', 'high', 'critical'],
    metadata: {
      owner: 'unassigned',
      custom: {},
    },
    ...overrides,
  }
}

