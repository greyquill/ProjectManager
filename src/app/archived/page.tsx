'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import {
  FileText,
  RotateCcw,
  User,
  Tag,
  CheckCircle2,
  Circle,
  AlertCircle,
  Archive,
} from 'lucide-react'
import type { Story, Person } from '@/lib/types'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

type ArchivedStory = {
  projectName: string
  epicName: string
  story: Story
}

export default function ArchivedPage() {
  const router = useRouter()
  const [archivedStories, setArchivedStories] = useState<ArchivedStory[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStory, setSelectedStory] = useState<ArchivedStory | null>(null)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    fetchArchivedStories()
    fetchPeople()
  }, [])

  const fetchArchivedStories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/archived')
      const result = await response.json()

      if (result.success) {
        setArchivedStories(result.data || [])
      } else {
        setError(result.error || 'Failed to load archived stories')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load archived stories')
    } finally {
      setLoading(false)
    }
  }

  const fetchPeople = async () => {
    try {
      const response = await fetch('/api/people')
      const result = await response.json()

      if (result.success) {
        setPeople(result.data || [])
      }
    } catch (err) {
      console.error('Failed to load people:', err)
    }
  }

  const handleRestore = async (story: ArchivedStory) => {
    setRestoring(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/projects/${story.projectName}/epics/${story.epicName}/stories/${story.story.id}/restore`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const result = await response.json()

      if (result.success) {
        // Remove from archived list
        setArchivedStories(prev => prev.filter(s =>
          s.projectName !== story.projectName ||
          s.epicName !== story.epicName ||
          s.story.id !== story.story.id
        ))
        // Clear selection if it was the restored story
        if (selectedStory?.story.id === story.story.id) {
          setSelectedStory(null)
        }
      } else {
        setError(result.error || 'Failed to restore story')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore story')
    } finally {
      setRestoring(false)
    }
  }

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'border-green-500'
      case 'in_progress':
        return 'border-blue-500'
      case 'blocked':
        return 'border-red-500'
      default:
        return 'border-gray-400'
    }
  }

  const formatStoryTitle = (storyId: string, title: string): string => {
    const prefix = `[${storyId}]`
    if (!title.startsWith(prefix)) {
      return `${prefix} ${title}`
    }
    return title
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light">
        <Header />
        <main className="container py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-text-secondary">Loading archived stories...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light">
      <Header />
      <main className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Archived Stories</h1>
          <p className="text-sm text-text-secondary mt-1">
            View and restore archived stories
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Left: Story List */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Archived Stories ({archivedStories.length})
              </h2>
              {archivedStories.length === 0 ? (
                <div className="text-center py-8">
                  <Archive className="h-12 w-12 text-text-secondary mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-text-secondary">No archived stories</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {archivedStories.map((archivedStory) => {
                    const isSelected = selectedStory?.story.id === archivedStory.story.id
                    const statusColor = getStatusColor(archivedStory.story.status)

                    return (
                      <div
                        key={`${archivedStory.projectName}-${archivedStory.epicName}-${archivedStory.story.id}`}
                        className={`p-3 rounded-lg border-l-4 cursor-pointer hover:bg-surface-muted transition-colors ${
                          isSelected ? 'bg-primary/5 ring-2 ring-primary' : ''
                        } ${statusColor}`}
                        onClick={() => setSelectedStory(archivedStory)}
                      >
                        <div className="flex items-start gap-2">
                          {getStatusIcon(archivedStory.story.status)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-text-primary text-sm truncate">
                              {formatStoryTitle(archivedStory.story.id, archivedStory.story.title)}
                            </div>
                            <div className="text-xs text-text-secondary mt-1">
                              {archivedStory.projectName} / {archivedStory.epicName}
                            </div>
                            {archivedStory.story.manager && archivedStory.story.manager !== 'unassigned' && (
                              <div className="flex items-center gap-1 mt-1">
                                <User className="h-3 w-3 text-text-secondary" />
                                <span className="text-xs text-text-secondary">
                                  {people.find(p => p.id === archivedStory.story.manager)?.name || archivedStory.story.manager}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right: Story Detail */}
          <div className="lg:col-span-2">
            {selectedStory ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1">
                    <div className="text-sm text-text-secondary mb-2">
                      {selectedStory.projectName} / {selectedStory.epicName} / {selectedStory.story.id}
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary">
                      {formatStoryTitle(selectedStory.story.id, selectedStory.story.title)}
                    </h2>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => handleRestore(selectedStory)}
                    isLoading={restoring}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Summary */}
                  {selectedStory.story.summary && (
                    <div className="pt-2">
                      <h3 className="text-base font-semibold text-text-primary mb-3 border-b border-border-light pb-2">
                        Summary
                      </h3>
                      <p className="text-text-secondary">{selectedStory.story.summary}</p>
                    </div>
                  )}

                  {/* Metadata Table */}
                  <div className="border border-border-light rounded-lg overflow-hidden">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-border-light">
                          <td className="px-4 py-2 bg-surface-muted text-sm font-medium text-text-primary w-1/3">
                            Status
                          </td>
                          <td className="px-4 py-2">
                            <Badge status={selectedStory.story.status as any} />
                          </td>
                        </tr>
                        <tr className="border-b border-border-light">
                          <td className="px-4 py-2 bg-surface-muted text-sm font-medium text-text-primary">
                            Priority
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm capitalize">{selectedStory.story.priority}</span>
                          </td>
                        </tr>
                        <tr className="border-b border-border-light">
                          <td className="px-4 py-2 bg-surface-muted text-sm font-medium text-text-primary">
                            Manager
                          </td>
                          <td className="px-4 py-2">
                            {selectedStory.story.manager && selectedStory.story.manager !== 'unassigned' ? (
                              <span className="text-sm">
                                {people.find(p => p.id === selectedStory.story.manager)?.name || selectedStory.story.manager}
                              </span>
                            ) : (
                              <span className="text-sm text-text-secondary">Unassigned</span>
                            )}
                          </td>
                        </tr>
                        {selectedStory.story.estimate?.storyPoints > 0 && (
                          <tr>
                            <td className="px-4 py-2 bg-surface-muted text-sm font-medium text-text-primary">
                              Story Points
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm">{selectedStory.story.estimate.storyPoints}</span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Description */}
                  {selectedStory.story.description && (
                    <div className="pt-2">
                      <h3 className="text-base font-semibold text-text-primary mb-3 border-b border-border-light pb-2">
                        Description
                      </h3>
                      <div className="border border-border-light rounded-lg overflow-hidden">
                        <div
                          className="p-4 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: selectedStory.story.description
                              .split('\n')
                              .map(line => {
                                if (line.trim().startsWith('#')) {
                                  const level = line.match(/^#+/)?.[0].length || 1
                                  const text = line.replace(/^#+\s*/, '')
                                  return `<h${level} style="font-size: ${1.5 - (level - 1) * 0.2}rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">${text}</h${level}>`
                                }
                                if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                                  return `<li style="margin-left: 1.5rem; margin-bottom: 0.25rem;">${line.replace(/^[-*]\s+/, '')}</li>`
                                }
                                if (line.trim() === '') {
                                  return '<br />'
                                }
                                return `<p style="margin-bottom: 0.75rem;">${line}</p>`
                              })
                              .join(''),
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Acceptance Criteria */}
                  {selectedStory.story.acceptanceCriteria && selectedStory.story.acceptanceCriteria.length > 0 && (
                    <div className="pt-2">
                      <h3 className="text-base font-semibold text-text-primary mb-3 border-b border-border-light pb-2">
                        Acceptance Criteria
                      </h3>
                      <ul className="list-disc list-inside space-y-2">
                        {selectedStory.story.acceptanceCriteria.map((criterion, index) => (
                          <li key={index} className="text-text-secondary">{criterion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <div className="text-center py-12">
                  <Archive className="h-16 w-16 text-text-secondary mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    Select a Story
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Click on an archived story to view details and restore it
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}


