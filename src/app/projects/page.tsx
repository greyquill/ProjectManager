'use client'

import { useEffect, useState } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { FolderKanban, Plus, ArrowRight } from 'lucide-react'
import type { Project } from '@/lib/types'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        setProjects(result.data || [])
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
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Projects
            </h1>
            <p className="text-text-secondary">
              Manage your projects, epics, and stories
            </p>
          </div>
          <Button variant="primary" size="lg">
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
            <Button variant="primary">
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
                          {project.epicIds?.length || 0}
                        </span>{' '}
                        {project.epicIds?.length === 1 ? 'epic' : 'epics'}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {project.metadata?.manager || 'unassigned'}
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

