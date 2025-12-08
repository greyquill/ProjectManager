'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import {
  User,
  Plus,
  Trash2,
  Save,
  X,
  Mail,
  Briefcase,
  UserCircle,
  AlertCircle,
} from 'lucide-react'
import type { Person } from '@/lib/types'

// Force dynamic rendering - this is a client component, so we don't need this

type PersonWithProject = {
  person: Person
  projectName: string
}

type UsageInfo = {
  projects: Array<{
    name: string
    asManager: boolean
    asContributor: boolean
    inEpics: string[]
    inStories: string[]
  }>
}

export default function PeoplePage() {
  const [people, setPeople] = useState<PersonWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<PersonWithProject | null>(null)
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state for new/edit
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    designation: '',
    roleInProject: '',
  })
  const [saving, setSaving] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>('')

  useEffect(() => {
    fetchPeople()
  }, [])

  useEffect(() => {
    if (selectedPerson) {
      fetchUsage(selectedPerson.person.id)
    }
  }, [selectedPerson])

  async function fetchPeople() {
    try {
      setLoading(true)
      const response = await fetch('/api/people')
      const result = await response.json()

      if (result.success) {
        setPeople(result.data || [])
      } else {
        setError(result.error || 'Failed to load people')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load people')
    } finally {
      setLoading(false)
    }
  }

  async function fetchUsage(personId: string) {
    try {
      const response = await fetch(`/api/people/${personId}/usage`)
      const result = await response.json()

      if (result.success) {
        setUsage(result.data)
      }
    } catch (err) {
      console.error('Failed to load usage:', err)
    }
  }

  function selectPerson(personWithProject: PersonWithProject) {
    setSelectedPerson(personWithProject)
    setIsCreating(false)
  }

  function startCreating() {
    setIsCreating(true)
    setSelectedPerson(null)
    setFormData({
      id: '',
      name: '',
      email: '',
      designation: '',
      roleInProject: '',
    })
    setSelectedProject('')
  }

  function cancelCreating() {
    setIsCreating(false)
    setFormData({
      id: '',
      name: '',
      email: '',
      designation: '',
      roleInProject: '',
    })
    setSelectedProject('')
  }

  async function savePerson() {
    if (!selectedProject) {
      setError('Please select a project')
      return
    }

    if (!formData.name || !formData.email) {
      setError('Name and email are required')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Generate ID if not provided
      const personId = formData.id || `person-${Date.now()}-${Math.floor(Math.random() * 1000)}`

      const newPerson: Person = {
        id: personId,
        name: formData.name,
        email: formData.email,
        designation: formData.designation,
        roleInProject: formData.roleInProject,
      }

      // Get existing people for the project
      const response = await fetch(`/api/projects/${selectedProject}/people`)
      const result = await response.json()
      const existingPeople = result.success ? result.data : []

      // Check if person with this ID already exists
      const existingIndex = existingPeople.findIndex((p: Person) => p.id === personId)
      const updatedPeople = existingIndex >= 0
        ? existingPeople.map((p: Person, i: number) => i === existingIndex ? newPerson : p)
        : [...existingPeople, newPerson]

      // Save to project
      const saveResponse = await fetch(`/api/projects/${selectedProject}/people`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPeople),
      })

      const saveResult = await saveResponse.json()

      if (saveResult.success) {
        await fetchPeople()
        cancelCreating()
        // Select the newly created person
        const newPersonWithProject = { person: newPerson, projectName: selectedProject }
        selectPerson(newPersonWithProject)
      } else {
        setError(saveResult.error || 'Failed to save person')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save person')
    } finally {
      setSaving(false)
    }
  }

  async function deletePerson() {
    if (!selectedPerson) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/people/${selectedPerson.person.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        await fetchPeople()
        setSelectedPerson(null)
        setShowDeleteConfirm(false)
        setUsage(null)
      } else {
        if (result.usage) {
          setUsage(result.usage)
          setShowDeleteConfirm(false)
        } else {
          setError(result.error || 'Failed to delete person')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete person')
    } finally {
      setDeleting(false)
    }
  }

  // Get unique list of projects for dropdown
  const projects = Array.from(new Set(people.map((p) => p.projectName)))

  // Group people by project for display
  const peopleByProject = people.reduce((acc, p) => {
    if (!acc[p.projectName]) {
      acc[p.projectName] = []
    }
    acc[p.projectName].push(p)
    return acc
  }, {} as Record<string, PersonWithProject[]>)

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light">
        <Header />
        <main className="container py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-text-secondary">Loading people...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light">
      <Header />

      <main className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">People Management</h1>
          <Button variant="primary" onClick={startCreating}>
            <Plus className="h-4 w-4 mr-2" />
            Add Person
          </Button>
        </div>

        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-red-800 text-sm">{error}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: People List */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-lg font-semibold text-text-primary mb-4">People</h2>
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {Object.entries(peopleByProject).map(([projectName, projectPeople]) => (
                  <div key={projectName} className="mb-4">
                    <div className="text-xs font-medium text-text-secondary mb-2 uppercase">
                      {projectName}
                    </div>
                    {projectPeople.map((p) => {
                      const isSelected = selectedPerson?.person.id === p.person.id &&
                        selectedPerson?.projectName === p.projectName
                      return (
                        <div
                          key={`${p.person.id}-${p.projectName}`}
                          className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                            isSelected
                              ? 'bg-primary/10 border border-primary/20'
                              : 'bg-surface-muted hover:bg-surface'
                          }`}
                          onClick={() => selectPerson(p)}
                        >
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-text-secondary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-text-primary truncate">
                                {p.person.name}
                              </div>
                              <div className="text-xs text-text-secondary truncate">
                                {p.person.designation || 'No designation'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
                {people.length === 0 && !isCreating && (
                  <div className="text-center py-8 text-text-secondary text-sm">
                    No people found. Click &quot;Add Person&quot; to create one.
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right: Detail Panel */}
          <div className="lg:col-span-2">
            {isCreating ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-text-primary">Add New Person</h2>
                  <Button variant="outline" size="sm" onClick={cancelCreating}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Project <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="input-field"
                      required
                    >
                      <option value="">Select a project</option>
                      {projects.map((proj) => (
                        <option key={proj} value={proj}>
                          {proj}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Senior Developer, Project Manager"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Role in Project
                    </label>
                    <input
                      type="text"
                      value={formData.roleInProject}
                      onChange={(e) => setFormData({ ...formData, roleInProject: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Tech Lead, Contributor"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="primary" onClick={savePerson} isLoading={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={cancelCreating}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            ) : selectedPerson ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-text-primary">Person Details</h2>
                  <div className="flex gap-2">
                    {usage && usage.projects.length > 0 ? (
                      <div className="flex items-center gap-2 text-sm text-amber-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>Cannot delete - assigned to projects</span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                {showDeleteConfirm && (
                  <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
                    <p className="text-amber-800 mb-4">
                      Are you sure you want to delete {selectedPerson.person.name}?
                    </p>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={deletePerson} isLoading={deleting}>
                        Yes, Delete
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </Card>
                )}

                {usage && usage.projects.length > 0 && (
                  <Card className="p-4 mb-6 bg-red-50 border-red-200">
                    <h3 className="text-sm font-semibold text-red-800 mb-2">
                      Cannot delete - Person is assigned to:
                    </h3>
                    <div className="space-y-2">
                      {usage.projects.map((proj) => (
                        <div key={proj.name} className="text-sm text-red-700">
                          <div className="font-medium">{proj.name}</div>
                          <div className="text-xs ml-4">
                            {proj.asManager && <div>• Manager</div>}
                            {proj.asContributor && <div>• Contributor</div>}
                            {proj.inEpics.length > 0 && (
                              <div>• Epic Manager: {proj.inEpics.join(', ')}</div>
                            )}
                            {proj.inStories.length > 0 && (
                              <div>• Story Manager: {proj.inStories.length} stories</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        ID
                      </label>
                      <div className="text-sm text-text-primary font-mono">
                        {selectedPerson.person.id}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Project
                      </label>
                      <div className="text-sm text-text-primary">
                        {selectedPerson.projectName}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Name
                    </label>
                    <div className="text-lg text-text-primary font-medium">
                      {selectedPerson.person.name}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </label>
                    <div className="text-sm text-text-primary">
                      {selectedPerson.person.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Designation
                    </label>
                    <div className="text-sm text-text-primary">
                      {selectedPerson.person.designation || 'Not specified'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Role in Project
                    </label>
                    <div className="text-sm text-text-primary">
                      {selectedPerson.person.roleInProject || 'Not specified'}
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <UserCircle className="h-16 w-16 text-text-secondary mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Select a Person
                </h3>
                <p className="text-text-secondary text-sm">
                  Click on a person from the list to view their details
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

