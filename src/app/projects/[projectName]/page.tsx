'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
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
} from 'lucide-react'
import type { Project, Epic, Story, StoryFile, Person } from '@/lib/types'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

type Selection = {
  type: 'epic' | 'story' | null
  epicName?: string
  storyId?: string
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
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>([''])
  const [newCriterion, setNewCriterion] = useState('')
  const [files, setFiles] = useState<StoryFile[]>([])

  // Project metadata edit state
  const [projectManager, setProjectManager] = useState('')
  const [projectContributors, setProjectContributors] = useState<string[]>([])
  const [hasProjectChanges, setHasProjectChanges] = useState(false)
  const [savingProject, setSavingProject] = useState(false)

  // Preview state
  const [epicDescriptionPreview, setEpicDescriptionPreview] = useState(true)
  const [storyDescriptionPreview, setStoryDescriptionPreview] = useState(true)

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

  useEffect(() => {
    if (projectName) {
      fetchProject()
      fetchEpics()
      fetchPeople()
    }
  }, [projectName])

  // Derive selection from URL params
  const selection: Selection = epicNameFromUrl && storyIdFromUrl
    ? { type: 'story', epicName: epicNameFromUrl, storyId: storyIdFromUrl }
    : epicNameFromUrl
    ? { type: 'epic', epicName: epicNameFromUrl }
    : { type: null }

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
            : ['']
        )
        setFiles(story.files || [])
        setHasChanges(false)
      }
    }
  }, [epicNameFromUrl, storyIdFromUrl, epics])

  async function fetchPeople() {
    try {
      const response = await fetch(`/api/projects/${projectName}/people`)
      const result = await response.json()

      if (result.success) {
        setPeople(result.data || [])
      }
    } catch (err) {
      console.error('Failed to load people:', err)
    }
  }

  async function fetchProject() {
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
  }

  async function fetchEpics() {
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
  }

  function clearSelection() {
    router.push(`/projects/${projectName}`)
    setHasChanges(false)
  }

  function navigateToEpic(epicName: string) {
    router.push(`/projects/${projectName}?epic=${encodeURIComponent(epicName)}`)
  }

  function navigateToStory(epicName: string, storyId: string) {
    router.push(`/projects/${projectName}?epic=${encodeURIComponent(epicName)}&story=${encodeURIComponent(storyId)}`)
  }

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

  // Build flat list of focusable items (epics, stories, and new story buttons) for keyboard navigation
  type FocusableItem =
    | { type: 'epic'; epicName: string; index: number }
    | { type: 'story'; epicName: string; storyId: string; index: number }
    | { type: 'newStory'; epicName: string; index: number }

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

    return items
  }, [epics, expandedEpics])

  const selectEpicCallback = useCallback((epic: Epic & { _name: string; stories: Story[] }) => {
    navigateToEpic(epic._name)
  }, [projectName])

  const selectStoryCallback = useCallback((epicName: string, story: Story) => {
    navigateToStory(epicName, story.id)
  }, [projectName])

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
  // Helper functions for story title formatting
  const formatStoryTitle = useCallback((storyId: string, title: string): string => {
    // If title already has the prefix, return as is
    if (title.startsWith(`[${storyId}]`)) {
      return title
    }
    // Otherwise, add the prefix
    return `[${storyId}] ${title.trim()}`
  }, [])

  const extractStoryTitle = useCallback((storyId: string, title: string): string => {
    // Remove the prefix if it exists for editing
    const prefix = `[${storyId}]`
    if (title.startsWith(prefix)) {
      return title.substring(prefix.length).trim()
    }
    return title.trim()
  }, [])

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
            // Ensure epic is expanded
            if (!expandedEpics.has(focusedItem.epicName)) {
              setExpandedEpics((prev) => new Set([...prev, focusedItem.epicName]))
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

      // Handle arrow keys for navigation (Up/Down only)
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return

      // Don't navigate if we're in edit mode or if a form is open
      if (editingEpicTitle || editingStoryTitle || showNewStoryForm || showNewEpicForm) return

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
  }, [isFullscreen, focusedItemIndex, buildFocusableItems, epics, expandedEpics, selectEpicCallback, selectStoryCallback, editingEpicTitle, editingStoryTitle, tempEpicTitle, tempStoryTitle, saveEpicTitle, saveStoryTitle, showNewStoryForm, showNewEpicForm, lastFocusedEpicName])

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
  }, [isFullscreen])

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
  }, [selection, showNewStoryForm, showNewEpicForm])

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
    if (!newStoryTitle.trim() || !newStorySummary.trim()) {
      setError('Story title and summary are required')
      return
    }

    try {
      setCreatingStory(true)
      setError(null)

      const now = new Date().toISOString()
      // Generate a temporary ID for the story (will be replaced by API)
      // For now, we'll let the API generate the ID and update the title after creation
      const storyData = {
        title: newStoryTitle.trim(),
        summary: newStorySummary.trim(),
        description: '',
        status: newStoryStatus,
        priority: newStoryPriority,
        manager: newStoryManager,
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
          const formattedTitle = formatStoryTitle(result.data.id, newStoryTitle.trim())
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

        // Select the new story
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

  function cancelNewStory() {
    setShowNewStoryForm(null)
    setNewStoryTitle('')
    setNewStorySummary('')
    setNewStoryStatus('todo')
    setNewStoryPriority('medium')
    setNewStoryManager('unassigned')
    setError(null)
  }

  function toggleContributor(personId: string) {
    const updated = projectContributors.includes(personId)
      ? projectContributors.filter((id) => id !== personId)
      : [...projectContributors, personId]
    setProjectContributors(updated)
    setHasProjectChanges(true)
  }

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
        </div>

        {/* Main Content: Accordion + Detail Panel */}
        <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
          {/* Left: Epic/Story Accordion */}
          <div className={`space-y-2 ${isFullscreen ? 'col-span-1' : 'lg:col-span-1'}`}>
            <div className="flex items-center justify-between mb-4">
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
              <div className="space-y-1">
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
                    <Card
                      key={epic._name}
                      className={`overflow-hidden border-l-4 ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      } ${statusColor} ${isFocused ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    >
                      {/* Epic Row */}
                      <div
                        className={`cursor-pointer hover:bg-surface-muted transition-colors ${isFullscreen ? 'p-2' : 'p-4'} ${isFocused ? 'bg-blue-50' : ''}`}
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
                                  className="w-full font-semibold text-text-primary text-sm bg-transparent border-b-2 border-blue-500 focus:outline-none px-1"
                                  autoFocus
                                />
                              ) : (
                                <div
                                  className={`font-semibold text-text-primary truncate ${isFullscreen ? 'text-sm' : ''} ${isFullscreen ? 'cursor-text hover:bg-blue-50 px-1 rounded' : ''}`}
                                  onClick={(e) => {
                                    if (isFullscreen) {
                                      e.stopPropagation()
                                      setEditingEpicTitle(epic._name)
                                      setTempEpicTitle(epic.title)
                                    }
                                  }}
                                >
                                  {epic.title}
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
                              {epic.stories.map((story) => {
                                const isStorySelected =
                                  selection.type === 'story' &&
                                  selection.epicName === epic._name &&
                                  selection.storyId === story.id
                                const storyStatusColor = getStatusColor(story.status as 'todo' | 'in_progress' | 'blocked' | 'done')

                                const storyFocusIndex = buildFocusableItems.findIndex(
                                  (item) => item.type === 'story' && item.epicName === epic._name && item.storyId === story.id
                                )
                                const isStoryFocused = isFullscreen && focusedItemIndex === storyFocusIndex

                                return (
                                  <div
                                    key={story.id}
                                    className={`cursor-pointer hover:bg-surface-muted transition-colors border-l-4 border-b border-border-light last:border-b-0 ${
                                      isStorySelected ? 'bg-primary/5' : ''
                                    } ${storyStatusColor} ${isFullscreen ? 'p-2 pl-8' : 'p-3 pl-12'} ${isStoryFocused ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      selectStory(epic._name, story)
                                    }}
                                    ref={(el) => {
                                      if (isStoryFocused && el) {
                                        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                                      }
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className={`flex items-center flex-1 min-w-0 ${isFullscreen ? 'gap-1.5' : 'gap-2'}`}>
                                        {getStatusIcon(story.status)}
                                        <FileText className={`text-text-secondary flex-shrink-0 ${isFullscreen ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                                        <div className="flex-1 min-w-0">
                                          {isFullscreen && editingStoryTitle?.epicName === epic._name && editingStoryTitle?.storyId === story.id ? (
                                            <input
                                              type="text"
                                              value={tempStoryTitle}
                                              onChange={(e) => setTempStoryTitle(e.target.value)}
                                              onBlur={() => {
                                                saveStoryTitle(epic._name, story.id, tempStoryTitle, formatStoryTitle(story.id, story.title))
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault()
                                                  saveStoryTitle(epic._name, story.id, tempStoryTitle, formatStoryTitle(story.id, story.title))
                                                } else if (e.key === 'Escape') {
                                                  e.preventDefault()
                                                  setEditingStoryTitle(null)
                                                  setTempStoryTitle('')
                                                }
                                              }}
                                              className="w-full font-medium text-text-primary text-xs bg-transparent border-b-2 border-blue-500 focus:outline-none px-1"
                                              autoFocus
                                            />
                                          ) : (
                                            <div
                                              className={`font-medium text-text-primary truncate ${isFullscreen ? 'text-xs' : 'text-sm'} ${isFullscreen ? 'cursor-text hover:bg-blue-50 px-1 rounded' : ''}`}
                                              onClick={(e) => {
                                                if (isFullscreen) {
                                                  e.stopPropagation()
                                                  setEditingStoryTitle({ epicName: epic._name, storyId: story.id })
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
                              })}
                            </div>
                          )}

                          {/* New Story Form */}
                          {showNewStoryForm === epic._name && (
                            <div className="border-t border-border-light p-3 bg-surface-muted">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-semibold text-text-primary">New Story</h4>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      cancelNewStory()
                                    }}
                                    className="text-text-secondary hover:text-text-primary"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>

                                <div>
                                  <input
                                    type="text"
                                    value={newStoryTitle}
                                    onChange={(e) => setNewStoryTitle(e.target.value)}
                                    placeholder="Story title *"
                                    className="input-field text-sm w-full"
                                    autoFocus
                                  />
                                </div>

                                <div>
                                  <input
                                    type="text"
                                    value={newStorySummary}
                                    onChange={(e) => setNewStorySummary(e.target.value)}
                                    placeholder="Brief summary *"
                                    className="input-field text-sm w-full"
                                  />
                                </div>

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
                  )
                })}
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
                    <div className="flex items-center justify-between mb-3 border-b border-border-light pb-2">
                      <h3 className="text-base font-semibold text-text-primary">
                        Description
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEpicDescriptionPreview(!epicDescriptionPreview)}
                        className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
                      >
                        {epicDescriptionPreview ? (
                          <>
                            <Edit className="h-3 w-3" />
                            Edit
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />
                            Preview
                          </>
                        )}
                      </button>
                    </div>
                    {epicDescriptionPreview ? (
                      <div
                        className="input-field min-h-[32rem] overflow-y-auto"
                        style={{
                          padding: '0.75rem',
                          lineHeight: '1.6',
                        }}
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(epicDescription) }}
                      />
                    ) : (
                      <textarea
                        value={epicDescription}
                        onChange={(e) => {
                          setEpicDescription(e.target.value)
                          setHasChanges(true)
                        }}
                        rows={16}
                        className="input-field font-mono text-sm"
                      />
                    )}
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
                    <div className="flex items-center justify-between mb-3 border-b border-border-light pb-2">
                      <h3 className="text-base font-semibold text-text-primary">
                        Description
                      </h3>
                      <button
                        type="button"
                        onClick={() => setStoryDescriptionPreview(!storyDescriptionPreview)}
                        className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
                      >
                        {storyDescriptionPreview ? (
                          <>
                            <Edit className="h-3 w-3" />
                            Edit
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />
                            Preview
                          </>
                        )}
                      </button>
                    </div>
                    {storyDescriptionPreview ? (
                      <div
                        className="input-field min-h-[32rem] overflow-y-auto"
                        style={{
                          padding: '0.75rem',
                          lineHeight: '1.6',
                        }}
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(storyDescription) }}
                      />
                    ) : (
                      <textarea
                        value={storyDescription}
                        onChange={(e) => {
                          setStoryDescription(e.target.value)
                          setHasChanges(true)
                        }}
                        rows={16}
                        className="input-field font-mono text-sm"
                      />
                    )}
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
                </div>
              </Card>
            ) : null}
          </div>
          )}
        </div>
      </main>
    </div>
  )
}
