'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { FolderKanban, Plus, ArrowRight, LogOut } from 'lucide-react'
import type { Project } from '@/lib/types'

interface ProjectWithMetrics extends Project {
  _name?: string
  epicCount?: number
  managerName?: string
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  // New project modal state
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      // Redirect to home page
      router.push('/')
    } catch (err) {
      console.error('Logout failed:', err)
      setLoggingOut(false)
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreating(true)

    try {
      // Convert project name to folder name (kebab-case)
      const folderName = newProjectName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDescription.trim(),
          folderName,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Close modal and reset form
        setShowNewProjectModal(false)
        setNewProjectName('')
        setNewProjectDescription('')
        // Refresh projects list
        await fetchProjects()
      } else {
        setCreateError(result.error || 'Failed to create project')
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  function closeModal() {
    setShowNewProjectModal(false)
    setNewProjectName('')
    setNewProjectDescription('')
    setCreateError(null)
  }

  async function fetchProjects() {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching projects...')
      const response = await fetch('/api/projects')
      console.log('Response status:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Projects data:', result)

      if (result.success) {
        console.log('Setting projects:', result.data?.length || 0)

        // Fetch additional data for each project (epic count and manager name)
        const projectsWithMetrics = await Promise.all(
          result.data.map(async (project: any) => {
            const projectName = project._name || project.name

            // Fetch epics count
            let epicCount = 0
            try {
              const epicsResponse = await fetch(`/api/projects/${projectName}/epics`)
              const epicsResult = await epicsResponse.json()
              if (epicsResult.success) {
                epicCount = epicsResult.data?.length || 0
              }
            } catch (err) {
              console.error(`Failed to fetch epics for ${projectName}:`, err)
            }

            // Fetch manager name
            let managerName = 'unassigned'
            if (project.metadata?.manager && project.metadata.manager !== 'unassigned') {
              try {
                const peopleResponse = await fetch(`/api/projects/${projectName}/people`)
                const peopleResult = await peopleResponse.json()
                if (peopleResult.success) {
                  const manager = peopleResult.data?.find((p: any) => p.id === project.metadata.manager)
                  if (manager) {
                    managerName = manager.name
                  }
                }
              } catch (err) {
                console.error(`Failed to fetch people for ${projectName}:`, err)
              }
            }

            return {
              ...project,
              epicCount,
              managerName,
            }
          })
        )

        // Sort projects by createdAt (oldest first)
        const sortedProjects = projectsWithMetrics.sort((a: any, b: any) => {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return aDate - bDate
        })

        setProjects(sortedProjects)
      } else {
        setError(result.error || 'Failed to load projects')
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }

  // Convert project name from kebab-case to display name
  function formatProjectName(name: string): string {
    return name
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="min-h-screen bg-background-light">
      <Header />

      <main className="container py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-text-primary">
                Projects
              </h1>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
            <p className="text-text-secondary">
              Manage your projects, epics, and stories
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowNewProjectModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-text-secondary">Loading projects...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card p-6 bg-red-50 border-red-200">
            <p className="text-red-800">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={fetchProjects}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && projects.length === 0 && (
          <Card className="p-12 text-center">
            <FolderKanban className="h-16 w-16 text-text-secondary mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No projects yet
            </h3>
            <p className="text-text-secondary mb-6">
              Get started by creating your first project
            </p>
            <Button
              variant="primary"
              onClick={() => setShowNewProjectModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </Card>
        )}

        {/* Projects Grid */}
        {!loading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any, index) => {
              // Extract project name from the data structure
              // _name is the folder name, name is the display name
              const projectName = (project as any)._name || project.name || `project-${index}`
              const displayName = project.name || formatProjectName(projectName)
              const projectSlug = projectName.toLowerCase().replace(/\s+/g, '-')

              return (
                <Link
                  key={projectName}
                  href={`/projects/${projectSlug}`}
                  className="block"
                >
                  <Card className="p-6 card-hover h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <FolderKanban className="h-6 w-6" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-text-secondary" />
                    </div>

                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                      {displayName}
                    </h3>

                    <p className="text-text-secondary text-sm mb-4 flex-grow">
                      {project.description || 'No description'}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-border-light">
                      <div className="text-sm text-text-secondary">
                        <span className="font-medium">
                          {project.epicCount || 0}
                        </span>{' '}
                        {project.epicCount === 1 ? 'epic' : 'epics'}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {project.managerName || 'unassigned'}
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

        {/* New Project Modal */}
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  Create New Project
                </h2>

                <form onSubmit={handleCreateProject}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Project Name *
                      </label>
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., Healthcare Platform"
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Description
                      </label>
                      <textarea
                        value={newProjectDescription}
                        onChange={(e) => setNewProjectDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Brief description of the project"
                        rows={3}
                      />
                    </div>

                    {createError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{createError}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        variant="primary"
                        className="flex-1"
                        disabled={creating || !newProjectName.trim()}
                      >
                        {creating ? 'Creating...' : 'Create Project'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeModal}
                        disabled={creating}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

