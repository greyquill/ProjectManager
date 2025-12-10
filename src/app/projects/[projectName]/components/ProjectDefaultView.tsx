'use client'

import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Select } from '@/components/Select'
import { FileText, Save } from 'lucide-react'
import type { Project, Person } from '@/lib/types'
import Link from 'next/link'

interface ProjectDefaultViewProps {
  project: Project
  projectManager: string
  projectContributors: string[]
  people: Person[]
  hasProjectChanges: boolean
  savingProject: boolean
  isLoading?: boolean
  onManagerChange: (value: string) => void
  onContributorToggle: (personId: string) => void
  onSave: () => void
}

export function ProjectDefaultView({
  project,
  projectManager,
  projectContributors,
  people,
  hasProjectChanges,
  savingProject,
  isLoading = false,
  onManagerChange,
  onContributorToggle,
  onSave,
}: ProjectDefaultViewProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center mb-6">
          <FileText className="h-12 w-12 text-text-secondary mx-auto mb-3 opacity-50" />
          <h3 className="text-sm font-medium text-text-primary mb-1">
            Select an Epic or Story
          </h3>
          <p className="text-text-secondary text-xs mb-6">
            Click on an epic or story from the list to view and edit details
          </p>
        </div>
        <div className="space-y-6">
          {/* Description Skeleton */}
          <div className="border-t border-border-light pt-6 mb-6">
            <div className="h-6 bg-surface-muted rounded w-32 mb-4 animate-pulse"></div>
            <div className="space-y-3">
              <div className="h-4 bg-surface-muted rounded animate-pulse"></div>
              <div className="h-4 bg-surface-muted rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-surface-muted rounded w-4/6 animate-pulse"></div>
            </div>
          </div>
          {/* Project Team Skeleton */}
          <div className="border-t border-border-light pt-6">
            <div className="h-6 bg-surface-muted rounded w-32 mb-4 animate-pulse"></div>
            <div className="space-y-4">
              <div>
                <div className="h-4 bg-surface-muted rounded w-20 mb-2 animate-pulse"></div>
                <div className="h-10 bg-surface-muted rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 bg-surface-muted rounded w-24 mb-2 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-12 bg-surface-muted rounded animate-pulse"></div>
                  <div className="h-12 bg-surface-muted rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <FileText className="h-12 w-12 text-text-secondary mx-auto mb-3 opacity-50" />
        <h3 className="text-sm font-medium text-text-primary mb-1">
          Select an Epic or Story
        </h3>
        <p className="text-text-secondary text-xs mb-6">
          Click on an epic or story from the list to view and edit details
        </p>
      </div>
      {project.description && (() => {
        // Parse markdown table and text
        const lines = project.description.split('\n')
        const textParts: string[] = []
        const tableRows: Array<{ document: string; description: string; link?: string }> = []
        let inTable = false
        let tableHeaders: string[] = []

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()

          // Check if this is a table header separator
          if (line.match(/^\|[\s-:]+\|$/)) {
            inTable = true
            continue
          }

          // Check if this is a table row
          if (line.startsWith('|') && line.endsWith('|')) {
            const cells = line.split('|').map(c => c.trim()).filter(c => c)

            // Skip separator rows (rows with only dashes/hyphens)
            if (cells.every(cell => /^[\s-:]+$/.test(cell))) {
              inTable = true
              continue
            }

            if (!inTable && cells.length > 0) {
              // This might be the header row
              tableHeaders = cells
              inTable = true
              continue
            }

            if (inTable && cells.length >= 2) {
              // Parse link from first cell: [text](url)
              const firstCell = cells[0]
              const linkMatch = firstCell.match(/\[([^\]]+)\]\(([^)]+)\)/)

              if (linkMatch) {
                tableRows.push({
                  document: linkMatch[1],
                  description: cells[1] || '',
                  link: linkMatch[2],
                })
              } else {
                tableRows.push({
                  document: firstCell,
                  description: cells[1] || '',
                })
              }
              continue
            }
          }

          // If we were in a table and hit a non-table line, we're done with the table
          if (inTable && !line.startsWith('|')) {
            inTable = false
          }

          // Collect non-table text
          if (!inTable && line) {
            textParts.push(line)
          }
        }

        return (
          <div className="border-t border-border-light pt-6 mb-6">
            <h4 className="text-base font-semibold text-text-primary mb-4">Description</h4>
            <div className="prose prose-sm max-w-none text-sm text-text-secondary">
              {textParts.map((text, idx) => (
                <p key={idx} className="mb-3 text-text-secondary">
                  {text}
                </p>
              ))}
              {tableRows.length > 0 && (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full border border-border-light rounded-lg">
                    <thead className="bg-surface-muted">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-text-primary border-b border-border-light">
                          Document
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-text-primary border-b border-border-light">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-surface-muted/50">
                          <td className="px-4 py-2 text-xs text-text-secondary border-b border-border-light">
                            {row.link ? (
                              <Link href={row.link} className="text-primary hover:underline">
                                {row.document}
                              </Link>
                            ) : (
                              row.document
                            )}
                          </td>
                          <td className="px-4 py-2 text-xs text-text-secondary border-b border-border-light">
                            {row.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Project Metadata Editor */}
      <div className="border-t border-border-light pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-text-primary">Project Team</h4>
          {hasProjectChanges && (
            <Button
              variant="primary"
              size="sm"
              onClick={onSave}
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
            <Select
              value={projectManager}
              onChange={onManagerChange}
              options={[
                { value: 'unassigned', label: 'Unassigned' },
                ...people.map((person) => ({
                  value: person.id,
                  label: `${person.name} (${person.designation})`,
                })),
              ]}
              className="text-sm"
            />
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
                    onChange={() => onContributorToggle(person.id)}
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
  )
}

