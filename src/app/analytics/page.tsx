'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { Card } from '@/components/Card'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Target,
  Users,
  Calendar,
  Zap,
  Activity,
  BarChart3,
  Info,
  X,
  Server,
  GitCommit,
  Bug,
} from 'lucide-react'

interface Project {
  name: string
  _name?: string // Folder name (used for API calls)
  description: string
  metadata?: {
    manager?: string
    contributors?: string[]
  }
}

interface Epic {
  _name: string
  title: string
  status: string
  priority: string
  manager: string
  metrics?: {
    totalStoryPoints: number
    completedStoryPoints: number
  }
  stories: Story[]
}

interface Story {
  id: string
  title: string
  status: string
  priority: string
  manager: string
  dueDate?: string
  estimate?: {
    storyPoints?: number
  }
  createdAt: string
  updatedAt: string
  epicName?: string // Epic name for navigation
}

interface TeamMemberMetrics {
  personId: string
  name: string
  designation: string
  storyPointsCovered: number
  storiesCompleted: number
  storiesInProgress: number
  commits: number
  bugsResolved: number
  averageStoryCompletionTime: number // in days
}

interface ProjectAnalytics {
  project: Project
  epics: Epic[]
  totalStories: number
  totalStoryPoints: number
  completedStoryPoints: number
  completionPercentage: number
  velocity: number
  burnRate: number
  criticalCount: number
  blockedCount: number
  overdueCount: number
  todoCount: number
  inProgressCount: number
  doneCount: number
  topRiskyStories: Story[]
  averageStoryAge: number
  epicProgress: Array<{
    name: string
    title: string
    completion: number
    stories: number
    points: number
  }>
  teamMetrics: TeamMemberMetrics[]
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface ProjectInfo {
  id: string // Folder name (used for API calls)
  name: string // Display name from project.json
}

export default function AnalyticsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectFromUrl = searchParams.get('project')

  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [activeTab, setActiveTab] = useState<string>('')
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [openTooltip, setOpenTooltip] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (projects.length > 0 && !activeTab) {
      if (projectFromUrl) {
        // URL has project param - find matching project by id
        const matchingProject = projects.find(p => p.id === projectFromUrl)
        if (matchingProject) {
          setActiveTab(matchingProject.id)
        } else {
          // Project not found, use first project
          setActiveTab(projects[0].id)
        }
      } else {
        // No active tab set yet, use first project
        setActiveTab(projects[0].id)
      }
    }
  }, [projects, projectFromUrl, activeTab])

  useEffect(() => {
    if (activeTab) {
      fetchProjectAnalytics(activeTab)
    }
  }, [activeTab])

  // Close tooltips when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      // Check if click is on the tooltip popup itself or the info button
      const isTooltipPopup = target.closest('[data-tooltip-popup]')
      const isInfoButton = target.closest('button[data-info-button]')
      // If clicking on neither the popup nor the button, close the tooltip
      if (!isTooltipPopup && !isInfoButton) {
        setOpenTooltip(null)
      }
    }
    if (openTooltip) {
      // Use a small delay to avoid closing immediately when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 10)
      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [openTooltip])

  async function fetchProjects() {
    try {
      const response = await fetch('/api/projects')
      const result = await response.json()

      if (result.success && result.data.length > 0) {
        // Store both folder name (id) and display name
        const projectList: ProjectInfo[] = result.data.map((p: Project) => ({
          id: p._name || p.name, // Folder name for API calls
          name: p.name, // Display name from project.json
        }))
        setProjects(projectList)
        // Set active tab from URL or first project
        const initialProjectId = projectFromUrl && projectList.find(p => p.id === projectFromUrl)
          ? projectFromUrl
          : projectList[0]?.id || ''
        setActiveTab(initialProjectId)
      }
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchProjectAnalytics(projectName: string) {
    try {
      setLoading(true)

      // Fetch project data
      const projectResponse = await fetch(`/api/projects/${projectName}`)
      const projectResult = await projectResponse.json()

      if (!projectResult.success) {
        setLoading(false)
        return
      }

      const project = projectResult.data

      // Fetch epics with stories
      const epicsResponse = await fetch(`/api/projects/${projectName}/epics`)
      const epicsResult = await epicsResponse.json()

      if (!epicsResult.success) {
        setLoading(false)
        return
      }

      const epics: Epic[] = await Promise.all(
        epicsResult.data.map(async (epic: Epic) => {
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

      // Calculate analytics
      const allStories = epics.flatMap((epic) => epic.stories)
      const totalStories = allStories.length
      const totalStoryPoints = allStories.reduce(
        (sum, story) => sum + (story.estimate?.storyPoints || 0),
        0
      )
      const completedStories = allStories.filter((s) => s.status === 'done')
      const completedStoryPoints = completedStories.reduce(
        (sum, story) => sum + (story.estimate?.storyPoints || 0),
        0
      )
      const completionPercentage =
        totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0

      // Status breakdown
      const todoCount = allStories.filter((s) => s.status === 'todo').length
      const inProgressCount = allStories.filter((s) => s.status === 'in_progress').length
      const blockedCount = allStories.filter((s) => s.status === 'blocked').length
      const doneCount = allStories.filter((s) => s.status === 'done').length

      // Critical stories
      const criticalCount = allStories.filter(
        (s) => s.priority === 'critical' && s.status !== 'done'
      ).length

      // Overdue stories
      const now = new Date()
      const overdueCount = allStories.filter(
        (s) => s.dueDate && new Date(s.dueDate) < now && s.status !== 'done'
      ).length

      // Velocity (completed story points in last 2 weeks)
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
      const recentCompletedStories = completedStories.filter(
        (s) => new Date(s.updatedAt) >= twoWeeksAgo
      )
      const velocity = recentCompletedStories.reduce(
        (sum, story) => sum + (story.estimate?.storyPoints || 0),
        0
      )

      // Burn rate (story points per day)
      let burnRate = 0
      if (allStories.length > 0) {
        const projectStartDate = new Date(
          Math.min(...allStories.map((s) => new Date(s.createdAt).getTime()))
        )
        const daysSinceStart = Math.max(
          1,
          Math.floor((Date.now() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24))
        )
        burnRate = parseFloat((completedStoryPoints / daysSinceStart).toFixed(2))
      }

      // Top 5 risky stories (blocked, critical, or overdue)
      // First, create a map of story ID to epic name
      const storyToEpicMap = new Map<string, string>()
      epics.forEach((epic) => {
        epic.stories.forEach((story) => {
          storyToEpicMap.set(story.id, epic._name)
        })
      })

      const riskyStories = allStories
        .filter((s) => s.status !== 'done')
        .map((story) => {
          let riskScore = 0
          if (story.status === 'blocked') riskScore += 50
          if (story.priority === 'critical') riskScore += 30
          if (story.priority === 'high') riskScore += 20
          if (story.dueDate && new Date(story.dueDate) < now) riskScore += 40
          const ageInDays = Math.floor(
            (now.getTime() - new Date(story.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          )
          if (ageInDays > 30) riskScore += 10
          return { ...story, riskScore, epicName: storyToEpicMap.get(story.id) }
        })
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 5)

      // Average story age
      const averageStoryAge =
        totalStories > 0
          ? Math.floor(
              allStories.reduce((sum, story) => {
                const ageInDays = Math.floor(
                  (now.getTime() - new Date(story.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                )
                return sum + ageInDays
              }, 0) / totalStories
            )
          : 0

      // Epic progress
      const epicProgress = epics.map((epic) => {
        const epicStories = epic.stories
        const epicPoints = epicStories.reduce(
          (sum, s) => sum + (s.estimate?.storyPoints || 0),
          0
        )
        const epicCompletedPoints = epicStories
          .filter((s) => s.status === 'done')
          .reduce((sum, s) => sum + (s.estimate?.storyPoints || 0), 0)
        const completion = epicPoints > 0 ? Math.round((epicCompletedPoints / epicPoints) * 100) : 0

        return {
          name: epic._name,
          title: epic.title,
          completion,
          stories: epicStories.length,
          points: epicPoints,
        }
      })

      // Team member metrics
      // Fetch people for this project
      let people: Array<{ id: string; name: string; email: string; designation: string; roleInProject: string }> = []
      try {
        const peopleResponse = await fetch(`/api/projects/${projectName}/people`)
        const peopleResult = await peopleResponse.json()
        if (peopleResult.success) {
          people = peopleResult.data || []
        }
      } catch (err) {
        console.error('Failed to load people:', err)
      }

      // Calculate metrics for each contributor
      const teamMetrics: TeamMemberMetrics[] = people
        .filter((person) => {
          // Include manager and contributors
          return (
            project.metadata?.manager === person.id ||
            project.metadata?.contributors?.includes(person.id)
          )
        })
        .map((person) => {
          const personStories = allStories.filter((s) => s.manager === person.id)
          const completedStories = personStories.filter((s) => s.status === 'done')
          const inProgressStories = personStories.filter((s) => s.status === 'in_progress')

          const storyPointsCovered = completedStories.reduce(
            (sum, s) => sum + (s.estimate?.storyPoints || 0),
            0
          )

          // Calculate average completion time for completed stories
          let averageCompletionTime = 0
          if (completedStories.length > 0) {
            const totalDays = completedStories.reduce((sum, story) => {
              const created = new Date(story.createdAt)
              const updated = new Date(story.updatedAt)
              const days = Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
              return sum + days
            }, 0)
            averageCompletionTime = Math.round(totalDays / completedStories.length)
          }

          // Mock data for commits and bugs (in real implementation, this would come from Git/issue tracker)
          // Using story points and completion as basis for realistic mock data
          const commits = Math.round(storyPointsCovered * 2.5 + Math.random() * 10)
          const bugsResolved = Math.round(storyPointsCovered * 0.3 + Math.random() * 5)

          return {
            personId: person.id,
            name: person.name,
            designation: person.designation,
            storyPointsCovered,
            storiesCompleted: completedStories.length,
            storiesInProgress: inProgressStories.length,
            commits,
            bugsResolved,
            averageStoryCompletionTime: averageCompletionTime,
          }
        })
        .sort((a, b) => b.storyPointsCovered - a.storyPointsCovered) // Sort by story points descending

      setAnalytics({
        project,
        epics,
        totalStories,
        totalStoryPoints,
        completedStoryPoints,
        completionPercentage,
        velocity,
        burnRate,
        criticalCount,
        blockedCount,
        overdueCount,
        todoCount,
        inProgressCount,
        doneCount,
        topRiskyStories: riskyStories,
        averageStoryAge,
        epicProgress,
        teamMetrics,
      })
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Helper function to get environment data (mock data for now)
  function getEnvironmentData(env: 'dev' | 'staging' | 'prod') {
    // In a real implementation, this would fetch from project metadata or API
    const mockData = {
      dev: {
        lastDeployed: '2 hours ago',
        testCoverage: 85,
        health: 'Healthy',
      },
      staging: {
        lastDeployed: '1 day ago',
        testCoverage: 92,
        health: 'Healthy',
      },
      prod: {
        lastDeployed: '3 days ago',
        testCoverage: 88,
        health: 'Degraded',
      },
    }
    return mockData[env]
  }

  function getCoverageColor(coverage: number): string {
    if (coverage >= 90) return 'text-green-600'
    if (coverage >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  function getHealthColor(health: string): string {
    switch (health.toLowerCase()) {
      case 'healthy':
        return 'text-green-600'
      case 'degraded':
        return 'text-yellow-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  function getHealthDotColor(health: string): string {
    switch (health.toLowerCase()) {
      case 'healthy':
        return 'bg-green-500'
      case 'degraded':
        return 'bg-yellow-500'
      case 'down':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const metricTooltips: Record<string, string> = {
    completion: 'Percentage of completed story points out of total story points. Shows overall project progress.',
    velocity: 'Total story points completed in the last 2 weeks. Indicates team productivity and delivery speed.',
    burnRate: 'Average story points completed per day since project start. Helps estimate completion timeline.',
    critical: 'Number of high-priority (critical) items that are not yet completed. Requires immediate attention.',
    blocked: 'Number of stories currently blocked and unable to progress. May indicate dependencies or issues.',
    overdue: 'Number of stories past their due date that are not yet completed. Indicates schedule risks.',
    statusDistribution: 'Breakdown of all stories by their current status. Helps visualize work distribution.',
    epicProgress: 'Completion percentage for each epic based on story points. Shows progress across different work areas.',
    riskyStories: 'Stories with highest risk scores based on status (blocked), priority (critical/high), overdue status, and age.',
    environmentStatus: 'Current status of deployment environments. Shows last deployment time, test coverage percentage, and application health status.',
    teamMetrics: 'Performance metrics for each team member including story points completed, stories finished, commits, bugs resolved, and average story completion time.',
  }

  function MetricCard({
    id,
    icon: Icon,
    title,
    value,
    unit,
    description,
    progress,
    progressColor = 'bg-green-500',
    badge,
    badgeColor,
    iconColor,
  }: {
    id: string
    icon: any
    title: string
    value: string | number
    unit?: string
    description: string
    progress?: number
    progressColor?: string
    badge?: string
    badgeColor?: string
    iconColor?: string
  }) {
    return (
      <Card className="p-3 relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Icon className={`h-3.5 w-3.5 ${iconColor || 'text-green-600'}`} />
            <h3 className="text-xs font-semibold text-text-primary">{title}</h3>
          </div>
          <div className="flex items-center gap-1">
            {badge && (
              <span className={`px-1.5 py-0.5 ${badgeColor || 'bg-red-100 text-red-800'} text-[10px] font-medium rounded`}>
                {badge}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setOpenTooltip(openTooltip === id ? null : id)
              }}
              className="relative"
              data-info-button
            >
              <Info className="h-3 w-3 text-text-secondary hover:text-primary transition-colors" />
              {openTooltip === id && (
                <div
                  className="absolute right-0 top-6 z-50 w-64 p-3 bg-white border border-border-light rounded-lg shadow-lg"
                  data-tooltip-popup
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-xs font-semibold text-text-primary">{title}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenTooltip(null)
                      }}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {metricTooltips[id] || description}
                  </p>
                </div>
              )}
            </button>
          </div>
        </div>
        <div className="flex items-baseline gap-1 mb-1.5">
          <span className="text-2xl font-bold text-text-primary">{value}</span>
          {unit && <span className="text-xs text-text-secondary">{unit}</span>}
        </div>
        <p className="text-xs text-text-secondary mb-2">{description}</p>
        {progress !== undefined && (
          <div className="bg-gray-200 rounded-full h-1">
            <div
              className={`${progressColor} h-1 rounded-full transition-all`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background-light">
      <Header />

      <main className="container py-4">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-text-primary">Project Analytics</h1>
            <span className="text-text-secondary text-sm">|</span>
            <p className="text-xs text-text-secondary">
              Real-time insights and metrics
            </p>
          </div>
        </div>

        {loading && projects.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-text-secondary">Loading analytics...</p>
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-6 text-center">
            <Target className="h-8 w-8 text-text-secondary mx-auto mb-2 opacity-50" />
            <p className="text-sm text-text-secondary">No projects yet. Create a project to view analytics.</p>
          </Card>
        ) : (
          <>
            {/* Project Tabs */}
            <div className="mb-4 border-b border-border-light">
              <div className="flex gap-2 overflow-x-auto">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setActiveTab(project.id)
                      router.push(`/analytics?project=${encodeURIComponent(project.id)}`)
                    }}
                    className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === project.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-light'
                    }`}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Analytics Content */}
            {loading ? (
              <div className="text-center py-6">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <p className="mt-2 text-sm text-text-secondary">Loading project analytics...</p>
              </div>
            ) : analytics ? (
              <div className="space-y-4">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Completion */}
                  <MetricCard
                    id="completion"
                    icon={CheckCircle2}
                    title="Completion"
                    value={`${analytics.completionPercentage}%`}
                    description={`${analytics.completedStoryPoints}/${analytics.totalStoryPoints} pts`}
                    progress={analytics.completionPercentage}
                    progressColor="bg-green-500"
                  />

                  {/* Velocity */}
                  <MetricCard
                    id="velocity"
                    icon={Zap}
                    title="Velocity"
                    value={analytics.velocity}
                    unit="pts"
                    description="Last 2 weeks"
                    iconColor="text-blue-600"
                  />

                  {/* Burn Rate */}
                  <MetricCard
                    id="burnRate"
                    icon={Activity}
                    title="Burn Rate"
                    value={analytics.burnRate}
                    unit="pts/day"
                    description="Avg completion"
                    iconColor="text-purple-600"
                  />

                  {/* Critical Items */}
                  <MetricCard
                    id="critical"
                    icon={AlertTriangle}
                    title="Critical"
                    value={analytics.criticalCount}
                    unit="items"
                    description="High priority"
                    badge={analytics.criticalCount > 0 ? 'Action' : undefined}
                    badgeColor="bg-red-100 text-red-800"
                    iconColor="text-red-600"
                  />

                  {/* Blocked Items */}
                  <MetricCard
                    id="blocked"
                    icon={AlertTriangle}
                    title="Blocked"
                    value={analytics.blockedCount}
                    unit="items"
                    description="Cannot progress"
                    badge={analytics.blockedCount > 0 ? 'Issue' : undefined}
                    badgeColor="bg-orange-100 text-orange-800"
                    iconColor="text-orange-600"
                  />

                  {/* Overdue Stories */}
                  <MetricCard
                    id="overdue"
                    icon={Clock}
                    title="Overdue"
                    value={analytics.overdueCount}
                    unit="stories"
                    description="Past due date"
                    badge={analytics.overdueCount > 0 ? 'Late' : undefined}
                    badgeColor="bg-red-100 text-red-800"
                    iconColor="text-red-600"
                  />
                </div>

                {/* Status Distribution & Epic Progress */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Status Distribution */}
                  <Card className="p-4 relative">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-text-primary">Status Distribution</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenTooltip(openTooltip === 'statusDistribution' ? null : 'statusDistribution')
                        }}
                        className="relative"
                        data-info-button
                      >
                        <Info className="h-3.5 w-3.5 text-text-secondary hover:text-primary transition-colors" />
                        {openTooltip === 'statusDistribution' && (
                          <div
                            className="absolute right-0 top-6 z-50 w-64 p-3 bg-white border border-border-light rounded-lg shadow-lg"
                            data-tooltip-popup
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-xs font-semibold text-text-primary">Status Distribution</h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenTooltip(null)
                                }}
                                className="text-text-secondary hover:text-text-primary"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed">
                              {metricTooltips.statusDistribution}
                            </p>
                          </div>
                        )}
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Circle className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-text-secondary">To Do</span>
                          </div>
                          <span className="text-xs font-medium text-text-primary">{analytics.todoCount}</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-gray-400 h-1 rounded-full transition-all"
                            style={{
                              width: `${analytics.totalStories > 0 ? (analytics.todoCount / analytics.totalStories) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                            <span className="text-xs text-text-secondary">In Progress</span>
                          </div>
                          <span className="text-xs font-medium text-text-primary">{analytics.inProgressCount}</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full transition-all"
                            style={{
                              width: `${analytics.totalStories > 0 ? (analytics.inProgressCount / analytics.totalStories) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-text-secondary">Blocked</span>
                          </div>
                          <span className="text-xs font-medium text-text-primary">{analytics.blockedCount}</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-red-500 h-1 rounded-full transition-all"
                            style={{
                              width: `${analytics.totalStories > 0 ? (analytics.blockedCount / analytics.totalStories) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-text-secondary">Done</span>
                          </div>
                          <span className="text-xs font-medium text-text-primary">{analytics.doneCount}</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-green-500 h-1 rounded-full transition-all"
                            style={{
                              width: `${analytics.totalStories > 0 ? (analytics.doneCount / analytics.totalStories) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border-light">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary">Total Stories</span>
                        <span className="font-semibold text-text-primary">{analytics.totalStories}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Epic Progress */}
                  <Card className="p-4 relative">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-text-primary">Epic Progress</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenTooltip(openTooltip === 'epicProgress' ? null : 'epicProgress')
                        }}
                        className="relative"
                        data-info-button
                      >
                        <Info className="h-3.5 w-3.5 text-text-secondary hover:text-primary transition-colors" />
                        {openTooltip === 'epicProgress' && (
                          <div
                            className="absolute right-0 top-6 z-50 w-64 p-3 bg-white border border-border-light rounded-lg shadow-lg"
                            data-tooltip-popup
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-xs font-semibold text-text-primary">Epic Progress</h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenTooltip(null)
                                }}
                                className="text-text-secondary hover:text-text-primary"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed">
                              {metricTooltips.epicProgress}
                            </p>
                          </div>
                        )}
                      </button>
                    </div>
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {analytics.epicProgress.map((epic) => (
                        <div key={epic.name}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-text-primary truncate">{epic.title}</p>
                              <p className="text-[10px] text-text-secondary">
                                {epic.stories} stories · {epic.points} pts
                              </p>
                            </div>
                            <span className="text-xs font-medium text-text-primary ml-2">{epic.completion}%</span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full transition-all ${
                                epic.completion === 100
                                  ? 'bg-green-500'
                                  : epic.completion >= 50
                                  ? 'bg-blue-500'
                                  : 'bg-yellow-500'
                              }`}
                              style={{ width: `${epic.completion}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Team Member Metrics */}
                <Card className="p-4 relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                      <h3 className="text-sm font-semibold text-text-primary">Team Member Performance</h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenTooltip(openTooltip === 'teamMetrics' ? null : 'teamMetrics')
                      }}
                      className="relative"
                      data-info-button
                    >
                      <Info className="h-3.5 w-3.5 text-text-secondary hover:text-primary transition-colors" />
                      {openTooltip === 'teamMetrics' && (
                        <div
                          className="absolute right-0 top-6 z-50 w-64 p-3 bg-white border border-border-light rounded-lg shadow-lg"
                          data-tooltip-popup
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-xs font-semibold text-text-primary">Team Member Performance</h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenTooltip(null)
                              }}
                              className="text-text-secondary hover:text-text-primary"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed">
                            {metricTooltips.teamMetrics}
                          </p>
                        </div>
                      )}
                    </button>
                  </div>
                  {analytics.teamMetrics.length === 0 ? (
                    <p className="text-xs text-text-secondary text-center py-4">
                      No team members found. Add contributors to the project to see metrics.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border-light">
                            <th className="text-left py-2 px-3 font-semibold text-text-primary">Team Member</th>
                            <th className="text-left py-2 px-3 font-semibold text-text-primary">Designation</th>
                            <th className="text-right py-2 px-3 font-semibold text-text-primary">Story Points</th>
                            <th className="text-right py-2 px-3 font-semibold text-text-primary">Stories Done</th>
                            <th className="text-right py-2 px-3 font-semibold text-text-primary">In Progress</th>
                            <th className="text-right py-2 px-3 font-semibold text-text-primary">Commits</th>
                            <th className="text-right py-2 px-3 font-semibold text-text-primary">Bugs Resolved</th>
                            <th className="text-right py-2 px-3 font-semibold text-text-primary">Avg Completion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.teamMetrics.map((member) => (
                            <tr key={member.personId} className="border-b border-border-light hover:bg-surface-hover transition-colors">
                              <td className="py-2.5 px-3">
                                <span className="font-medium text-text-primary">{member.name}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="text-text-secondary">{member.designation}</span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className="font-semibold text-text-primary">{member.storyPointsCovered}</span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className="text-text-primary">{member.storiesCompleted}</span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className="text-blue-600">{member.storiesInProgress}</span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <GitCommit className="h-3 w-3 text-text-secondary" />
                                  <span className="text-text-primary">{member.commits}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Bug className="h-3 w-3 text-green-600" />
                                  <span className="text-text-primary">{member.bugsResolved}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className="text-text-secondary">
                                  {member.averageStoryCompletionTime > 0
                                    ? `${member.averageStoryCompletionTime}d`
                                    : '-'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

                {/* Top Risky Stories & Environment Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Top 5 Risky Stories */}
                  <Card className="p-3 relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                        <h3 className="text-xs font-semibold text-text-primary">Top 5 Stories at Risk</h3>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenTooltip(openTooltip === 'riskyStories' ? null : 'riskyStories')
                        }}
                        className="relative"
                        data-info-button
                      >
                        <Info className="h-3 w-3 text-text-secondary hover:text-primary transition-colors" />
                        {openTooltip === 'riskyStories' && (
                          <div
                            className="absolute right-0 top-6 z-50 w-64 p-3 bg-white border border-border-light rounded-lg shadow-lg"
                            data-tooltip-popup
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-xs font-semibold text-text-primary">Top 5 Stories at Risk</h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenTooltip(null)
                                }}
                                className="text-text-secondary hover:text-text-primary"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed">
                              {metricTooltips.riskyStories}
                            </p>
                          </div>
                        )}
                      </button>
                    </div>
                    {analytics.topRiskyStories.length === 0 ? (
                      <p className="text-xs text-text-secondary text-center py-3">
                        No stories at risk. Great work! 🎉
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {analytics.topRiskyStories.map((story) => {
                          const handleStoryClick = () => {
                            if (story.epicName) {
                              router.push(
                                `/projects/${activeTab}?epic=${encodeURIComponent(story.epicName)}&story=${encodeURIComponent(story.id)}`
                              )
                            }
                          }
                          return (
                            <div
                              key={story.id}
                              onClick={handleStoryClick}
                              className="border border-border-light rounded p-2 hover:bg-surface-hover transition-colors cursor-pointer"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-medium text-text-primary mb-1.5 truncate hover:text-primary transition-colors">
                                    {story.title.startsWith(`[${story.id}]`) ? story.title : `[${story.id}] ${story.title}`}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span
                                      className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${getStatusColor(
                                        story.status
                                      )}`}
                                    >
                                      {story.status.replace('_', ' ')}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${getPriorityColor(
                                        story.priority
                                      )}`}
                                    >
                                      {story.priority}
                                    </span>
                                    {story.dueDate && new Date(story.dueDate) < new Date() && (
                                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded border bg-red-100 text-red-800 border-red-200">
                                        Overdue
                                      </span>
                                    )}
                                    <span className="text-[10px] text-text-secondary">
                                      {story.estimate?.storyPoints || 0} pts
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </Card>

                  {/* Environment Status */}
                  <Card className="p-3 relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Server className="h-3.5 w-3.5 text-blue-600" />
                        <h3 className="text-xs font-semibold text-text-primary">Environment Status</h3>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenTooltip(openTooltip === 'environmentStatus' ? null : 'environmentStatus')
                        }}
                        className="relative"
                        data-info-button
                      >
                        <Info className="h-3 w-3 text-text-secondary hover:text-primary transition-colors" />
                        {openTooltip === 'environmentStatus' && (
                          <div
                            className="absolute right-0 top-6 z-50 w-64 p-3 bg-white border border-border-light rounded-lg shadow-lg"
                            data-tooltip-popup
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-xs font-semibold text-text-primary">Environment Status</h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenTooltip(null)
                                }}
                                className="text-text-secondary hover:text-text-primary"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed">
                              {metricTooltips.environmentStatus}
                            </p>
                          </div>
                        )}
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border-light">
                            <th className="text-left py-2 px-2 font-semibold text-text-primary">Environment</th>
                            <th className="text-left py-2 px-2 font-semibold text-text-primary">Last Deployed</th>
                            <th className="text-left py-2 px-2 font-semibold text-text-primary">Test Coverage</th>
                            <th className="text-left py-2 px-2 font-semibold text-text-primary">Health</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border-light">
                            <td className="py-2 px-2">
                              <span className="font-medium text-text-primary">Dev</span>
                            </td>
                            <td className="py-2 px-2 text-text-secondary">
                              {getEnvironmentData('dev').lastDeployed}
                            </td>
                            <td className="py-2 px-2">
                              <span className={`font-medium ${getCoverageColor(getEnvironmentData('dev').testCoverage)}`}>
                                {getEnvironmentData('dev').testCoverage}%
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <span className="inline-flex items-center gap-1.5">
                                <div className={`h-2 w-2 rounded-full ${getHealthDotColor(getEnvironmentData('dev').health)}`}></div>
                                <span className={getHealthColor(getEnvironmentData('dev').health)}>
                                  {getEnvironmentData('dev').health}
                                </span>
                              </span>
                            </td>
                          </tr>
                          <tr className="border-b border-border-light">
                            <td className="py-2 px-2">
                              <span className="font-medium text-text-primary">Staging</span>
                            </td>
                            <td className="py-2 px-2 text-text-secondary">
                              {getEnvironmentData('staging').lastDeployed}
                            </td>
                            <td className="py-2 px-2">
                              <span className={`font-medium ${getCoverageColor(getEnvironmentData('staging').testCoverage)}`}>
                                {getEnvironmentData('staging').testCoverage}%
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <span className="inline-flex items-center gap-1.5">
                                <div className={`h-2 w-2 rounded-full ${getHealthDotColor(getEnvironmentData('staging').health)}`}></div>
                                <span className={getHealthColor(getEnvironmentData('staging').health)}>
                                  {getEnvironmentData('staging').health}
                                </span>
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2">
                              <span className="font-medium text-text-primary">Prod</span>
                            </td>
                            <td className="py-2 px-2 text-text-secondary">
                              {getEnvironmentData('prod').lastDeployed}
                            </td>
                            <td className="py-2 px-2">
                              <span className={`font-medium ${getCoverageColor(getEnvironmentData('prod').testCoverage)}`}>
                                {getEnvironmentData('prod').testCoverage}%
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <span className="inline-flex items-center gap-1.5">
                                <div className={`h-2 w-2 rounded-full ${getHealthDotColor(getEnvironmentData('prod').health)}`}></div>
                                <span className={getHealthColor(getEnvironmentData('prod').health)}>
                                  {getEnvironmentData('prod').health}
                                </span>
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}

