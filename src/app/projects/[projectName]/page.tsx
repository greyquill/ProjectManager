'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Plus,
  User,
  Target,
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  Save,
  X,
  Trash2,
  Tag,
  Eye,
  Edit,
  BarChart3,
  Maximize2,
  Minimize2,
  GripVertical,
  MoreVertical,
  Archive,
  RotateCcw,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Project, Epic, Story, StoryFile, Person } from '@/lib/types'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

type Selection = {
  type: 'epic' | 'story' | null
  epicName?: string
  storyId?: string
}

// Droppable Epic Component
interface DroppableEpicProps {
  epicName: string
  children: React.ReactNode
  isExpanded: boolean
}

function DroppableEpic({ epicName, children, isExpanded }: DroppableEpicProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: epicName,
    data: {
      type: 'epic',
      epicName,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={isOver ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50' : ''}
    >
      {children}
    </div>
  )
}

// Sortable Story Component
interface SortableStoryProps {
  story: Story
  epicName: string
  isSelected: boolean
  isFocused: boolean
  isKeyboardDragging?: boolean
  storyStatusColor: string
  isFullscreen: boolean
  people: Person[]
  editingStoryTitle: { epicName: string; storyId: string } | null
  tempStoryTitle: string
  setTempStoryTitle: (title: string) => void
  setEditingStoryTitle: (value: { epicName: string; storyId: string } | null) => void
  formatStoryTitle: (storyId: string, title: string) => string
  extractStoryTitle: (storyId: string, title: string) => string
  saveStoryTitle: (epicName: string, storyId: string, newTitle: string, currentTitle: string) => void
  selectStory: (epicName: string, story: Story) => void
  getStatusIcon: (status: string) => JSX.Element
  isStorySelectedFn: (epicName: string, storyId: string) => boolean
  toggleStorySelection: (epicName: string, storyId: string) => void
}

function SortableStory({
  story,
  epicName,
  isSelected,
  isFocused,
  isKeyboardDragging = false,
  storyStatusColor,
  isFullscreen,
  people,
  editingStoryTitle,
  tempStoryTitle,
  setTempStoryTitle,
  setEditingStoryTitle,
  formatStoryTitle,
  extractStoryTitle,
  saveStoryTitle,
  selectStory,
  getStatusIcon,
  isStorySelectedFn,
  toggleStorySelection,
}: SortableStoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: story.id,
    data: {
      type: 'story',
      epicName,
      story,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isEditing = editingStoryTitle?.epicName === epicName && editingStoryTitle?.storyId === story.id

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer hover:bg-surface-muted transition-all border-l-4 border-b border-border-light last:border-b-0 ${
        isSelected ? 'bg-primary/5' : ''
      } ${storyStatusColor} ${isFullscreen ? 'p-1.5 pl-6' : 'p-2 pl-8'} ${isFocused ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50' : ''} ${isDragging ? 'ring-2 ring-blue-500' : ''} ${isKeyboardDragging ? 'animate-lift-up cursor-grab' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        selectStory(epicName, story)
      }}
    >
      <div className="flex items-center justify-between">
        <div className={`flex items-center flex-1 min-w-0 ${isFullscreen ? 'gap-1.5' : 'gap-2'}`}>
          <input
            type="checkbox"
            checked={isStorySelectedFn(epicName, story.id)}
            onChange={(e) => {
              e.stopPropagation()
              toggleStorySelection(epicName, story.id)
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 w-4 h-4 rounded border-border-light cursor-pointer"
          />
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing text-text-secondary hover:text-text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className={`${isFullscreen ? 'h-3 w-3' : 'h-4 w-4'}`} />
          </div>
          {getStatusIcon(story.status)}
          <FileText className={`text-text-secondary flex-shrink-0 ${isFullscreen ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
          <div className="flex-1 min-w-0">
            {isFullscreen && isEditing ? (
              <input
                type="text"
                value={tempStoryTitle}
                onChange={(e) => setTempStoryTitle(e.target.value)}
                onBlur={() => {
                  saveStoryTitle(epicName, story.id, tempStoryTitle, formatStoryTitle(story.id, story.title))
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    saveStoryTitle(epicName, story.id, tempStoryTitle, formatStoryTitle(story.id, story.title))
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    setEditingStoryTitle(null)
                    setTempStoryTitle('')
                  }
                }}
                className="w-full font-medium text-text-primary text-[11px] bg-transparent border-b-2 border-blue-500 focus:outline-none px-1"
                autoFocus
              />
            ) : (
              <div
                className={`font-medium text-text-primary truncate text-xs ${isSelected ? 'underline' : ''} ${isFullscreen ? 'cursor-text hover:bg-blue-50 px-1 rounded' : ''}`}
                onClick={(e) => {
                  if (isFullscreen) {
                    e.stopPropagation()
                    setEditingStoryTitle({ epicName, storyId: story.id })
                    setTempStoryTitle(extractStoryTitle(story.id, story.title))
                  }
                }}
              >
                {formatStoryTitle(story.id, story.title)}
              </div>
            )}
            {!isFullscreen && story.manager && story.manager !== 'unassigned' && (
              <div className="flex items-center gap-1 mt-1">
                <User className="h-3 w-3 text-text-secondary" />
                <span className="text-xs text-text-secondary">
                  {people.find(p => p.id === story.manager)?.name || story.manager}
                </span>
              </div>
            )}
          </div>
          {isFullscreen && (
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              {story.manager && story.manager !== 'unassigned' && (
                <span>{people.find(p => p.id === story.manager)?.name || story.manager}</span>
              )}
              {story.estimate?.storyPoints > 0 && (
                <span>{story.estimate.storyPoints} pts</span>
              )}
            </div>
          )}
        </div>
        {!isFullscreen && (
          <div className="flex-shrink-0 ml-2">
            {story.estimate?.storyPoints > 0 && (
              <span className="text-xs text-text-secondary">
                {story.estimate.storyPoints} pts
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectName = params.projectName as string

  // Get epic and story from URL params
  const epicNameFromUrl = searchParams.get('epic')
  const storyIdFromUrl = searchParams.get('story')

  const [project, setProject] = useState<Project | null>(null)
  const [epics, setEpics] = useState<(Epic & { _name: string; stories: Story[] })[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null)
  const [editingEpicTitle, setEditingEpicTitle] = useState<string | null>(null)
  const [editingStoryTitle, setEditingStoryTitle] = useState<{ epicName: string; storyId: string } | null>(null)
  const [tempEpicTitle, setTempEpicTitle] = useState('')
  const [tempStoryTitle, setTempStoryTitle] = useState('')
  const [lastFocusedEpicName, setLastFocusedEpicName] = useState<string | null>(null)
  const [shouldMaintainEpicFocus, setShouldMaintainEpicFocus] = useState(false)
  const [previousSelection, setPreviousSelection] = useState<string | null>(null)

  // Epic edit state
  const [epicTitle, setEpicTitle] = useState('')
  const [epicSummary, setEpicSummary] = useState('')
  const [epicDescription, setEpicDescription] = useState('')
  const [epicStatus, setEpicStatus] = useState<'todo' | 'in_progress' | 'blocked' | 'done'>('todo')
  const [epicPriority, setEpicPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [epicManager, setEpicManager] = useState('')
  const [epicTargetRelease, setEpicTargetRelease] = useState('')

  // Story edit state
  const [storyTitle, setStoryTitle] = useState('')
  const [storySummary, setStorySummary] = useState('')
  const [storyDescription, setStoryDescription] = useState('')
  const [storyStatus, setStoryStatus] = useState<'todo' | 'in_progress' | 'blocked' | 'done'>('todo')
  const [storyPriority, setStoryPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [storyManager, setStoryManager] = useState('')
  const [storyDueDate, setStoryDueDate] = useState('')
  const [storyPlannedStartDate, setStoryPlannedStartDate] = useState('')
  const [storyPlannedDueDate, setStoryPlannedDueDate] = useState('')
  const [storyActualStartDate, setStoryActualStartDate] = useState('')
  const [storyActualDueDate, setStoryActualDueDate] = useState('')
  const [storyTags, setStoryTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [storyPoints, setStoryPoints] = useState(0)
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>([])
  const [newCriterion, setNewCriterion] = useState('')
  const [files, setFiles] = useState<StoryFile[]>([])

  // Project metadata edit state
  const [projectManager, setProjectManager] = useState('')
  const [projectContributors, setProjectContributors] = useState<string[]>([])
  const [hasProjectChanges, setHasProjectChanges] = useState(false)
  const [savingProject, setSavingProject] = useState(false)

  // Preview state

  // New epic form state
  const [showNewEpicForm, setShowNewEpicForm] = useState(false)
  const [newEpicTitle, setNewEpicTitle] = useState('')
  const [newEpicSummary, setNewEpicSummary] = useState('')
  const [newEpicDescription, setNewEpicDescription] = useState('')
  const [newEpicStatus, setNewEpicStatus] = useState<'todo' | 'in_progress' | 'blocked' | 'done'>('todo')
  const [newEpicPriority, setNewEpicPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [newEpicManager, setNewEpicManager] = useState('unassigned')
  const [creatingEpic, setCreatingEpic] = useState(false)

  // New story form state
  const [showNewStoryForm, setShowNewStoryForm] = useState<string | null>(null) // epic name or null
  const [newStoryTitle, setNewStoryTitle] = useState('')
  const [newStorySummary, setNewStorySummary] = useState('')
  const [newStoryStatus, setNewStoryStatus] = useState<'todo' | 'in_progress' | 'blocked' | 'done'>('todo')
  const [newStoryPriority, setNewStoryPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [newStoryManager, setNewStoryManager] = useState('unassigned')
  const [creatingStory, setCreatingStory] = useState(false)

  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedStory, setDraggedStory] = useState<{ story: Story; epicName: string } | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Quick epic creation in focus mode
  const [quickEpicTitle, setQuickEpicTitle] = useState('')

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteType, setDeleteType] = useState<'story' | 'epic' | null>(null)
  const [deleteLoginCode, setDeleteLoginCode] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationMessage, setValidationMessage] = useState<string>('')

  // Keyboard drag-and-drop state
  const [isShiftHeld, setIsShiftHeld] = useState(false)
  const [keyboardDraggingId, setKeyboardDraggingId] = useState<string | null>(null)

  // Multi-select state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set()) // Format: "epic:epicName" or "story:epicName:storyId"
  const [archiving, setArchiving] = useState(false)
  const [showActionsDropdown, setShowActionsDropdown] = useState(false)

  // Helper functions for story title formatting
  const extractStoryTitle = useCallback((storyId: string, title: string): string => {
    // Remove the prefix if it exists for editing
    const prefix = `[${storyId}]`
    if (title.startsWith(prefix)) {
      return title.substring(prefix.length).trim()
    }
    return title
  }, [])

  const formatStoryTitle = useCallback((storyId: string, title: string): string => {
    // Add prefix if it doesn't exist
    const prefix = `[${storyId}]`
    if (!title.startsWith(prefix)) {
      return `${prefix} ${title}`
    }
    return title
  }, [])

  // Derive selection from URL params
  const selection: Selection = useMemo(() => epicNameFromUrl && storyIdFromUrl
    ? { type: 'story', epicName: epicNameFromUrl, storyId: storyIdFromUrl }
    : epicNameFromUrl
    ? { type: 'epic', epicName: epicNameFromUrl }
    : { type: null }, [epicNameFromUrl, storyIdFromUrl])

  // Update form state when URL params change
  useEffect(() => {
    if (selection.type === 'epic' && selection.epicName && epics.length > 0) {
      const epic = epics.find((e) => e._name === selection.epicName)
      if (epic) {
        // Expand the epic
        setExpandedEpics((prev) => new Set([...prev, selection.epicName!]))

        setEpicTitle(epic.title)
        setEpicSummary(epic.summary)
        setEpicDescription(epic.description || '')
        setEpicStatus(epic.status)
        setEpicPriority(epic.priority)
        setEpicManager(epic.manager || '')
        setEpicTargetRelease(epic.targetRelease || '')
        setHasChanges(false)
      }
    } else if (selection.type === 'story' && selection.epicName && selection.storyId && epics.length > 0) {
      const epic = epics.find((e) => e._name === selection.epicName)
      const story = epic?.stories.find((s) => s.id === selection.storyId)
      if (story) {
        // Expand the parent epic so the story is visible in the accordion
        setExpandedEpics((prev) => new Set([...prev, selection.epicName!]))

        // Extract title without prefix for editing in the detail panel
        setStoryTitle(extractStoryTitle(story.id, story.title))
        setStorySummary(story.summary)
        setStoryDescription(story.description || '')
        setStoryStatus(story.status)
        setStoryPriority(story.priority)
        setStoryManager(story.manager || '')
        setStoryDueDate(story.dueDate || '')
        setStoryPlannedStartDate(story.plannedStartDate || '')
        setStoryPlannedDueDate(story.plannedDueDate || '')
        setStoryActualStartDate(story.actualStartDate || '')
        setStoryActualDueDate(story.actualDueDate || '')
        setStoryTags(story.tags || [])
        setStoryPoints(story.estimate?.storyPoints || 0)
        setAcceptanceCriteria(
          story.acceptanceCriteria && story.acceptanceCriteria.length > 0
            ? story.acceptanceCriteria
            : []
        )
        setFiles(story.files || [])
        setHasChanges(false)
      }
    }
  }, [epicNameFromUrl, storyIdFromUrl, epics, selection.type, selection.epicName, selection.storyId, extractStoryTitle])

  const fetchPeople = useCallback(async () => {
    try {
      // Use the working /api/people endpoint instead of project-specific one
      // Both should return the same data (global people list)
      const response = await fetch(`/api/people`)
      const result = await response.json()

      if (result.success) {
        setPeople(result.data || [])
      } else {
        console.error('[Project Page] Failed to load people:', result.error)
        setPeople([])
      }
    } catch (err) {
      console.error('[Project Page] Failed to load people:', err)
      setPeople([])
    }
  }, []) // Remove projectName dependency since we're using global endpoint

  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectName}`)
      const result = await response.json()

      if (result.success) {
        const proj = result.data
        setProject(proj)
        setProjectManager(proj.metadata?.manager || 'unassigned')
        setProjectContributors(proj.metadata?.contributors || [])
      } else {
        setError(result.error || 'Failed to load project')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    }
  }, [projectName])

  const fetchEpics = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectName}/epics`)
      const result = await response.json()

      if (result.success) {
        const epicsWithStories = await Promise.all(
          result.data.map(async (epic: Epic & { _name: string }) => {
            const storiesResponse = await fetch(
              `/api/projects/${projectName}/epics/${epic._name}/stories`
            )
            const storiesResult = await storiesResponse.json()
            return {
              ...epic,
              stories: storiesResult.success ? storiesResult.data : [],
            }
          })
        )
        setEpics(epicsWithStories)
      }
    } catch (err) {
      console.error('Failed to load epics:', err)
    } finally {
      setLoading(false)
    }
  }, [projectName])

  // Load data when projectName changes
  useEffect(() => {
    if (projectName) {
      fetchProject()
      fetchEpics()
      fetchPeople()
    }
  }, [projectName, fetchProject, fetchEpics, fetchPeople])

  function clearSelection() {
    router.push(`/projects/${projectName}`)
    setHasChanges(false)
  }

  const navigateToEpic = useCallback((epicName: string) => {
    router.push(`/projects/${projectName}?epic=${encodeURIComponent(epicName)}`)
  }, [router, projectName])

  const navigateToStory = useCallback((epicName: string, storyId: string) => {
    router.push(`/projects/${projectName}?epic=${encodeURIComponent(epicName)}&story=${encodeURIComponent(storyId)}`)
  }, [router, projectName])

  function toggleEpic(epicName: string) {
    const newExpanded = new Set(expandedEpics)
    if (newExpanded.has(epicName)) {
      newExpanded.delete(epicName)
    } else {
      newExpanded.add(epicName)
    }
    setExpandedEpics(newExpanded)
  }

  function selectEpic(epic: Epic & { _name: string; stories: Story[] }) {
    navigateToEpic(epic._name)
  }

  function selectStory(epicName: string, story: Story) {
    navigateToStory(epicName, story.id)
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)

    // Find the story being dragged
    const storyId = active.id as string
    for (const epic of epics) {
      const story = epic.stories.find(s => s.id === storyId)
      if (story) {
        setDraggedStory({ story, epicName: epic._name })
        break
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setDraggedStory(null)

    if (!over || !draggedStory) return

    const storyId = active.id as string
    const sourceEpicName = draggedStory.epicName

    // Find which epic the drop target belongs to
    let targetEpicName: string | null = null
    let targetPosition: number = 0

    // Check if dropped on a story (over.id is a story ID)
    const targetStory = epics
      .flatMap(e => e.stories.map(s => ({ story: s, epicName: e._name })))
      .find(item => item.story.id === over.id)

    if (targetStory) {
      // Dropped on a story - find its epic and position
      targetEpicName = targetStory.epicName
      const targetEpic = epics.find(e => e._name === targetEpicName)
      if (targetEpic) {
        targetPosition = targetEpic.stories.findIndex(s => s.id === over.id)
      }
    } else {
      // Dropped on an epic (epic name as ID) - add to end
      targetEpicName = over.id as string
      const targetEpic = epics.find(e => e._name === targetEpicName)
      if (targetEpic) {
        targetPosition = targetEpic.stories.length
      }
    }

    if (!targetEpicName) return

    // Check if moving within same epic or to different epic
    if (targetEpicName === sourceEpicName) {
      // Reordering within same epic
      const epic = epics.find(e => e._name === sourceEpicName)
      if (!epic) return

      const oldIndex = epic.stories.findIndex(s => s.id === storyId)
      if (oldIndex === targetPosition) return // No change

      // Optimistically update UI
      const newStories = arrayMove(epic.stories, oldIndex, targetPosition)
      const newStoryIds = newStories.map(s => s.id)

      setEpics(prev => prev.map(e =>
        e._name === sourceEpicName
          ? { ...e, stories: newStories }
          : e
      ))

      // Save to backend
      try {
        const response = await fetch(
          `/api/projects/${projectName}/epics/${sourceEpicName}/reorder-stories`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storyIds: newStoryIds }),
          }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Reorder stories error:', errorData)
          // Revert on error
          await fetchEpics()
          setError(errorData.error || 'Failed to reorder stories')
        } else {
          await fetchEpics()
        }
      } catch (err) {
        console.error('Reorder stories exception:', err)
        await fetchEpics()
        setError(err instanceof Error ? err.message : 'Failed to reorder stories')
      }
    } else {
      // Moving between epics
      const sourceEpic = epics.find(e => e._name === sourceEpicName)
      const targetEpic = epics.find(e => e._name === targetEpicName)

      if (!sourceEpic || !targetEpic) return

      const story = sourceEpic.stories.find(s => s.id === storyId)
      if (!story) return

      // Optimistically update UI
      const newSourceStories = sourceEpic.stories.filter(s => s.id !== storyId)
      const newTargetStories = [...targetEpic.stories]
      newTargetStories.splice(targetPosition, 0, story)

      setEpics(prev => prev.map(e => {
        if (e._name === sourceEpicName) {
          return { ...e, stories: newSourceStories }
        } else if (e._name === targetEpicName) {
          return { ...e, stories: newTargetStories }
        }
        return e
      }))

      // Save to backend
      try {
        const response = await fetch(
          `/api/projects/${projectName}/epics/${sourceEpicName}/move-story`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storyId,
              targetEpicName,
              targetPosition,
            }),
          }
        )

        if (!response.ok) {
          // Revert on error
          await fetchEpics()
          setError('Failed to move story')
        } else {
          await fetchEpics()
          // Update selection if story was selected
          if (selection.type === 'story' && selection.storyId === storyId) {
            navigateToStory(targetEpicName, storyId)
          }
        }
      } catch (err) {
        await fetchEpics()
        setError('Failed to move story')
      }
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Visual feedback handled by CSS
  }

  // Build flat list of focusable items (epics, stories, and new story buttons) for keyboard navigation
  type FocusableItem =
    | { type: 'epic'; epicName: string; index: number }
    | { type: 'story'; epicName: string; storyId: string; index: number }
    | { type: 'newStory'; epicName: string; index: number }
    | { type: 'newEpic'; index: number }

  const buildFocusableItems = useMemo((): FocusableItem[] => {
    const items: FocusableItem[] = []
    let globalIndex = 0

    epics.forEach((epic) => {
      // Add epic
      items.push({ type: 'epic', epicName: epic._name, index: globalIndex++ })

      // Add stories if epic is expanded
      if (expandedEpics.has(epic._name)) {
        epic.stories.forEach((story) => {
          items.push({ type: 'story', epicName: epic._name, storyId: story.id, index: globalIndex++ })
        })
        // Add "New Story" button after stories if epic is expanded
        items.push({ type: 'newStory', epicName: epic._name, index: globalIndex++ })
      }
    })

    // Add "New Epic" button at the end in focus mode
    if (isFullscreen) {
      items.push({ type: 'newEpic', index: globalIndex++ })
    }

    return items
  }, [epics, expandedEpics, isFullscreen])

  const selectEpicCallback = useCallback((epic: Epic & { _name: string; stories: Story[] }) => {
    navigateToEpic(epic._name)
  }, [navigateToEpic])

  const selectStoryCallback = useCallback((epicName: string, story: Story) => {
    navigateToStory(epicName, story.id)
  }, [navigateToStory])

  // Save epic title function
  const saveEpicTitle = useCallback(async (epicName: string, newTitle: string, currentTitle: string) => {
    if (newTitle.trim() && newTitle.trim() !== currentTitle) {
      const epic = epics.find((e) => e._name === epicName)
      if (epic) {
        const updatedEpic = { ...epic, title: newTitle.trim() }
        try {
          const response = await fetch(`/api/projects/${projectName}/epics/${epicName}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedEpic),
          })
          if (response.ok) {
            // Refresh epics list
            const epicsResponse = await fetch(`/api/projects/${projectName}/epics`)
            const epicsResult = await epicsResponse.json()
            if (epicsResult.success) {
              const epicsWithStories = await Promise.all(
                epicsResult.data.map(async (epic: Epic & { _name: string }) => {
                  const storiesResponse = await fetch(
                    `/api/projects/${projectName}/epics/${epic._name}/stories`
                  )
                  const storiesResult = await storiesResponse.json()
                  return {
                    ...epic,
                    stories: storiesResult.success ? storiesResult.data : [],
                  }
                })
              )
              setEpics(epicsWithStories)
            }
          }
        } catch (err) {
          console.error('Failed to update epic title:', err)
        }
      }
    }
    setEditingEpicTitle(null)
    setTempEpicTitle('')
  }, [epics, projectName])

  // Save story title function

  const saveStoryTitle = useCallback(async (epicName: string, storyId: string, newTitle: string, currentTitle: string) => {
    // Ensure the title has the prefix
    const formattedTitle = formatStoryTitle(storyId, newTitle.trim())
    if (formattedTitle && formattedTitle !== currentTitle) {
      const story = epics
        .find((e) => e._name === epicName)
        ?.stories.find((s) => s.id === storyId)
      if (story) {
        const updatedStory = { ...story, title: formattedTitle }
        try {
          const response = await fetch(`/api/projects/${projectName}/epics/${epicName}/stories/${storyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedStory),
          })
          if (response.ok) {
            // Refresh epics list
            const epicsResponse = await fetch(`/api/projects/${projectName}/epics`)
            const epicsResult = await epicsResponse.json()
            if (epicsResult.success) {
              const epicsWithStories = await Promise.all(
                epicsResult.data.map(async (epic: Epic & { _name: string }) => {
                  const storiesResponse = await fetch(
                    `/api/projects/${projectName}/epics/${epic._name}/stories`
                  )
                  const storiesResult = await storiesResponse.json()
                  return {
                    ...epic,
                    stories: storiesResult.success ? storiesResult.data : [],
                  }
                })
              )
              setEpics(epicsWithStories)
            }
          }
        } catch (err) {
          console.error('Failed to update story title:', err)
        }
      }
    }
    setEditingStoryTitle(null)
    setTempStoryTitle('')
  }, [epics, projectName, formatStoryTitle])

  // Handle keyboard navigation in focus mode
  useEffect(() => {
    if (!isFullscreen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Enter key - enter edit mode or save if already editing
      if (e.key === 'Enter') {
        const activeElement = document.activeElement

        // If focus is on a select dropdown, open it
        if (activeElement && activeElement.tagName === 'SELECT') {
          e.preventDefault()
          const select = activeElement as HTMLSelectElement
          // Try to open dropdown by setting size temporarily (works in most browsers)
          const originalSize = select.size
          select.size = select.options.length > 10 ? 10 : select.options.length
          select.focus()
          // Reset size after a brief moment to show dropdown
          setTimeout(() => {
            select.size = originalSize
            // Also try clicking as fallback
            select.click()
          }, 10)
          return
        }

        // If focus is on a button (Save, Create Story, etc.), trigger click
        if (activeElement && (activeElement.tagName === 'BUTTON' || activeElement.closest('button'))) {
          const button = activeElement.tagName === 'BUTTON' ? activeElement : activeElement.closest('button')
          if (button) {
            const buttonText = button.textContent || ''
            const hasSaveAttribute = button.getAttribute('data-save-button') === 'true'
            const hasCreateAttribute = button.getAttribute('data-create-button') === 'true'
            const isSaveButton = hasSaveAttribute || buttonText.includes('Save')
            const isCreateButton = hasCreateAttribute || buttonText.includes('Create Story') || buttonText.includes('Create Epic')

            if (isSaveButton || isCreateButton) {
              e.preventDefault()
              // Check if button is not disabled
              if (!button.hasAttribute('disabled') && !button.classList.contains('opacity-50')) {
                (button as HTMLButtonElement).click()
              }
              return
            }
          }
        }

        // If we're in edit mode, save and exit
        if (editingEpicTitle) {
          const epic = epics.find((e) => e._name === editingEpicTitle)
          if (epic) {
            saveEpicTitle(editingEpicTitle, tempEpicTitle, epic.title)
          }
          e.preventDefault()
          return
        }
        if (editingStoryTitle) {
          const story = epics
            .find((e) => e._name === editingStoryTitle.epicName)
            ?.stories.find((s) => s.id === editingStoryTitle.storyId)
          if (story) {
            saveStoryTitle(editingStoryTitle.epicName, editingStoryTitle.storyId, tempStoryTitle, formatStoryTitle(editingStoryTitle.storyId, story.title))
          }
          e.preventDefault()
          return
        }

        // If not in edit mode, handle focused item
        if (focusedItemIndex !== null && buildFocusableItems.length > 0) {
          const focusedItem = buildFocusableItems[focusedItemIndex]
          e.preventDefault()

          if (focusedItem.type === 'epic') {
            const epic = epics.find((e) => e._name === focusedItem.epicName)
            if (epic) {
              setEditingEpicTitle(focusedItem.epicName)
              setTempEpicTitle(epic.title)
            }
          } else if (focusedItem.type === 'story') {
            setEditingStoryTitle({ epicName: focusedItem.epicName, storyId: focusedItem.storyId })
            const story = epics
              .find((e) => e._name === focusedItem.epicName)
              ?.stories.find((s) => s.id === focusedItem.storyId)
            if (story) {
              setTempStoryTitle(extractStoryTitle(story.id, story.title))
            }
          } else if (focusedItem.type === 'newStory') {
            // Open new story form for this epic
            setShowNewStoryForm(focusedItem.epicName)
            // Set default manager to project manager in focus mode
            if (isFullscreen && project?.metadata?.manager && project.metadata.manager !== 'unassigned') {
              setNewStoryManager(project.metadata.manager)
            }
            // Ensure epic is expanded
            if (!expandedEpics.has(focusedItem.epicName)) {
              setExpandedEpics((prev) => new Set([...prev, focusedItem.epicName]))
            }
          } else if (focusedItem.type === 'newEpic') {
            // Focus on the quick epic creation input
            const input = document.querySelector('input[placeholder="+ Add Epic"]') as HTMLInputElement
            if (input) {
              input.focus()
            }
          }
          return
        }
      }

      // Handle Escape key - cancel edit mode or close forms
      if (e.key === 'Escape') {
        // Close new story form
        if (showNewStoryForm) {
          setShowNewStoryForm(null)
          setNewStoryTitle('')
          setNewStorySummary('')
          setNewStoryPriority('medium')
          setNewStoryManager('unassigned')
          e.preventDefault()
          return
        }
        // Close new epic form
        if (showNewEpicForm) {
          setShowNewEpicForm(false)
          setNewEpicTitle('')
          setNewEpicSummary('')
          setNewEpicDescription('')
          setNewEpicPriority('medium')
          setNewEpicManager('unassigned')
          e.preventDefault()
          return
        }
        // Cancel title editing
        if (editingEpicTitle) {
          setEditingEpicTitle(null)
          setTempEpicTitle('')
          e.preventDefault()
          return
        }
        if (editingStoryTitle) {
          setEditingStoryTitle(null)
          setTempStoryTitle('')
          e.preventDefault()
          return
        }
      }

      // Handle Right/Left arrow and Space for epic expand/collapse
      if (focusedItemIndex !== null && buildFocusableItems.length > 0 && !editingEpicTitle && !editingStoryTitle) {
        const focusedItem = buildFocusableItems[focusedItemIndex]

        // Only handle these keys when focused on an epic
        if (focusedItem.type === 'epic') {
          if (e.key === 'ArrowRight') {
            // Expand epic
            e.preventDefault()
            if (!expandedEpics.has(focusedItem.epicName)) {
              setExpandedEpics((prev) => new Set([...prev, focusedItem.epicName]))
              setLastFocusedEpicName(focusedItem.epicName)
              setShouldMaintainEpicFocus(true) // Flag to maintain focus on epic after expansion
            }
            return
          }

          if (e.key === 'ArrowLeft') {
            // Collapse epic
            e.preventDefault()
            if (expandedEpics.has(focusedItem.epicName)) {
              setExpandedEpics((prev) => {
                const newSet = new Set(prev)
                newSet.delete(focusedItem.epicName)
                return newSet
              })
              setLastFocusedEpicName(focusedItem.epicName)
              setShouldMaintainEpicFocus(true) // Flag to maintain focus on epic after collapse
            }
            return
          }

          if (e.key === ' ') {
            // Space bar - toggle expand/collapse
            e.preventDefault()
            const newExpanded = new Set(expandedEpics)
            if (newExpanded.has(focusedItem.epicName)) {
              newExpanded.delete(focusedItem.epicName)
            } else {
              newExpanded.add(focusedItem.epicName)
            }
            setExpandedEpics(newExpanded)
            setLastFocusedEpicName(focusedItem.epicName)
            setShouldMaintainEpicFocus(true) // Flag to maintain focus on epic after toggle
            return
          }
        }
      }

      // Handle Shift + Arrow keys for keyboard drag-and-drop in focus mode
      if (isFullscreen && isShiftHeld && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        if (focusedItemIndex !== null && buildFocusableItems.length > 0) {
          const focusedItem = buildFocusableItems[focusedItemIndex]

          // Only allow moving stories and epics
          if (focusedItem.type === 'story') {
            e.preventDefault()

            // Move story up or down
            const epic = epics.find(e => e._name === focusedItem.epicName)
            if (!epic) return

            const currentIndex = epic.stories.findIndex(s => s.id === focusedItem.storyId)
            if (currentIndex === -1) return

            const targetIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1

            // Check bounds
            if (targetIndex < 0 || targetIndex >= epic.stories.length) return

            // Optimistically update UI
            const newStories = [...epic.stories]
            const [movedStory] = newStories.splice(currentIndex, 1)
            newStories.splice(targetIndex, 0, movedStory)
            const newStoryIds = newStories.map(s => s.id)

            setEpics(prev => prev.map(e =>
              e._name === focusedItem.epicName
                ? { ...e, stories: newStories }
                : e
            ))

            // Recalculate focus index after reorder
            const epicIndex = epics.findIndex(e => e._name === focusedItem.epicName)
            let newIndex = 0
            for (let i = 0; i < epicIndex; i++) {
              const e = epics[i]
              newIndex++ // Epic itself
              if (expandedEpics.has(e._name)) {
                newIndex += e.stories.length + 1 // Stories + newStory button
              }
            }
            newIndex++ // Current epic
            if (expandedEpics.has(focusedItem.epicName)) {
              newIndex += targetIndex + 1 // Stories before the moved one (targetIndex + 1 because we're counting from 0)
            }
            setFocusedItemIndex(newIndex)

            // Save to backend
            fetch(`/api/projects/${projectName}/epics/${focusedItem.epicName}/reorder-stories`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ storyIds: newStoryIds }),
            }).catch(err => {
              console.error('Failed to reorder stories:', err)
              // Revert on error
              fetchEpics()
            })

            return
          } else if (focusedItem.type === 'epic') {
            e.preventDefault()

            // Move epic up or down
            const currentIndex = epics.findIndex(e => e._name === focusedItem.epicName)
            if (currentIndex === -1) return

            const targetIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1

            // Check bounds
            if (targetIndex < 0 || targetIndex >= epics.length) return

            // Optimistically update UI
            const newEpics = [...epics]
            const [movedEpic] = newEpics.splice(currentIndex, 1)
            newEpics.splice(targetIndex, 0, movedEpic)

            setEpics(newEpics)

            // Recalculate focus index based on new epic order
            let newIndex = 0
            for (let i = 0; i < targetIndex; i++) {
              const e = newEpics[i]
              newIndex++ // Epic itself
              if (expandedEpics.has(e._name)) {
                newIndex += e.stories.length + 1 // Stories + newStory button
              }
            }
            setFocusedItemIndex(newIndex)

            // Note: Epic reordering would need a project-level API endpoint
            // For now, we'll just update the UI
            console.warn('Epic reordering via keyboard is not yet fully implemented - UI only')

            return
          }
        }
      }

      // Handle arrow keys for navigation (Up/Down only)
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return

      // Don't navigate if we're in edit mode or if a form is open
      if (editingEpicTitle || editingStoryTitle || showNewStoryForm || showNewEpicForm) return

      // Don't navigate if Shift is held (we're in drag mode)
      if (isShiftHeld) return

      e.preventDefault()
      if (buildFocusableItems.length === 0) return

      let currentIndex = focusedItemIndex

      // If no item is focused, start with first item
      if (currentIndex === null) {
        currentIndex = 0
      } else {
        // Navigate up or down
        if (e.key === 'ArrowDown') {
          // Check if we're on the last item - if so, wrap to first
          if (currentIndex >= buildFocusableItems.length - 1) {
            currentIndex = 0
          } else {
            currentIndex = currentIndex + 1
          }
        } else {
          // Arrow Up
          if (currentIndex === 0) {
            currentIndex = buildFocusableItems.length - 1
          } else {
            currentIndex = currentIndex - 1
          }
        }
      }

      const focusedItem = buildFocusableItems[currentIndex]
      if (!focusedItem) return // Safety check

      setFocusedItemIndex(currentIndex)

      // Track last focused epic for focus maintenance
      if (focusedItem.type === 'epic') {
        setLastFocusedEpicName(focusedItem.epicName)
      } else if (focusedItem.type === 'story') {
        // When focusing on a story, track its parent epic
        setLastFocusedEpicName(focusedItem.epicName)
      } else if (focusedItem.type === 'newStory') {
        // When focusing on new story button, track its parent epic
        setLastFocusedEpicName(focusedItem.epicName)
      }

      // Expand epic if needed (this will trigger a rebuild of buildFocusableItems)
      if (focusedItem.type === 'epic' && !expandedEpics.has(focusedItem.epicName)) {
        setExpandedEpics((prev) => new Set([...prev, focusedItem.epicName]))
        // After expanding, we need to wait for buildFocusableItems to update
        // The useEffect for maintaining focus will handle this
        return
      }

      // Navigate to the focused item (only for epic and story, not newStory)
      if (focusedItem.type === 'epic') {
        const epic = epics.find((e) => e._name === focusedItem.epicName)
        if (epic) {
          selectEpicCallback(epic)
        }
      } else if (focusedItem.type === 'story') {
        const story = epics
          .find((e) => e._name === focusedItem.epicName)
          ?.stories.find((s) => s.id === focusedItem.storyId)
        if (story) {
          selectStoryCallback(focusedItem.epicName, story)
        }
      }
      // newStory items don't need navigation - they're just buttons
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, focusedItemIndex, buildFocusableItems, epics, expandedEpics, selectEpicCallback, selectStoryCallback, editingEpicTitle, editingStoryTitle, tempEpicTitle, tempStoryTitle, saveEpicTitle, saveStoryTitle, showNewStoryForm, showNewEpicForm, lastFocusedEpicName, extractStoryTitle, formatStoryTitle, project?.metadata?.manager, selection.epicName, selection.storyId, selection.type, isShiftHeld, projectName, fetchEpics])

  // Track Shift key state for keyboard drag-and-drop
  useEffect(() => {
    if (!isFullscreen) {
      setIsShiftHeld(false)
      setKeyboardDraggingId(null)
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && !e.repeat) {
        setIsShiftHeld(true)
        // Set dragging ID if we have a focused item
        if (focusedItemIndex !== null && buildFocusableItems.length > 0) {
          const focusedItem = buildFocusableItems[focusedItemIndex]
          if (focusedItem.type === 'story') {
            setKeyboardDraggingId(focusedItem.storyId)
          } else if (focusedItem.type === 'epic') {
            setKeyboardDraggingId(focusedItem.epicName)
          }
        }
        // Change cursor to grab
        document.body.style.cursor = 'grab'
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftHeld(false)
        setKeyboardDraggingId(null)
        // Reset cursor
        document.body.style.cursor = ''
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      document.body.style.cursor = ''
    }
  }, [isFullscreen, focusedItemIndex, buildFocusableItems])

  // Separate ESC handler that works in both fullscreen and normal mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close new story form
        if (showNewStoryForm) {
          setShowNewStoryForm(null)
          setNewStoryTitle('')
          setNewStorySummary('')
          setNewStoryPriority('medium')
          setNewStoryManager('unassigned')
          e.preventDefault()
          return
        }
        // Close new epic form
        if (showNewEpicForm) {
          setShowNewEpicForm(false)
          setNewEpicTitle('')
          setNewEpicSummary('')
          setNewEpicDescription('')
          setNewEpicPriority('medium')
          setNewEpicManager('unassigned')
          e.preventDefault()
          return
        }
        // Cancel title editing (works in both modes)
        if (editingEpicTitle) {
          setEditingEpicTitle(null)
          setTempEpicTitle('')
          e.preventDefault()
          return
        }
        if (editingStoryTitle) {
          setEditingStoryTitle(null)
          setTempStoryTitle('')
          e.preventDefault()
          return
        }
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showNewStoryForm, showNewEpicForm, editingEpicTitle, editingStoryTitle])

  // Maintain focus on epic when expanding/collapsing (but not during normal navigation)
  useEffect(() => {
    if (isFullscreen && lastFocusedEpicName && buildFocusableItems.length > 0 && shouldMaintainEpicFocus) {
      const newIndex = buildFocusableItems.findIndex(
        (item) => item.type === 'epic' && item.epicName === lastFocusedEpicName
      )
      if (newIndex >= 0) {
        setFocusedItemIndex(newIndex)
        setShouldMaintainEpicFocus(false) // Reset flag after maintaining focus
      }
    }
  }, [expandedEpics, buildFocusableItems, isFullscreen, lastFocusedEpicName, shouldMaintainEpicFocus])

  // Reset focus when exiting fullscreen only
  useEffect(() => {
    if (!isFullscreen) {
      setFocusedItemIndex(null)
      setLastFocusedEpicName(null)
    } else if (focusedItemIndex === null && buildFocusableItems.length > 0) {
      // Set initial focus only when entering fullscreen mode (focusedItemIndex is null)
      const currentIndex = buildFocusableItems.findIndex((item) => {
        if (selection.type === 'epic' && item.type === 'epic' && item.epicName === selection.epicName) {
          return true
        }
        if (selection.type === 'story' && item.type === 'story' && item.epicName === selection.epicName && item.storyId === selection.storyId) {
          return true
        }
        return false
      })
      if (currentIndex >= 0) {
        setFocusedItemIndex(currentIndex)
        const focusedItem = buildFocusableItems[currentIndex]
        if (focusedItem.type === 'epic') {
          setLastFocusedEpicName(focusedItem.epicName)
        }
      } else {
        setFocusedItemIndex(0) // Default to first item
      }
    }
  }, [isFullscreen, buildFocusableItems, focusedItemIndex, selection.epicName, selection.storyId, selection.type])

  // Close forms when navigating away (selection changes to a different epic/story)
  const [previousSelectionKey, setPreviousSelectionKey] = useState<string | null>(null)

  useEffect(() => {
    const currentSelectionKey = selection.type === 'epic'
      ? `epic-${selection.epicName}`
      : selection.type === 'story'
      ? `story-${selection.epicName}-${selection.storyId}`
      : 'none'

    // Only close forms if selection actually changed (not on initial mount or same selection)
    if (previousSelectionKey !== null && previousSelectionKey !== currentSelectionKey) {
      // Close new story form if it's open
      if (showNewStoryForm) {
        setShowNewStoryForm(null)
        setNewStoryTitle('')
        setNewStorySummary('')
        setNewStoryPriority('medium')
        setNewStoryManager('unassigned')
      }
      // Close new epic form if it's open
      if (showNewEpicForm) {
        setShowNewEpicForm(false)
        setNewEpicTitle('')
        setNewEpicSummary('')
        setNewEpicDescription('')
        setNewEpicPriority('medium')
        setNewEpicManager('unassigned')
      }
    }

    setPreviousSelectionKey(currentSelectionKey)
  }, [selection, showNewStoryForm, showNewEpicForm, previousSelectionKey])

  // Helper functions for status and priority colors
  function getStatusColor(status: 'todo' | 'in_progress' | 'blocked' | 'done'): string {
    switch (status) {
      case 'todo':
        return 'border-l-gray-400'
      case 'in_progress':
        return 'border-l-blue-500'
      case 'blocked':
        return 'border-l-red-500'
      case 'done':
        return 'border-l-green-500'
      default:
        return 'border-l-gray-400'
    }
  }

  function getPriorityColor(priority: 'low' | 'medium' | 'high' | 'critical'): string {
    switch (priority) {
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-700'
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-700'
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-700'
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-700'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700'
    }
  }

  async function saveEpic(autoSave = false) {
    if (!selection.epicName) return

    try {
      if (!autoSave) setSaving(true)
      const epic = epics.find((e) => e._name === selection.epicName)
      if (!epic) return

      const updatedEpic: Epic = {
        ...epic,
        title: epicTitle,
        summary: epicSummary,
        description: epicDescription,
        status: epicStatus,
        priority: epicPriority,
        manager: epicManager,
        targetRelease: epicTargetRelease || null,
        updatedAt: new Date().toISOString(),
      }

      const response = await fetch(
        `/api/projects/${projectName}/epics/${selection.epicName}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedEpic),
        }
      )

      const result = await response.json()

      if (result.success) {
        await fetchEpics()
        if (!autoSave) setHasChanges(false)
      } else {
        setError(result.error || 'Failed to save epic')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save epic')
    } finally {
      if (!autoSave) setSaving(false)
    }
  }

  async function saveStory(autoSave = false) {
    if (!selection.epicName || !selection.storyId) return

    try {
      if (!autoSave) setSaving(true)
      const epic = epics.find((e) => e._name === selection.epicName)
      const story = epic?.stories.find((s) => s.id === selection.storyId)
      if (!story) return

      const updatedStory: Story = {
        ...story,
        title: formatStoryTitle(story.id, storyTitle),
        summary: storySummary,
        description: storyDescription,
        status: storyStatus,
        priority: storyPriority,
        manager: storyManager,
        dueDate: storyDueDate || null,
        plannedStartDate: storyPlannedStartDate || null,
        plannedDueDate: storyPlannedDueDate || null,
        actualStartDate: storyActualStartDate || null,
        actualDueDate: storyActualDueDate || null,
        tags: storyTags,
        estimate: {
          storyPoints,
          confidence: story.estimate?.confidence,
        },
        acceptanceCriteria: acceptanceCriteria.filter((c) => c && c.trim() !== ''),
        files,
        updatedAt: new Date().toISOString(),
        metadata: {
          ...story.metadata,
          lastEditedBy: 'user',
        },
      }

      const response = await fetch(
        `/api/projects/${projectName}/epics/${selection.epicName}/stories/${selection.storyId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedStory),
        }
      )

      const result = await response.json()

      if (result.success) {
        await fetchEpics()
        if (!autoSave) setHasChanges(false)
      } else {
        setError(result.error || 'Failed to save story')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save story')
    } finally {
      if (!autoSave) setSaving(false)
    }
  }

  function addTag() {
    if (newTag.trim() && !storyTags.includes(newTag.trim())) {
      setStoryTags([...storyTags, newTag.trim()])
      setNewTag('')
      setHasChanges(true)
    }
  }

  function removeTag(tagToRemove: string) {
    setStoryTags(storyTags.filter((t) => t !== tagToRemove))
    setHasChanges(true)
  }

  function addCriterion() {
    if (newCriterion.trim()) {
      setAcceptanceCriteria([...acceptanceCriteria, newCriterion.trim()])
      setNewCriterion('')
      setHasChanges(true)
    }
  }

  function removeCriterion(index: number) {
    setAcceptanceCriteria(acceptanceCriteria.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  function updateCriterion(index: number, value: string) {
    const updated = [...acceptanceCriteria]
    updated[index] = value
    setAcceptanceCriteria(updated)
    setHasChanges(true)
  }

  function addFile() {
    setFiles([...files, { path: '', role: 'supporting' }])
    setHasChanges(true)
  }

  function removeFile(index: number) {
    setFiles(files.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  function updateFile(index: number, field: 'path' | 'role', value: string) {
    const updated = [...files]
    updated[index] = { ...updated[index], [field]: value }
    setFiles(updated)
    setHasChanges(true)
  }

  async function saveProjectMetadata() {
    if (!project) return

    try {
      setSavingProject(true)
      const updatedProject: Project = {
        ...project,
        metadata: {
          ...project.metadata,
          manager: projectManager,
          contributors: projectContributors,
        },
      }

      const response = await fetch(`/api/projects/${projectName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject),
      })

      const result = await response.json()

      if (result.success) {
        await fetchProject()
        setHasProjectChanges(false)
      } else {
        setError(result.error || 'Failed to save project')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project')
    } finally {
      setSavingProject(false)
    }
  }

  async function createNewEpic() {
    if (!newEpicTitle.trim()) {
      setError('Epic title is required')
      return
    }

    try {
      setCreatingEpic(true)
      setError(null)

      const now = new Date().toISOString()
      const epicData = {
        title: newEpicTitle.trim(),
        summary: newEpicSummary.trim() || newEpicTitle.trim(), // Use title as summary if empty
        description: newEpicDescription.trim(),
        status: newEpicStatus,
        priority: newEpicPriority,
        manager: newEpicManager,
        createdAt: now,
        updatedAt: now,
        targetRelease: null,
        tags: [],
        storyIds: [],
        metrics: {
          totalStoryPoints: 0,
          completedStoryPoints: 0,
        },
        metadata: {
          createdBy: 'user',
          custom: {},
        },
      }

      const response = await fetch(`/api/projects/${projectName}/epics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(epicData),
      })

      const result = await response.json()

      if (result.success) {
        // Get the epic ID from the response
        const epicId = result.data?.name || result.data?.id

        // Reset form
        setNewEpicTitle('')
        setNewEpicSummary('')
        setNewEpicDescription('')
        setNewEpicStatus('todo')
        setNewEpicPriority('medium')
        setNewEpicManager('unassigned')
        setShowNewEpicForm(false)

        // Refresh epics and select the new epic
        await fetchEpics()

        // Navigate to the new epic
        if (epicId) {
          navigateToEpic(epicId)
        }
      } else {
        setError(result.error || 'Failed to create epic')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create epic')
    } finally {
      setCreatingEpic(false)
    }
  }

  function cancelNewEpic() {
    setShowNewEpicForm(false)
    setNewEpicTitle('')
    setNewEpicSummary('')
    setNewEpicDescription('')
    setNewEpicStatus('todo')
    setNewEpicPriority('medium')
    setNewEpicManager('unassigned')
    setError(null)
  }

  async function createNewStory(epicName: string) {
    if (!newStoryTitle.trim() || (!isFullscreen && !newStorySummary.trim())) {
      setError(isFullscreen ? 'Story title is required' : 'Story title and summary are required')
      return
    }

    const now = new Date().toISOString()
    const title = newStoryTitle.trim()
    const summary = isFullscreen ? '' : newStorySummary.trim()
    const manager = isFullscreen && newStoryManager === 'unassigned' && project?.metadata?.manager && project.metadata.manager !== 'unassigned'
      ? project.metadata.manager
      : newStoryManager

    // In focus mode, do optimistic update for instant feedback
    if (isFullscreen) {
      // Generate a temporary ID for optimistic update
      const tempId = `TEMP-${Date.now()}`
      const optimisticStory: Story = {
        id: tempId,
        title: title, // Will be formatted with ID prefix after API response
        summary: summary,
        description: '',
        status: newStoryStatus,
        priority: newStoryPriority,
        manager: manager,
        createdAt: now,
        updatedAt: now,
        dueDate: null,
        tags: [],
        acceptanceCriteria: [],
        estimate: {
          storyPoints: 0,
        },
        relatedStories: [],
        mentions: [],
        files: [],
        metadata: {
          createdBy: 'user',
          lastEditedBy: 'user',
          custom: {},
        },
        deleted: false,
        archived: false,
      }

      // Optimistically add the story to the UI immediately
      setEpics(prevEpics =>
        prevEpics.map(epic =>
          epic._name === epicName
            ? { ...epic, stories: [...epic.stories, optimisticStory] }
            : epic
        )
      )

      // Immediately clear form and maintain focus
      setNewStoryTitle('')
      setNewStorySummary('')
      setNewStoryStatus('todo')
      setNewStoryPriority('medium')
      setNewStoryManager('unassigned')
      // Keep form open for quick creation
      // Focus will be maintained on the "+" row automatically

      // Make API call in background (non-blocking)
      const storyData = {
        title: title,
        summary: summary,
        description: '',
        status: newStoryStatus,
        priority: newStoryPriority,
        manager: manager,
        createdAt: now,
        updatedAt: now,
        dueDate: null,
        tags: [],
        acceptanceCriteria: [],
        estimate: {
          storyPoints: 0,
        },
        relatedStories: [],
        mentions: [],
        files: [],
        metadata: {
          createdBy: 'user',
          lastEditedBy: 'user',
          custom: {},
        },
      }

      // Fire and forget - handle response asynchronously
      fetch(`/api/projects/${projectName}/epics/${epicName}/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyData),
      })
        .then(response => response.json())
        .then(result => {
          if (result.success && result.data && result.data.id) {
            // Update the story title with the ID prefix
            const formattedTitle = formatStoryTitle(result.data.id, title)
            const finalStory = {
              ...result.data,
              title: formattedTitle !== result.data.title ? formattedTitle : result.data.title,
            }

            // Replace optimistic story with real story
            setEpics(prevEpics =>
              prevEpics.map(epic =>
                epic._name === epicName
                  ? {
                      ...epic,
                      stories: epic.stories.map(story =>
                        story.id === tempId ? finalStory : story
                      ),
                    }
                  : epic
              )
            )

            // Update title if needed
            if (formattedTitle !== result.data.title) {
              fetch(`/api/projects/${projectName}/epics/${epicName}/stories/${result.data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalStory),
              }).catch(err => console.error('Failed to update story title:', err))
            }
          } else {
            // Rollback on error
            setEpics(prevEpics =>
              prevEpics.map(epic =>
                epic._name === epicName
                  ? { ...epic, stories: epic.stories.filter(story => story.id !== tempId) }
                  : epic
              )
            )
            setError(result.error || 'Failed to create story')
          }
        })
        .catch(err => {
          // Rollback on error
          setEpics(prevEpics =>
            prevEpics.map(epic =>
              epic._name === epicName
                ? { ...epic, stories: epic.stories.filter(story => story.id !== tempId) }
                : epic
            )
          )
          setError(err instanceof Error ? err.message : 'Failed to create story')
        })
    } else {
      // Normal mode - use traditional approach
      try {
        setCreatingStory(true)
        setError(null)

        const storyData = {
          title: title,
          summary: summary,
          description: '',
          status: newStoryStatus,
          priority: newStoryPriority,
          manager: manager,
          createdAt: now,
          updatedAt: now,
          dueDate: null,
          tags: [],
          acceptanceCriteria: [],
          estimate: {
            storyPoints: 0,
          },
          relatedStories: [],
          mentions: [],
          files: [],
          metadata: {
            createdBy: 'user',
            lastEditedBy: 'user',
            custom: {},
          },
        }

        const response = await fetch(
          `/api/projects/${projectName}/epics/${epicName}/stories`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(storyData),
          }
        )

        const result = await response.json()

        if (result.success) {
          // Update the story title with the ID prefix
          if (result.data && result.data.id) {
            const formattedTitle = formatStoryTitle(result.data.id, title)
            if (formattedTitle !== result.data.title) {
              // Update the story with the formatted title
              await fetch(`/api/projects/${projectName}/epics/${epicName}/stories/${result.data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...result.data, title: formattedTitle }),
              })
            }
          }

          // Reset form
          setNewStoryTitle('')
          setNewStorySummary('')
          setNewStoryStatus('todo')
          setNewStoryPriority('medium')
          setNewStoryManager('unassigned')
          setShowNewStoryForm(null)

          // Refresh epics to get the new story
          await fetchEpics()

          // Select the newly created story
          if (result.data && result.data.id) {
            navigateToStory(epicName, result.data.id)
          }
        } else {
          setError(result.error || 'Failed to create story')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create story')
      } finally {
        setCreatingStory(false)
      }
    }
  }

  function cancelNewStory() {
    setShowNewStoryForm(null)
    setNewStoryTitle('')
    setNewStorySummary('')
    setNewStoryStatus('todo')
    setNewStoryPriority('medium')
    setNewStoryManager('unassigned')
    setError(null)
  }

  // Delete functions
  const handleDeleteStory = () => {
    if (selection.type === 'story' && selection.epicName && selection.storyId) {
      // Check if story can be deleted (no validation needed for stories currently)
      setDeleteType('story')
      setShowDeleteModal(true)
      setDeleteLoginCode('')
      setDeleteError(null)
    }
  }

  const handleDeleteEpic = () => {
    if (selection.type === 'epic' && selection.epicName) {
      const epic = epics.find(e => e._name === selection.epicName)
      if (epic && epic.stories.length > 0) {
        // Show validation modal instead of error
        setValidationMessage(`This epic contains ${epic.stories.length} active story(ies). Please remove or move all stories before deleting the epic.`)
        setShowValidationModal(true)
        return
      }
      setDeleteType('epic')
      setShowDeleteModal(true)
      setDeleteLoginCode('')
      setDeleteError(null)
    }
  }

  const confirmDelete = async () => {
    if (deleteLoginCode !== '2341') {
      setDeleteError('Nope!')
      setTimeout(() => setDeleteError(null), 2000)
      return
    }

    setDeleting(true)
    setDeleteError(null)

    try {
      if (deleteType === 'story' && selection.type === 'story' && selection.epicName && selection.storyId) {
        const response = await fetch(
          `/api/projects/${projectName}/epics/${selection.epicName}/stories/${selection.storyId}`,
          { method: 'DELETE' }
        )

        if (response.ok) {
          await fetchEpics()
          clearSelection()
          setShowDeleteModal(false)
          setDeleteLoginCode('')
        } else {
          const result = await response.json()
          setDeleteError(result.error || 'Failed to delete story')
        }
      } else if (deleteType === 'epic' && selection.type === 'epic' && selection.epicName) {
        // Double-check on backend (should already be validated, but safety check)
        const response = await fetch(
          `/api/projects/${projectName}/epics/${selection.epicName}`,
          { method: 'DELETE' }
        )

        if (response.ok) {
          await fetchEpics()
          clearSelection()
          setShowDeleteModal(false)
          setDeleteLoginCode('')
        } else {
          const result = await response.json()
          // If backend returns validation error, show it in validation modal
          if (result.error && result.error.includes('contains') && result.error.includes('story')) {
            setShowDeleteModal(false)
            setValidationMessage(result.error)
            setShowValidationModal(true)
          } else {
            setDeleteError(result.error || 'Failed to delete epic')
          }
        }
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setDeleteLoginCode('')
    setDeleteError(null)
    setDeleteType(null)
  }

  function toggleContributor(personId: string) {
    const updated = projectContributors.includes(personId)
      ? projectContributors.filter((id) => id !== personId)
      : [...projectContributors, personId]
    setProjectContributors(updated)
    setHasProjectChanges(true)
  }

  // Multi-select helper functions
  const toggleEpicSelection = useCallback((epicName: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      const epicKey = `epic:${epicName}`
      const epic = epics.find(e => e._name === epicName)

      if (newSet.has(epicKey)) {
        // Deselect epic and all its stories
        newSet.delete(epicKey)
        epic?.stories.forEach(story => {
          newSet.delete(`story:${epicName}:${story.id}`)
        })
      } else {
        // Select epic and all its stories
        newSet.add(epicKey)
        epic?.stories.forEach(story => {
          newSet.add(`story:${epicName}:${story.id}`)
        })
      }
      return newSet
    })
  }, [epics])

  const toggleStorySelection = useCallback((epicName: string, storyId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      const storyKey = `story:${epicName}:${storyId}`
      const epicKey = `epic:${epicName}`

      if (newSet.has(storyKey)) {
        newSet.delete(storyKey)
        // If all stories are deselected, deselect epic too
        const epic = epics.find(e => e._name === epicName)
        const allStoriesSelected = epic?.stories.every(story =>
          story.id === storyId || newSet.has(`story:${epicName}:${story.id}`)
        )
        if (!allStoriesSelected && newSet.has(epicKey)) {
          newSet.delete(epicKey)
        }
      } else {
        newSet.add(storyKey)
        // If all stories are now selected, select epic too
        const epic = epics.find(e => e._name === epicName)
        const allStoriesSelected = epic?.stories.every(story =>
          story.id === storyId || newSet.has(`story:${epicName}:${story.id}`)
        )
        if (allStoriesSelected) {
          newSet.add(epicKey)
        }
      }
      return newSet
    })
  }, [epics])

  const isEpicSelected = useCallback((epicName: string) => {
    return selectedItems.has(`epic:${epicName}`)
  }, [selectedItems])

  const isStorySelected = useCallback((epicName: string, storyId: string) => {
    return selectedItems.has(`story:${epicName}:${storyId}`)
  }, [selectedItems])

  const getSelectedStories = useCallback(() => {
    const stories: { epicName: string; storyId: string }[] = []
    selectedItems.forEach(key => {
      if (key.startsWith('story:')) {
        const [, epicName, storyId] = key.split(':')
        stories.push({ epicName, storyId })
      }
    })
    return stories
  }, [selectedItems])

  const getSelectedEpics = useCallback(() => {
    const epics: string[] = []
    selectedItems.forEach(key => {
      if (key.startsWith('epic:')) {
        epics.push(key.replace('epic:', ''))
      }
    })
    return epics
  }, [selectedItems])

  // Archive selected items
  const handleArchiveSelected = useCallback(async () => {
    const selectedStories = getSelectedStories()
    if (selectedStories.length === 0) {
      setError('No stories selected')
      return
    }

    setArchiving(true)
    setError(null)

    try {
      const archivePromises = selectedStories.map(({ epicName, storyId }) =>
        fetch(`/api/projects/${projectName}/epics/${epicName}/stories/${storyId}/archive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const results = await Promise.all(archivePromises)
      const failed = results.filter(r => !r.ok)

      if (failed.length > 0) {
        setError(`Failed to archive ${failed.length} story(ies)`)
      } else {
        // Check if the currently selected story was archived
        const currentStoryId = selection.type === 'story' ? selection.storyId : null
        const wasCurrentStoryArchived = currentStoryId && selectedStories.some(
          ({ storyId }) => storyId === currentStoryId
        )

        setSelectedItems(new Set())
        await fetchEpics()

        // If the currently selected story was archived, clear the selection to show default view
        if (wasCurrentStoryArchived) {
          clearSelection()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive stories')
    } finally {
      setArchiving(false)
    }
  }, [projectName, getSelectedStories, fetchEpics, selection, clearSelection])

  // Simple markdown renderer
  function renderMarkdown(text: string): string {
    if (!text) return ''

    // Split into lines for processing
    const lines = text.split('\n')
    const output: string[] = []
    let inList = false
    let inCodeBlock = false
    let codeBlockContent: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          const code = codeBlockContent.join('\n')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
          output.push(`<pre style="background: rgba(0,0,0,0.05); padding: 1rem; border-radius: 0.5rem; overflow-x: auto;"><code style="font-family: monospace; font-size: 0.875rem;">${code}</code></pre>`)
          codeBlockContent = []
          inCodeBlock = false
        } else {
          inCodeBlock = true
        }
        continue
      }

      if (inCodeBlock) {
        codeBlockContent.push(line)
        continue
      }

      // Headers
      if (line.startsWith('### ')) {
        if (inList) {
          output.push('</ul>')
          inList = false
        }
        const headerText = processInlineMarkdown(line.substring(4))
        output.push(`<h3 style="font-size: 1.125rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem;">${headerText}</h3>`)
        continue
      }
      if (line.startsWith('## ')) {
        if (inList) {
          output.push('</ul>')
          inList = false
        }
        const headerText = processInlineMarkdown(line.substring(3))
        output.push(`<h2 style="font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem;">${headerText}</h2>`)
        continue
      }
      if (line.startsWith('# ')) {
        if (inList) {
          output.push('</ul>')
          inList = false
        }
        const headerText = processInlineMarkdown(line.substring(2))
        output.push(`<h1 style="font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem;">${headerText}</h1>`)
        continue
      }

      // Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim())) {
        if (!inList) {
          output.push('<ul style="list-style-type: disc; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem;">')
          inList = true
        }
        const content = line.trim().replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '')
        output.push(`<li style="margin-bottom: 0.25rem;">${processInlineMarkdown(content)}</li>`)
        continue
      }

      // Empty line
      if (line.trim() === '') {
        if (inList) {
          output.push('</ul>')
          inList = false
        }
        continue
      }

      // Regular paragraph
      if (inList) {
        output.push('</ul>')
        inList = false
      }
      output.push(`<p style="margin-bottom: 0.75rem;">${processInlineMarkdown(line)}</p>`)
    }

    if (inList) {
      output.push('</ul>')
    }

    return output.join('')
  }

  // Process inline markdown (bold, italic, code, links)
  function processInlineMarkdown(text: string): string {
    return text
      // Escape HTML first
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.1); padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: monospace;">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">$1</a>')
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <div className="h-4 w-4 rounded-full bg-blue-500" />
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-background-light">
        <Header />
        <main className="container py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-text-secondary">Loading project...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background-light">
        <Header />
        <main className="container py-8">
          <Card className="p-6 bg-red-50 border-red-200">
            <p className="text-red-800 mb-4">{error || 'Project not found'}</p>
            <Button variant="outline" onClick={() => router.push('/projects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Card>
        </main>
      </div>
    )
  }

  const displayName = project.name || projectName
  const totalStoryPoints = epics.reduce(
    (sum, epic) => sum + (epic.metrics?.totalStoryPoints || 0),
    0
  )
  const completedStoryPoints = epics.reduce(
    (sum, epic) => sum + (epic.metrics?.completedStoryPoints || 0),
    0
  )
  const completionPercentage =
    totalStoryPoints > 0
      ? Math.round((completedStoryPoints / totalStoryPoints) * 100)
      : 0

  const selectedEpic = selection.type === 'epic' && selection.epicName
    ? epics.find((e) => e._name === selection.epicName)
    : null

  const selectedStory = selection.type === 'story' && selection.epicName && selection.storyId
    ? epics
        .find((e) => e._name === selection.epicName)
        ?.stories.find((s) => s.id === selection.storyId)
    : null

  return (
    <div className="min-h-screen bg-background-light">
      <Header />

      <main className="container py-6">
        {/* Project Header - Compact */}
        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/analytics"
                className="h-8 w-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center flex-shrink-0 transition-colors"
                title="View Analytics"
              >
                <BarChart3 className="h-4 w-4" />
              </Link>
              <h1
                className="text-lg font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors"
                onClick={clearSelection}
                title="Click to view project details"
              >
                {displayName}
              </h1>
              <span className="text-text-secondary">|</span>
              <span className="text-sm text-text-secondary">
                <span className="font-medium text-text-primary">{epics.length}</span> Epics
              </span>
              <span className="text-text-secondary">|</span>
              <span className="text-sm text-text-secondary">
                <span className="font-medium text-text-primary">{totalStoryPoints}</span> Story Points
              </span>
              <span className="text-text-secondary">|</span>
              <span className="text-sm text-text-secondary">
                <span className="font-medium text-text-primary">{completionPercentage}%</span> Progress
              </span>
              <span className="text-text-secondary">|</span>
              <span className="text-sm text-text-secondary">
                Manager: <span className="font-medium text-text-primary">
                  {project.metadata?.manager && project.metadata.manager !== 'unassigned'
                    ? people.find(p => p.id === project.metadata?.manager)?.name || project.metadata.manager
                    : 'unassigned'}
                </span>
                {project.metadata?.contributors && project.metadata.contributors.length > 0 && (
                  <> | Contributors: <span className="font-medium text-text-primary">
                    {project.metadata.contributors
                      .map(id => people.find(p => p.id === id)?.name || id)
                      .join(', ')}
                  </span></>
                )}
              </span>
            </div>
            {/* Actions Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                disabled={getSelectedStories().length === 0 && getSelectedEpics().length === 0}
              >
                <MoreVertical className="h-4 w-4 mr-1" />
                Actions
              </Button>
              {showActionsDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowActionsDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-border-light z-20">
                    <div className="py-1">
                      {getSelectedStories().length > 0 && (
                        <button
                          onClick={() => {
                            handleArchiveSelected()
                            setShowActionsDropdown(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-muted flex items-center gap-2"
                          disabled={archiving}
                        >
                          <Archive className="h-4 w-4" />
                          Archive Selected ({getSelectedStories().length})
                        </button>
                      )}
                      {getSelectedStories().length === 0 && getSelectedEpics().length === 0 && (
                        <div className="px-4 py-2 text-sm text-text-secondary">
                          No items selected
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content: Accordion + Detail Panel */}
        <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
          {/* Left: Epic/Story Accordion */}
          <div className={`space-y-2 ${isFullscreen ? 'col-span-1' : 'lg:col-span-1'}`}>
            <div className="flex items-center justify-between mb-4 relative">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-text-primary">Epics & Stories</h2>
                <button
                  onClick={(e) => {
                    setIsFullscreen(!isFullscreen)
                    e.currentTarget.blur() // Remove focus after click
                  }}
                  className="p-1.5 rounded hover:bg-surface-hover transition-colors focus:outline-none"
                  title={isFullscreen ? "Exit focus mode" : "Focus mode"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4 text-text-secondary" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-text-secondary" />
                  )}
                </button>
              </div>
              {isFullscreen && (
                <div className="absolute left-1/2 transform -translate-x-1/2">
                  <span className="text-xs text-blue-500 font-medium">Focus Mode</span>
                </div>
              )}
              {!showNewEpicForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewEpicForm(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Epic
                </Button>
              )}
            </div>

            {/* New Epic Form */}
            {showNewEpicForm && (
              <Card className="p-4 mb-2 border-2 border-primary">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text-primary">New Epic</h3>
                    <button
                      onClick={cancelNewEpic}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newEpicTitle}
                      onChange={(e) => setNewEpicTitle(e.target.value)}
                      placeholder="Enter epic title"
                      className="input-field text-sm"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">
                      Summary
                    </label>
                    <input
                      type="text"
                      value={newEpicSummary}
                      onChange={(e) => setNewEpicSummary(e.target.value)}
                      placeholder="Brief summary"
                      className="input-field text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">
                      Priority
                    </label>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high', 'critical'] as const).map((priority) => (
                        <label key={priority} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="new-epic-priority"
                            value={priority}
                            checked={newEpicPriority === priority}
                            onChange={(e) => setNewEpicPriority(e.target.value as any)}
                            className="w-3 h-3"
                          />
                          <span className="text-xs capitalize">{priority}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">
                      Manager
                    </label>
                    <select
                      value={newEpicManager}
                      onChange={(e) => setNewEpicManager(e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="unassigned">Unassigned</option>
                      {people.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name} ({person.designation})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={createNewEpic}
                      isLoading={creatingEpic}
                      disabled={!newEpicTitle.trim()}
                    >
                      Create Epic
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelNewEpic}
                      disabled={creatingEpic}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {epics.length === 0 && !showNewEpicForm ? (
              <Card className="p-8 text-center">
                <Target className="h-12 w-12 text-text-secondary mx-auto mb-3 opacity-50" />
                <p className="text-sm text-text-secondary">No epics yet</p>
              </Card>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
              >
                <div className="space-y-0.5">
                  {epics.map((epic) => {
                  const isExpanded = expandedEpics.has(epic._name)
                  const isSelected = selection.type === 'epic' && selection.epicName === epic._name
                  const epicProgress =
                    epic.metrics?.totalStoryPoints > 0
                      ? Math.round(
                          (epic.metrics.completedStoryPoints /
                            epic.metrics.totalStoryPoints) *
                            100
                        )
                      : 0

                  const statusColor = getStatusColor(epic.status as 'todo' | 'in_progress' | 'blocked' | 'done')

                  const epicFocusIndex = buildFocusableItems.findIndex(
                    (item) => item.type === 'epic' && item.epicName === epic._name
                  )
                  const isFocused = isFullscreen && focusedItemIndex === epicFocusIndex

                  return (
                    <DroppableEpic key={epic._name} epicName={epic._name} isExpanded={isExpanded}>
                      <Card
                        className={`overflow-hidden border-l-4 ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        } ${statusColor} ${isFocused ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                      >
                      {/* Epic Row */}
                      <div
                        className={`cursor-pointer hover:bg-surface-muted transition-all ${isFullscreen ? 'p-1.5' : 'p-2'} ${isFocused ? 'bg-blue-50' : ''} ${isShiftHeld && keyboardDraggingId === epic._name ? 'animate-lift-up cursor-grab' : ''}`}
                        onClick={() => {
                          toggleEpic(epic._name)
                          selectEpic(epic)
                        }}
                        ref={(el) => {
                          if (isFocused && el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center flex-1 min-w-0 ${isFullscreen ? 'gap-2' : 'gap-3'}`}>
                            <input
                              type="checkbox"
                              checked={isEpicSelected(epic._name)}
                              onChange={(e) => {
                                e.stopPropagation()
                                toggleEpicSelection(epic._name)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-shrink-0 w-4 h-4 rounded border-border-light cursor-pointer"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleEpic(epic._name)
                              }}
                              className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                              tabIndex={isFullscreen ? 0 : -1}
                            >
                              {isExpanded ? (
                                <ChevronDown className={`text-text-secondary ${isFullscreen ? 'h-3 w-3' : 'h-4 w-4'}`} />
                              ) : (
                                <ChevronRight className={`text-text-secondary ${isFullscreen ? 'h-3 w-3' : 'h-4 w-4'}`} />
                              )}
                            </button>
                            <Target className={`text-primary flex-shrink-0 ${isFullscreen ? 'h-3 w-3' : 'h-4 w-4'}`} />
                            <div className="flex-1 min-w-0">
                              {isFullscreen && editingEpicTitle === epic._name ? (
                                <input
                                  type="text"
                                  value={tempEpicTitle}
                                  onChange={(e) => setTempEpicTitle(e.target.value)}
                                  onBlur={() => {
                                    saveEpicTitle(epic._name, tempEpicTitle, epic.title)
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      saveEpicTitle(epic._name, tempEpicTitle, epic.title)
                                    } else if (e.key === 'Escape') {
                                      e.preventDefault()
                                      setEditingEpicTitle(null)
                                      setTempEpicTitle('')
                                    }
                                  }}
                                  className="w-full font-semibold text-primary text-sm bg-transparent border-b-2 border-primary focus:outline-none px-1"
                                  autoFocus
                                />
                              ) : (
                                <div
                                  className={`font-semibold text-primary truncate ${isFullscreen ? 'text-sm' : 'text-sm'} ${isFullscreen ? 'cursor-text hover:bg-blue-50 px-1 rounded' : ''}`}
                                  onClick={(e) => {
                                    if (isFullscreen) {
                                      e.stopPropagation()
                                      setEditingEpicTitle(epic._name)
                                      setTempEpicTitle(epic.title)
                                    }
                                  }}
                                >
                                  {isFullscreen && epic.id ? `[${epic.id}] ${epic.title}` : epic.title}
                                </div>
                              )}
                              {!isFullscreen && (
                              <div className="flex items-center gap-2 mt-1">
                                <Badge status={epic.status as any} />
                                <span className="text-xs text-text-secondary">
                                  {epic.stories.length} stories
                                </span>
                                <span className="text-xs text-text-secondary">
                                  {epicProgress}% done
                                </span>
                              </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-2 text-right">
                            <div className="text-xs font-medium text-text-primary">
                              {epic.metrics?.totalStoryPoints || 0} pts
                            </div>
                            <div className="text-xs text-text-secondary">
                              {epic.metrics?.completedStoryPoints || 0} done
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stories (Collapsed) */}
                      {isExpanded && (
                        <>
                          {epic.stories.length > 0 && (
                            <div className="border-t border-border-light">
                              <SortableContext
                                items={epic.stories.map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                {epic.stories.map((story) => {
                                  const isStorySelectedInUrl =
                                    selection.type === 'story' &&
                                    selection.epicName === epic._name &&
                                    selection.storyId === story.id
                                  const storyStatusColor = getStatusColor(story.status as 'todo' | 'in_progress' | 'blocked' | 'done')

                                  const storyFocusIndex = buildFocusableItems.findIndex(
                                    (item) => item.type === 'story' && item.epicName === epic._name && item.storyId === story.id
                                  )
                                  const isStoryFocused = isFullscreen && focusedItemIndex === storyFocusIndex
                                  const isKeyboardDragging = isFullscreen && isShiftHeld && keyboardDraggingId === story.id

                                  return (
                                    <SortableStory
                                      key={story.id}
                                      story={story}
                                      epicName={epic._name}
                                      isSelected={isStorySelectedInUrl}
                                      isFocused={isStoryFocused}
                                      isKeyboardDragging={isKeyboardDragging}
                                      storyStatusColor={storyStatusColor}
                                      isFullscreen={isFullscreen}
                                      people={people}
                                      editingStoryTitle={editingStoryTitle}
                                      tempStoryTitle={tempStoryTitle}
                                      setTempStoryTitle={setTempStoryTitle}
                                      setEditingStoryTitle={setEditingStoryTitle}
                                      formatStoryTitle={formatStoryTitle}
                                      extractStoryTitle={extractStoryTitle}
                                      saveStoryTitle={saveStoryTitle}
                                      selectStory={selectStory}
                                      getStatusIcon={getStatusIcon}
                                      isStorySelectedFn={isStorySelected}
                                      toggleStorySelection={toggleStorySelection}
                                    />
                                  )
                                })}
                              </SortableContext>
                            </div>
                          )}

                          {/* New Story Form */}
                          {showNewStoryForm === epic._name && (
                            <div className="border-t border-border-light p-3 bg-surface-muted">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-semibold text-text-primary">New Story</h4>
                                  {!isFullscreen && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      cancelNewStory()
                                    }}
                                    className="text-text-secondary hover:text-text-primary"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                  )}
                                </div>

                                <div>
                                  <input
                                    type="text"
                                    value={newStoryTitle}
                                    onChange={(e) => setNewStoryTitle(e.target.value)}
                                    onKeyDown={async (e) => {
                                      if (e.key === 'Enter' && newStoryTitle.trim()) {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        await createNewStory(epic._name)
                                      }
                                    }}
                                    placeholder="Story title *"
                                    className="input-field text-sm w-full"
                                    autoFocus
                                  />
                                </div>

                                {!isFullscreen && (
                                <div>
                                  <input
                                    type="text"
                                    value={newStorySummary}
                                    onChange={(e) => setNewStorySummary(e.target.value)}
                                    placeholder="Brief summary *"
                                    className="input-field text-sm w-full"
                                  />
                                </div>
                                )}

                                {!isFullscreen && (
                                <div>
                                  <label className="block text-xs text-text-secondary mb-1">Priority</label>
                                  <div className="flex gap-2">
                                    {(['low', 'medium', 'high', 'critical'] as const).map((priority) => (
                                      <label key={priority} className="flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`new-story-priority-${epic._name}`}
                                          value={priority}
                                          checked={newStoryPriority === priority}
                                          onChange={(e) => setNewStoryPriority(e.target.value as any)}
                                          className="w-3 h-3"
                                        />
                                        <span className="text-xs capitalize">{priority}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                                )}

                                {!isFullscreen && (
                                <div>
                                  <select
                                    value={newStoryManager}
                                    onChange={(e) => setNewStoryManager(e.target.value)}
                                    className="input-field text-sm w-full"
                                  >
                                    <option value="unassigned">Unassigned</option>
                                    {people.map((person) => (
                                      <option key={person.id} value={person.id}>
                                        {person.name} ({person.designation})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                )}

                                {!isFullscreen && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      createNewStory(epic._name)
                                    }}
                                    isLoading={creatingStory}
                                    disabled={!newStoryTitle.trim() || !newStorySummary.trim()}
                                  >
                                    Create Story
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      cancelNewStory()
                                    }}
                                    disabled={creatingStory}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                                )}

                                {isFullscreen && (
                                  <div className="text-xs text-text-secondary mt-1">
                                    Press Enter to create, ESC to cancel
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Add Story Bar */}
                          {showNewStoryForm !== epic._name && (
                            <div
                              className={`border-t transition-colors cursor-pointer ${
                                isFullscreen && focusedItemIndex !== null && buildFocusableItems[focusedItemIndex]?.type === 'newStory' && buildFocusableItems[focusedItemIndex]?.epicName === epic._name
                                  ? 'border-l-4 border-l-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-offset-2'
                                  : 'border-gray-300 bg-gray-100 hover:bg-gray-200'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowNewStoryForm(epic._name)
                                // Set default manager to project manager in focus mode
                                if (isFullscreen && project?.metadata?.manager && project.metadata.manager !== 'unassigned') {
                                  setNewStoryManager(project.metadata.manager)
                                }
                                // Ensure epic is expanded
                                if (!isExpanded) {
                                  toggleEpic(epic._name)
                                }
                              }}
                              ref={(el) => {
                                if (isFullscreen && focusedItemIndex !== null && buildFocusableItems[focusedItemIndex]?.type === 'newStory' && buildFocusableItems[focusedItemIndex]?.epicName === epic._name && el) {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                                }
                              }}
                            >
                              <div className="flex items-center justify-center py-2">
                                <Plus className={`h-4 w-4 ${
                                  isFullscreen && focusedItemIndex !== null && buildFocusableItems[focusedItemIndex]?.type === 'newStory' && buildFocusableItems[focusedItemIndex]?.epicName === epic._name
                                    ? 'text-blue-600'
                                    : 'text-text-secondary'
                                }`} />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      </Card>
                    </DroppableEpic>
                  )
                })}
                </div>
                <DragOverlay>
                  {activeId && draggedStory ? (
                    <div className="bg-white border-2 border-blue-500 rounded shadow-lg p-2 opacity-90">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-text-secondary" />
                        {getStatusIcon(draggedStory.story.status)}
                        <FileText className="h-3 w-3 text-text-secondary" />
                        <span className="text-xs font-medium text-text-primary">
                          {formatStoryTitle(draggedStory.story.id, draggedStory.story.title)}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}

            {/* Quick Add Epic Bar in Focus Mode */}
            {isFullscreen && (
              <div
                className={`w-full rounded p-2 mt-2 transition-all ${
                  focusedItemIndex !== null && buildFocusableItems[focusedItemIndex]?.type === 'newEpic'
                    ? 'bg-blue-100 border-4 border-blue-500 ring-2 ring-blue-300'
                    : 'bg-blue-50 border border-blue-200'
                }`}
                ref={(el) => {
                  if (isFullscreen && focusedItemIndex !== null && buildFocusableItems[focusedItemIndex]?.type === 'newEpic' && el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-blue-600" />
                  <input
                    type="text"
                    value={quickEpicTitle}
                    onChange={(e) => setQuickEpicTitle(e.target.value)}
                    ref={(el) => {
                      if (isFullscreen && focusedItemIndex !== null && buildFocusableItems[focusedItemIndex]?.type === 'newEpic' && el) {
                        setTimeout(() => el.focus(), 0)
                      }
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && quickEpicTitle.trim()) {
                        e.preventDefault()
                        // Create epic with the entered title
                        try {
                          setCreatingEpic(true)
                          setError(null)

                          const now = new Date().toISOString()
                          const epicData = {
                            title: quickEpicTitle.trim(),
                            summary: quickEpicTitle.trim(), // Use title as summary
                            description: '',
                            status: 'todo' as const,
                            priority: 'medium' as const,
                            manager: project?.metadata?.manager && project.metadata.manager !== 'unassigned'
                              ? project.metadata.manager
                              : 'unassigned',
                            createdAt: now,
                            updatedAt: now,
                            targetRelease: null,
                            tags: [],
                            storyIds: [],
                            metrics: {
                              totalStoryPoints: 0,
                              completedStoryPoints: 0,
                            },
                            metadata: {
                              createdBy: 'user',
                              custom: {},
                            },
                          }

                          const response = await fetch(`/api/projects/${projectName}/epics`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(epicData),
                          })

                          const result = await response.json()

                          if (result.success) {
                            setQuickEpicTitle('')
                            await fetchEpics()
                            // In focus mode, return focus to the newEpic input
                            if (isFullscreen) {
                              setTimeout(() => {
                                const newEpicIndex = buildFocusableItems.findIndex(
                                  (item) => item.type === 'newEpic'
                                )
                                if (newEpicIndex >= 0) {
                                  setFocusedItemIndex(newEpicIndex)
                                }
                              }, 0)
                            } else {
                              // In normal mode, select the newly created epic
                              const epicId = result.data?.name || result.data?.id
                              if (epicId) {
                                navigateToEpic(epicId)
                              }
                            }
                          } else {
                            setError(result.error || 'Failed to create epic')
                          }
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Failed to create epic')
                        } finally {
                          setCreatingEpic(false)
                        }
                      }
                    }}
                    placeholder="+ Add Epic"
                    className="flex-1 bg-transparent border-none outline-none text-sm text-blue-700 placeholder-blue-400 focus:ring-0"
                    disabled={creatingEpic}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: Editable Detail Panel */}
          {!isFullscreen && (
          <div className="lg:col-span-2">
            {selection.type === null ? (
              <Card className="p-6">
                <div className="text-center mb-6">
                  <FileText className="h-16 w-16 text-text-secondary mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    Select an Epic or Story
                  </h3>
                  <p className="text-text-secondary text-sm mb-6">
                    Click on an epic or story from the list to view and edit details
                  </p>
                </div>
                {project.description && (
                  <div className="border-t border-border-light pt-6 mb-6">
                    <h4 className="text-sm font-medium text-text-primary mb-2">Project Description</h4>
                    <p className="text-text-secondary text-sm whitespace-pre-line">
                      {project.description}
                    </p>
                  </div>
                )}

                {/* Project Metadata Editor */}
                <div className="border-t border-border-light pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-text-primary">Project Team</h4>
                    {hasProjectChanges && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={saveProjectMetadata}
                        isLoading={savingProject}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Manager
                      </label>
                      <select
                        value={projectManager}
                        onChange={(e) => {
                          setProjectManager(e.target.value)
                          setHasProjectChanges(true)
                        }}
                        className="input-field text-sm"
                      >
                        <option value="unassigned">Unassigned</option>
                        {people.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.name} ({person.designation})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Contributors
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {people.map((person) => (
                          <label
                            key={person.id}
                            className="flex items-center gap-2 p-2 rounded hover:bg-surface-muted cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={projectContributors.includes(person.id)}
                              onChange={() => toggleContributor(person.id)}
                              className="rounded"
                            />
                            <div className="flex-1">
                              <div className="text-sm text-text-primary">{person.name}</div>
                              <div className="text-xs text-text-secondary">
                                {person.designation} • {person.roleInProject || 'Contributor'}
                              </div>
                            </div>
                          </label>
                        ))}
                        {people.length === 0 && (
                          <p className="text-sm text-text-secondary">
                            No people available. Add people in the People page.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : selection.type === 'epic' && selectedEpic ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1">
                    {/* Breadcrumb */}
                    {selection.epicName && (
                      <div className="text-sm text-text-secondary mb-2">
                        {selection.epicName}
                      </div>
                    )}
                    {/* Title as heading */}
                    <input
                      type="text"
                      value={epicTitle}
                      onChange={(e) => {
                        setEpicTitle(e.target.value)
                        setHasChanges(true)
                      }}
                      className="text-2xl font-bold text-text-primary bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 w-full"
                      style={{ borderBottom: '2px solid transparent' }}
                      onFocus={(e) => {
                        e.target.style.borderBottom = '2px solid var(--primary, #3b82f6)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderBottom = '2px solid transparent'
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    {hasChanges && (
                      <span className="text-sm text-text-secondary">Unsaved changes</span>
                    )}
                    <Button
                      variant="primary"
                      onClick={() => saveEpic(false)}
                      isLoading={saving}
                      disabled={!hasChanges}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">

                  {/* Summary */}
                  <div className="pt-2">
                    <h3 className="text-base font-semibold text-text-primary mb-3 border-b border-border-light pb-2">
                      Summary
                    </h3>
                    <input
                      type="text"
                      value={epicSummary}
                      onChange={(e) => {
                        setEpicSummary(e.target.value)
                        setHasChanges(true)
                      }}
                      className="input-field"
                    />
                  </div>

                  {/* Metadata Table */}
                  <div className="border border-border-light rounded-lg overflow-hidden">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-border-light">
                          <td className="px-4 py-2 bg-surface-muted text-sm font-medium text-text-primary w-1/3">
                            Status
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-4">
                              {(['todo', 'in_progress', 'blocked', 'done'] as const).map((status) => (
                                <label
                                  key={status}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name="epic-status"
                                    value={status}
                                    checked={epicStatus === status}
                                    onChange={async (e) => {
                                      setEpicStatus(e.target.value as any)
                                      setHasChanges(true)
                                      // Auto-save
                                      const currentEpic = epics.find((e) => e._name === selection.epicName)
                                      if (currentEpic) {
                                        const updatedEpic: Epic = {
                                          ...currentEpic,
                                          status: e.target.value as any,
                                          updatedAt: new Date().toISOString(),
                                        }
                                        try {
                                          await fetch(
                                            `/api/projects/${projectName}/epics/${selection.epicName}`,
                                            {
                                              method: 'PUT',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify(updatedEpic),
                                            }
                                          )
                                          await fetchEpics()
                                        } catch (err) {
                                          console.error('Auto-save failed:', err)
                                        }
                                      }
                                    }}
                                    className="w-4 h-4"
                                  />
                                  <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                                </label>
                              ))}
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-border-light">
                          <td className="px-4 py-2 bg-surface-muted text-sm font-medium text-text-primary">
                            Priority
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-4">
                              {(['low', 'medium', 'high', 'critical'] as const).map((priority) => (
                                <label
                                  key={priority}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name="epic-priority"
                                    value={priority}
                                    checked={epicPriority === priority}
                                    onChange={async (e) => {
                                      setEpicPriority(e.target.value as any)
                                      setHasChanges(true)
                                      // Auto-save
                                      const currentEpic = epics.find((e) => e._name === selection.epicName)
                                      if (currentEpic) {
                                        const updatedEpic: Epic = {
                                          ...currentEpic,
                                          priority: e.target.value as any,
                                          updatedAt: new Date().toISOString(),
                                        }
                                        try {
                                          await fetch(
                                            `/api/projects/${projectName}/epics/${selection.epicName}`,
                                            {
                                              method: 'PUT',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify(updatedEpic),
                                            }
                                          )
                                          await fetchEpics()
                                        } catch (err) {
                                          console.error('Auto-save failed:', err)
                                        }
                                      }
                                    }}
                                    className="w-4 h-4"
                                  />
                                  <span className="text-sm capitalize">{priority}</span>
                                </label>
                              ))}
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-border-light">
                          <td className="px-4 py-2 bg-surface-muted text-sm font-medium text-text-primary">
                            Manager
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={epicManager}
                              onChange={(e) => {
                                setEpicManager(e.target.value)
                                setHasChanges(true)
                              }}
                              className="input-field text-sm"
                            >
                              <option value="unassigned">Unassigned</option>
                              {people.map((person) => (
                                <option key={person.id} value={person.id}>
                                  {person.name} ({person.designation})
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 bg-surface-muted text-sm font-medium text-text-primary">
                            Target Release
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="date"
                              value={epicTargetRelease}
                              onChange={(e) => {
                                setEpicTargetRelease(e.target.value)
                                setHasChanges(true)
                              }}
                              className="input-field text-sm"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Description */}
                  <div className="pt-2">
                    <h3 className="text-base font-semibold text-text-primary mb-3 border-b border-border-light pb-2">
                      Description
                    </h3>
                    <div className="border border-border-light rounded-lg overflow-hidden">
                      <MarkdownEditor
                        value={epicDescription}
                        onChange={(value) => {
                          setEpicDescription(value)
                          setHasChanges(true)
                        }}
                        placeholder="Enter epic description using markdown..."
                        minHeight={500}
                      />
                    </div>
                  </div>

                  {/* Metrics (Read-only) */}
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border-light">
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Stories</div>
                      <div className="text-lg font-bold text-text-primary">
                        {selectedEpic.stories.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Story Points</div>
                      <div className="text-lg font-bold text-text-primary">
                        {selectedEpic.metrics?.totalStoryPoints || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Completed</div>
                      <div className="text-lg font-bold text-text-primary">
                        {selectedEpic.metrics?.completedStoryPoints || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Progress</div>
                      <div className="text-lg font-bold text-text-primary">
                        {selectedEpic.metrics?.totalStoryPoints > 0
                          ? Math.round(
                              (selectedEpic.metrics.completedStoryPoints /
                                selectedEpic.metrics.totalStoryPoints) *
                                100
                            )
                          : 0}
                        %
                      </div>
                    </div>
                  </div>

                  {/* Delete Button - Bottom Left */}
                  <div className="mt-6 pt-6 border-t border-border-light">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteEpic}
                      className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Epic
                    </Button>
                  </div>
                </div>
              </Card>
            ) : selection.type === 'story' && selectedStory ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1">
                    {/* Breadcrumb */}
                    {selection.epicName && selection.storyId && (
                      <div className="text-sm text-text-secondary mb-2">
                        <button
                          onClick={() => navigateToEpic(selection.epicName!)}
                          className="hover:text-text-primary transition-colors"
                        >
                          {selection.epicName}
                        </button>
                        <span className="mx-2">/</span>
                        <span>{selection.storyId}</span>
                      </div>
                    )}
                    {/* Title as heading */}
                    <input
                      type="text"
                      value={storyTitle}
                      onChange={(e) => {
                        setStoryTitle(e.target.value)
                        setHasChanges(true)
                      }}
                      className="text-2xl font-bold text-text-primary bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 w-full"
                      style={{ borderBottom: '2px solid transparent' }}
                      onFocus={(e) => {
                        e.target.style.borderBottom = '2px solid var(--primary, #3b82f6)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderBottom = '2px solid transparent'
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    {hasChanges && (
                      <span className="text-sm text-text-secondary">Unsaved changes</span>
                    )}
                    <Button
                      variant="primary"
                      onClick={() => saveStory(false)}
                      isLoading={saving}
                      disabled={!hasChanges}
                      data-save-button="true"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">

                  {/* Summary */}
                  <div className="pt-2">
                    <h3 className="text-base font-semibold text-text-primary mb-3 border-b border-border-light pb-2">
                      Summary
                    </h3>
                    <input
                      type="text"
                      value={storySummary}
                      onChange={(e) => {
                        setStorySummary(e.target.value)
                        setHasChanges(true)
                      }}
                      className="input-field"
                    />
                  </div>

                  {/* Metadata Table */}
                  <div className="border border-border-light rounded-lg overflow-hidden">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-border-light">
                          <td className="px-4 py-2 bg-surface-muted text-sm font-medium text-text-primary w-1/3">
                            Status
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-4">
                              {(['todo', 'in_progress', 'blocked', 'done'] as const).map((status) => (
                                <label
                                  key={status}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name="story-status"
                                    value={status}
                                    checked={storyStatus === status}
                                    onChange={async (e) => {
                                      setStoryStatus(e.target.value as any)
                                      setHasChanges(true)
                                      // Auto-save
                                      const epic = epics.find((e) => e._name === selection.epicName)
                                      const story = epic?.stories.find((s) => s.id === selection.storyId)
                                      if (story) {
                                        const updatedStory: Story = {
                                          ...story,
                                          status: e.target.value as any,
                                          updatedAt: new Date().toISOString(),
                                        }
                                        try {
                                          await fetch(
                                            `/api/projects/${projectName}/epics/${selection.epicName}/stories/${selection.storyId}`,
                                            {
                                              method: 'PUT',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify(updatedStory),
                                            }
                                          )
                                          await fetchEpics()
                                        } catch (err) {
                                          console.error('Auto-save failed:', err)
                                        }
                                      }
                                    }}
                                    className="w-4 h-4"
                                  />
                                  <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                                </label>
                              ))}
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-border-light">
                          <td className="px-4 py-2 bg-surface-muted text-sm font-medium text-text-primary">
                            Priority
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-4">
                              {(['low', 'medium', 'high', 'critical'] as const).map((priority) => (
                                <label
                                  key={priority}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name="story-priority"
                                    value={priority}
                                    checked={storyPriority === priority}
                                    onChange={async (e) => {
                                      setStoryPriority(e.target.value as any)
                                      setHasChanges(true)
                                      // Auto-save
                                      const epic = epics.find((e) => e._name === selection.epicName)
                                      const story = epic?.stories.find((s) => s.id === selection.storyId)
                                      if (story) {
                                        const updatedStory: Story = {
                                          ...story,
                                          priority: e.target.value as any,
                                          updatedAt: new Date().toISOString(),
                                        }
                                        try {
                                          await fetch(
                                            `/api/projects/${projectName}/epics/${selection.epicName}/stories/${selection.storyId}`,
                                            {
                                              method: 'PUT',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify(updatedStory),
                                            }
                                          )
                                          await fetchEpics()
                                        } catch (err) {
                                          console.error('Auto-save failed:', err)
                                        }
                                      }
                                    }}
                                    className="w-4 h-4"
                                  />
                                  <span className="text-sm capitalize">{priority}</span>
                                </label>
                              ))}
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-border-light">
                          <td className="px-4 py-2 bg-surface-muted text-sm font-medium text-text-primary">
                            Manager
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={storyManager}
                              onChange={(e) => {
                                setStoryManager(e.target.value)
                                setHasChanges(true)
                              }}
                              className="input-field text-sm"
                            >
                              <option value="unassigned">Unassigned</option>
                              {people.map((person) => (
                                <option key={person.id} value={person.id}>
                                  {person.name} ({person.designation})
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                        <tr className="border-b border-border-light">
                          <td className="px-4 py-2 bg-surface-muted text-sm font-medium text-text-primary">
                            Planned Dates
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-4 items-center">
                              <div className="flex-1">
                                <label className="block text-xs text-text-secondary mb-1">Start Date</label>
                                <input
                                  type="date"
                                  value={storyPlannedStartDate}
                                  onChange={(e) => {
                                    setStoryPlannedStartDate(e.target.value)
                                    setHasChanges(true)
                                  }}
                                  className="input-field text-sm w-full"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs text-text-secondary mb-1">Due Date</label>
                                <input
                                  type="date"
                                  value={storyPlannedDueDate}
                                  onChange={(e) => {
                                    setStoryPlannedDueDate(e.target.value)
                                    setHasChanges(true)
                                  }}
                                  className="input-field text-sm w-full"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-border-light">
                          <td className="px-4 py-2 bg-surface-muted text-sm font-medium text-text-primary">
                            Actual Dates
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-4 items-center">
                              <div className="flex-1">
                                <label className="block text-xs text-text-secondary mb-1">Start Date</label>
                                <input
                                  type="date"
                                  value={storyActualStartDate}
                                  onChange={(e) => {
                                    setStoryActualStartDate(e.target.value)
                                    setHasChanges(true)
                                  }}
                                  className="input-field text-sm w-full"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs text-text-secondary mb-1">Due Date</label>
                                <input
                                  type="date"
                                  value={storyActualDueDate}
                                  onChange={(e) => {
                                    setStoryActualDueDate(e.target.value)
                                    setHasChanges(true)
                                  }}
                                  className="input-field text-sm w-full"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-border-light">
                          <td className="px-4 py-2 bg-surface-muted text-sm font-medium text-text-primary">
                            Story Points
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={storyPoints}
                              onChange={(e) => {
                                setStoryPoints(parseInt(e.target.value) || 0)
                                setHasChanges(true)
                              }}
                              min="0"
                              className="input-field text-sm"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 bg-surface-muted text-sm font-medium text-text-primary align-top">
                            Tags
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                                placeholder="Add tag"
                                className="input-field text-sm flex-1"
                              />
                              <Button variant="outline" size="sm" onClick={addTag}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {storyTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-surface-muted rounded text-sm"
                                >
                                  <Tag className="h-3 w-3" />
                                  {tag}
                                  <button
                                    onClick={() => removeTag(tag)}
                                    className="hover:text-red-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Description */}
                  <div className="pt-2">
                    <h3 className="text-base font-semibold text-text-primary mb-3 border-b border-border-light pb-2">
                      Description
                    </h3>
                    <div className="border border-border-light rounded-lg overflow-hidden">
                      <MarkdownEditor
                        value={storyDescription}
                        onChange={(value) => {
                          setStoryDescription(value)
                          setHasChanges(true)
                        }}
                        placeholder={storyTitle ? `Please describe your story "${storyTitle}" here using markdown...` : 'Please describe your story here using markdown...'}
                        minHeight={500}
                      />
                    </div>
                  </div>

                  {/* Acceptance Criteria */}
                  <div className="pt-2">
                    <h3 className="text-base font-semibold text-text-primary mb-3 border-b border-border-light pb-2">
                      Acceptance Criteria
                    </h3>
                    <div className="space-y-2">
                      {acceptanceCriteria.map((criterion, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={criterion}
                            onChange={(e) => updateCriterion(index, e.target.value)}
                            className="input-field flex-1"
                            placeholder="Acceptance criterion"
                          />
                          <button
                            onClick={() => removeCriterion(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCriterion}
                          onChange={(e) => setNewCriterion(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addCriterion()}
                          className="input-field flex-1"
                          placeholder="Add new criterion..."
                        />
                        <Button variant="outline" size="sm" onClick={addCriterion}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Files */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3 border-b border-border-light pb-2">
                      <h3 className="text-base font-semibold text-text-primary">
                        Files
                      </h3>
                      <Button variant="outline" size="sm" onClick={addFile}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={file.path}
                            onChange={(e) => updateFile(index, 'path', e.target.value)}
                            placeholder="File path"
                            className="input-field flex-1 text-sm"
                          />
                          <select
                            value={file.role}
                            onChange={(e) => updateFile(index, 'role', e.target.value)}
                            className="input-field text-sm w-32"
                          >
                            <option value="primary">Primary</option>
                            <option value="supporting">Supporting</option>
                            <option value="test">Test</option>
                          </select>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delete Button - Bottom Left */}
                  <div className="mt-6 pt-6 border-t border-border-light">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteStory}
                      className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Story
                    </Button>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={cancelDelete}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Delete {deleteType === 'story' ? 'Story' : 'Epic'}
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              This action cannot be undone. Enter your login code to confirm deletion.
            </p>
            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={deleteLoginCode}
                  onChange={(e) => setDeleteLoginCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      confirmDelete()
                    } else if (e.key === 'Escape') {
                      cancelDelete()
                    }
                  }}
                  placeholder="Enter login code"
                  className="input-field w-full"
                  autoFocus
                />
                {deleteError && (
                  <p className={`mt-2 text-sm ${deleteError === 'Nope!' ? 'text-red-600 animate-fade-in' : 'text-red-600'}`}>
                    {deleteError}
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelDelete}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={confirmDelete}
                  isLoading={deleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowValidationModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                Cannot Delete {deleteType === 'story' ? 'Story' : 'Epic'}
              </h3>
              <button
                onClick={() => setShowValidationModal(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                {validationMessage}
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowValidationModal(false)}
              >
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
