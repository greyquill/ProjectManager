'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { ChevronRight, ChevronDown, BookOpen, Menu, X } from 'lucide-react'

interface DocSection {
  id: string
  title: string
  children?: DocSection[]
}

const docStructure: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    children: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'installation', title: 'Installation' },
      { id: 'quick-start', title: 'Quick Start' },
    ],
  },
  {
    id: 'core-concepts',
    title: 'Core Concepts',
    children: [
      { id: 'file-based-storage', title: 'File-Based Storage' },
      { id: 'projects', title: 'Projects' },
      { id: 'epics', title: 'Epics' },
      { id: 'stories', title: 'Stories' },
      { id: 'people-management', title: 'People Management' },
    ],
  },
  {
    id: 'working-with-projects',
    title: 'Working with Projects',
    children: [
      { id: 'creating-projects', title: 'Creating Projects' },
      { id: 'project-metadata', title: 'Project Metadata' },
      { id: 'project-team', title: 'Managing Project Team' },
    ],
  },
  {
    id: 'working-with-epics',
    title: 'Working with Epics',
    children: [
      { id: 'creating-epics', title: 'Creating Epics' },
      { id: 'epic-structure', title: 'Epic Structure' },
      { id: 'epic-metrics', title: 'Epic Metrics' },
    ],
  },
  {
    id: 'working-with-stories',
    title: 'Working with Stories',
    children: [
      { id: 'creating-stories', title: 'Creating Stories' },
      { id: 'story-fields', title: 'Story Fields' },
      { id: 'acceptance-criteria', title: 'Acceptance Criteria' },
      { id: 'story-files', title: 'Linking Code Files' },
    ],
  },
  {
    id: 'user-interface',
    title: 'User Interface',
    children: [
      { id: 'navigation', title: 'Navigation' },
      { id: 'project-view', title: 'Project View' },
      { id: 'accordion-list', title: 'Accordion List' },
      { id: 'editing-in-place', title: 'Editing In Place' },
      { id: 'markdown-preview', title: 'Markdown Preview' },
    ],
  },
  {
    id: 'data-model',
    title: 'Data Model',
    children: [
      { id: 'json-schema', title: 'JSON Schema' },
      { id: 'project-json', title: 'project.json' },
      { id: 'epic-json', title: 'epic.json' },
      { id: 'story-json', title: 'STORY-*.json' },
      { id: 'people-json', title: 'people.json' },
    ],
  },
  {
    id: 'best-practices',
    title: 'Best Practices',
    children: [
      { id: 'organizing-epics', title: 'Organizing Epics' },
      { id: 'writing-stories', title: 'Writing Good Stories' },
      { id: 'acceptance-criteria-tips', title: 'Acceptance Criteria Tips' },
      { id: 'version-control', title: 'Version Control' },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics Implementation',
    children: [
      { id: 'analytics-architecture', title: 'Architecture' },
      { id: 'analytics-calculations', title: 'Metric Calculations' },
      { id: 'risk-scoring', title: 'Risk Scoring Algorithm' },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    children: [
      { id: 'direct-url-navigation', title: 'Direct URL Navigation' },
      { id: 'keyboard-shortcuts', title: 'Keyboard Shortcuts' },
      { id: 'ai-integration', title: 'AI Integration (Future)' },
    ],
  },
]

export default function DocsPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['getting-started', 'core-concepts'])
  )
  const [activeSection, setActiveSection] = useState('introduction')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [headings, setHeadings] = useState<Array<{ id: string; title: string; level: number }>>([])

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedSections(newExpanded)
  }

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -80 // Account for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  // Extract headings from content for TOC
  useEffect(() => {
    const extractedHeadings: Array<{ id: string; title: string; level: number }> = []
    const contentElement = document.getElementById('doc-content')
    if (contentElement) {
      const h2Elements = contentElement.querySelectorAll('h2')
      h2Elements.forEach((h2) => {
        if (h2.id) {
          extractedHeadings.push({ id: h2.id, title: h2.textContent || '', level: 2 })
        }
      })
      const h3Elements = contentElement.querySelectorAll('h3')
      h3Elements.forEach((h3) => {
        if (h3.id) {
          extractedHeadings.push({ id: h3.id, title: h3.textContent || '', level: 3 })
        }
      })
    }
    setHeadings(extractedHeadings)
  }, [activeSection])

  // Intersection observer for active section highlighting
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-100px 0px -80% 0px' }
    )

    const sections = document.querySelectorAll('section[id]')
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  const renderSidebarItem = (item: DocSection, level: number = 0) => {
    const isExpanded = expandedSections.has(item.id)
    const hasChildren = item.children && item.children.length > 0
    const isActive = activeSection === item.id

    return (
      <div key={item.id} className={level > 0 ? 'ml-4' : ''}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleSection(item.id)
            }
            if (!hasChildren) {
              scrollToSection(item.id)
            }
          }}
          className={`w-full flex items-center gap-2 py-2 px-3 rounded-md text-sm transition-colors ${
            isActive
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          }`}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            )
          ) : (
            <span className="w-4" />
          )}
          <span className="flex-1 text-left">{item.title}</span>
        </button>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children?.map((child) => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Technical Documentation</h2>
              </div>
              <nav>{docStructure.map((item) => renderSidebarItem(item))}</nav>
            </div>
          </aside>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden fixed bottom-6 right-6 z-50 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary-dark transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Mobile Sidebar */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
              <aside
                className="absolute left-0 top-0 h-full w-80 bg-background p-6 overflow-y-auto shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 mb-6">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-text-primary">Documentation</h2>
                </div>
                <nav>{docStructure.map((item) => renderSidebarItem(item))}</nav>
              </aside>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0 max-w-4xl">
            <div id="doc-content" className="prose prose-slate max-w-none prose-sm text-sm">
              {/* Getting Started */}
              <section id="introduction">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> This is technical documentation for developers. For user-facing documentation on how to use the application, see{' '}
                    <Link href="/docs" className="text-blue-600 hover:underline font-medium">
                      User Documentation
                    </Link>.
                  </p>
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-2 pb-1.5 border-b border-border-light">
                  Introduction
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Welcome to Project Manager, an AI-native, file-based project management tool designed specifically
                  for developers who want to keep their project planning close to their code.
                </p>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Philosophy</h3>
                <p className="text-xs text-text-secondary mb-3">
                  Project Manager is built on a simple but powerful philosophy: <strong>every epic and story is a
                  JSON file in your repository</strong>. This approach gives you:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><strong>Full version control</strong> - Track changes to requirements over time with Git</li>
                  <li><strong>Type safety</strong> - TypeScript types and Zod validation for all data</li>
                  <li><strong>AI integration</strong> - Use Cursor AI to expand epics, generate stories, and refine acceptance criteria</li>
                  <li><strong>Developer-friendly</strong> - No separate PM tool; everything lives with your code</li>
                  <li><strong>Simple architecture</strong> - Clean UI on top of JSON files, no database needed</li>
                </ul>
              </section>

              <section id="installation">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Installation
                </h2>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Prerequisites</h3>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li>Node.js 18+ and npm 9+</li>
                  <li>Git for version control</li>
                </ul>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Setup Steps</h3>
                <div className="bg-surface border border-border-light rounded-lg p-2.5 mb-2">
                  <code className="text-[11px]">
                    <div className="mb-2"># 1. Clone the repository</div>
                    <div className="mb-2">git clone &lt;your-repo-url&gt;</div>
                    <div className="mb-2">cd ProjectManager</div>
                    <div className="mb-4">&nbsp;</div>
                    <div className="mb-2"># 2. Install dependencies</div>
                    <div className="mb-2">npm install</div>
                    <div className="mb-4">&nbsp;</div>
                    <div className="mb-2"># 3. Run the development server</div>
                    <div className="mb-2">npm run dev</div>
                    <div className="mb-4">&nbsp;</div>
                    <div className="mb-2"># 4. Open in browser</div>
                    <div>http://localhost:3004</div>
                  </code>
                </div>
              </section>

              <section id="quick-start">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Quick Start
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Follow these steps to start managing your projects:
                </p>
                <ol className="list-decimal list-inside text-xs text-text-secondary space-y-1.5 mb-3">
                  <li><strong>Navigate to Projects</strong> - Click &quot;Projects&quot; in the header</li>
                  <li><strong>Create a Project</strong> - Click &quot;New Project&quot; and fill in the details</li>
                  <li><strong>Add People</strong> - Go to &quot;People&quot; and add team members to your projects</li>
                  <li><strong>Create Epics</strong> - Open your project and click &quot;New Epic&quot;</li>
                  <li><strong>Add Stories</strong> - Expand an epic and click &quot;New Story&quot;</li>
                  <li><strong>Edit In-Place</strong> - Click any epic or story to edit it in the right panel</li>
                </ol>
              </section>

              {/* Core Concepts */}
              <section id="file-based-storage">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  File-Based Storage
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  All project data is stored as JSON files in a hierarchical <code>/pm</code> directory within your
                  repository. This structure makes it easy to navigate, organize, and version control your project
                  management data.
                </p>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Directory Structure</h3>
                <div className="bg-surface border border-border-light rounded-lg p-2.5 mb-2">
                  <code className="text-[11px]">
                    <div>/pm</div>
                    <div>&nbsp;&nbsp;/[project-name]/</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;project.json&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Project metadata</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;people.json&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Project team</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;/[epic-name]/</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;epic.json&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Epic metadata</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STORY-*.json&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Story files</div>
                  </code>
                </div>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Benefits</h3>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li>Navigate related items (project → epics → stories)</li>
                  <li>Organize by feature or module</li>
                  <li>Perform bulk operations on epics or projects</li>
                  <li>Clear separation of concerns</li>
                  <li>Easy to backup, share, and migrate</li>
                </ul>
              </section>

              <section id="projects">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Projects
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Projects are the top-level containers that organize your work. Each project represents a major
                  initiative, product, or codebase.
                </p>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Project Properties</h3>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><strong>Name</strong> - Unique identifier for the project</li>
                  <li><strong>Description</strong> - Markdown description of the project</li>
                  <li><strong>Manager</strong> - Person ID of the project manager</li>
                  <li><strong>Contributors</strong> - Array of Person IDs for team members</li>
                  <li><strong>Default Statuses</strong> - Custom status options for this project</li>
                  <li><strong>Default Priorities</strong> - Custom priority levels for this project</li>
                </ul>
              </section>

              <section id="epics">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Epics
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Epics represent high-level features or initiatives. They group related stories and provide a
                  higher-level view of your project&apos;s progress.
                </p>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Epic Properties</h3>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><strong>ID</strong> - Unique identifier (e.g., EPIC-1)</li>
                  <li><strong>Title</strong> - Short, descriptive name</li>
                  <li><strong>Summary</strong> - One-line description</li>
                  <li><strong>Description</strong> - Detailed markdown description</li>
                  <li><strong>Status</strong> - Current state (todo, in_progress, blocked, done, archived)</li>
                  <li><strong>Priority</strong> - Importance level</li>
                  <li><strong>Manager</strong> - Person ID of the epic manager</li>
                  <li><strong>Target Release</strong> - Target completion date</li>
                </ul>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Epic Metrics</h3>
                <p className="text-xs text-text-secondary mb-3">
                  Epics automatically calculate cumulative metrics from their stories:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li>Total story points</li>
                  <li>Number of stories</li>
                  <li>Progress percentage</li>
                  <li>Status breakdown</li>
                </ul>
              </section>

              <section id="stories">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Stories
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Stories are the smallest unit of work. Each story represents a specific, actionable task that can
                  be completed independently.
                </p>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Story Properties</h3>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><strong>ID</strong> - Unique identifier (STORY-timestamp-random)</li>
                  <li><strong>Epic ID</strong> - Link to parent epic</li>
                  <li><strong>Title</strong> - Descriptive name</li>
                  <li><strong>Summary</strong> - Brief description</li>
                  <li><strong>Description</strong> - Detailed markdown description</li>
                  <li><strong>Acceptance Criteria</strong> - List of completion requirements</li>
                  <li><strong>Status</strong> - Current state</li>
                  <li><strong>Priority</strong> - Importance level</li>
                  <li><strong>Manager</strong> - Person ID of the story manager</li>
                  <li><strong>Story Points</strong> - Effort estimate</li>
                  <li><strong>Tags</strong> - Categorization labels</li>
                  <li><strong>Due Date</strong> - Target completion date</li>
                  <li><strong>Files</strong> - Linked code files</li>
                </ul>
              </section>

              <section id="people-management">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  People Management
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Each project maintains a <code>people.json</code> file that stores information about team members.
                  These people can be assigned as managers or contributors across projects, epics, and stories.
                </p>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Person Properties</h3>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><strong>ID</strong> - Unique identifier (person-timestamp-random)</li>
                  <li><strong>Name</strong> - Full name</li>
                  <li><strong>Email</strong> - Contact email</li>
                  <li><strong>Designation</strong> - Job title or role</li>
                  <li><strong>Role in Project</strong> - Project-specific role</li>
                </ul>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Managing People</h3>
                <p className="text-xs text-text-secondary mb-3">
                  Navigate to the &quot;People&quot; page to view all people across all projects. You can:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li>Add new people with their details</li>
                  <li>Edit existing person information</li>
                  <li>Delete people (only if not assigned to any work)</li>
                  <li>View usage across projects, epics, and stories</li>
                </ul>
              </section>

              {/* Working with Projects */}
              <section id="creating-projects">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Creating Projects
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  To create a new project:
                </p>
                <ol className="list-decimal list-inside text-xs text-text-secondary space-y-1.5 mb-3">
                  <li>Navigate to the Projects page</li>
                  <li>Click the &quot;New Project&quot; button</li>
                  <li>Fill in the project name and description</li>
                  <li>Click Save</li>
                </ol>
                <p className="text-xs text-text-secondary mb-3">
                  This creates a new directory in <code>/pm/[project-name]/</code> with a <code>project.json</code> file
                  and an empty <code>people.json</code> file.
                </p>
              </section>

              <section id="project-metadata">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Project Metadata
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  The <code>project.json</code> file contains all project-level information:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><strong>Name</strong> - Must be unique and URL-friendly</li>
                  <li><strong>Description</strong> - Supports markdown formatting</li>
                  <li><strong>Manager</strong> - Select from people in the project</li>
                  <li><strong>Contributors</strong> - Multiple people can be selected</li>
                  <li><strong>Repository URL</strong> - Optional link to code repository</li>
                  <li><strong>Default Statuses</strong> - Customize available status options</li>
                  <li><strong>Default Priorities</strong> - Customize priority levels</li>
                </ul>
              </section>

              <section id="project-team">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Managing Project Team
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  When viewing a project, you can manage the team by:
                </p>
                <ol className="list-decimal list-inside text-xs text-text-secondary space-y-1.5 mb-3">
                  <li>Click the project name to deselect any epic/story</li>
                  <li>Scroll down to the &quot;Project Team&quot; section</li>
                  <li>Click &quot;Add Person&quot; to add team members</li>
                  <li>Fill in their details (name, email, designation, role)</li>
                  <li>Assign them as manager or add them to contributors</li>
                </ol>
                <p className="text-xs text-text-secondary mb-3">
                  People added to a project become available in dropdown menus for epics and stories within that
                  project.
                </p>
              </section>

              {/* Working with Epics */}
              <section id="creating-epics">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Creating Epics
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  To create a new epic within a project:
                </p>
                <ol className="list-decimal list-inside text-xs text-text-secondary space-y-1.5 mb-3">
                  <li>Open the project detail page</li>
                  <li>Click the &quot;New Epic&quot; button</li>
                  <li>Fill in the epic details (title, summary, description)</li>
                  <li>Set the status, priority, and manager</li>
                  <li>Click Save</li>
                </ol>
                <p className="text-xs text-text-secondary mb-3">
                  This creates a new directory in <code>/pm/[project-name]/[epic-name]/</code> with an
                  <code>epic.json</code> file.
                </p>
              </section>

              <section id="epic-structure">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Epic Structure
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Each epic folder contains:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><code>epic.json</code> - Epic metadata and properties</li>
                  <li><code>STORY-*.json</code> - One file per story in the epic</li>
                </ul>
                <p className="text-xs text-text-secondary mb-3">
                  The folder name is derived from the epic title (lowercase, hyphenated) and serves as the epic&apos;s
                  identifier in URLs.
                </p>
              </section>

              <section id="epic-metrics">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Epic Metrics
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  When you select an epic, the right panel displays:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><strong>Total Story Points</strong> - Sum of all story estimates</li>
                  <li><strong>Story Count</strong> - Number of stories in the epic</li>
                  <li><strong>Progress</strong> - Percentage of completed stories</li>
                  <li><strong>Status Breakdown</strong> - Count by status (todo, in progress, done, etc.)</li>
                </ul>
                <p className="text-xs text-text-secondary mb-3">
                  These metrics are calculated in real-time from the stories in the epic.
                </p>
              </section>

              {/* Working with Stories */}
              <section id="creating-stories">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Creating Stories
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  To create a new story within an epic:
                </p>
                <ol className="list-decimal list-inside text-xs text-text-secondary space-y-1.5 mb-3">
                  <li>Expand an epic in the accordion list</li>
                  <li>Click the &quot;New Story&quot; button</li>
                  <li>Fill in the story details</li>
                  <li>Add acceptance criteria</li>
                  <li>Link relevant code files (optional)</li>
                  <li>Click Save</li>
                </ol>
                <p className="text-xs text-text-secondary mb-3">
                  This creates a new <code>STORY-[timestamp]-[random].json</code> file in the epic&apos;s folder.
                </p>
              </section>

              <section id="story-fields">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Story Fields
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Each story has multiple fields that help define the work:
                </p>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Metadata Fields</h3>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><strong>Status</strong> - Select from project&apos;s default statuses</li>
                  <li><strong>Priority</strong> - Select from project&apos;s default priorities</li>
                  <li><strong>Manager</strong> - Select from project&apos;s people</li>
                  <li><strong>Due Date</strong> - Optional target completion date</li>
                  <li><strong>Story Points</strong> - Numeric effort estimate</li>
                  <li><strong>Tags</strong> - Comma-separated labels</li>
                </ul>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Content Fields</h3>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><strong>Title</strong> - Short, descriptive name</li>
                  <li><strong>Summary</strong> - One-line description</li>
                  <li><strong>Description</strong> - Detailed markdown description with preview</li>
                </ul>
              </section>

              <section id="acceptance-criteria">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Acceptance Criteria
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Acceptance criteria define what &quot;done&quot; means for a story. They are displayed as a list of
                  requirements that must be met.
                </p>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Adding Criteria</h3>
                <ol className="list-decimal list-inside text-xs text-text-secondary space-y-1.5 mb-3">
                  <li>Click &quot;Add Criterion&quot; button</li>
                  <li>Enter the requirement in the text field</li>
                  <li>Click the plus icon or press Enter</li>
                  <li>Repeat for additional criteria</li>
                </ol>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Editing Criteria</h3>
                <p className="text-xs text-text-secondary mb-3">
                  You can edit or delete existing criteria:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li>Click in the text field to edit</li>
                  <li>Click the X icon to remove a criterion</li>
                  <li>Click Save to persist changes</li>
                </ul>
              </section>

              <section id="story-files">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Linking Code Files
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Stories can reference specific code files that are relevant to the work. This creates a clear
                  connection between planning and implementation.
                </p>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Adding Files</h3>
                <ol className="list-decimal list-inside text-xs text-text-secondary space-y-1.5 mb-3">
                  <li>Scroll to the &quot;Files&quot; section</li>
                  <li>Click &quot;Add File&quot;</li>
                  <li>Enter the file path (e.g., <code>src/components/Button.tsx</code>)</li>
                  <li>Select the role: primary, supporting, or test</li>
                  <li>Click Save</li>
                </ol>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">File Roles</h3>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><strong>Primary</strong> - Main files being created or modified</li>
                  <li><strong>Supporting</strong> - Related files that may need changes</li>
                  <li><strong>Test</strong> - Test files for the story</li>
                </ul>
              </section>

              {/* User Interface */}
              <section id="navigation">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Navigation
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  The application has a simple header navigation:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><strong>Project Manager</strong> - Logo/home link</li>
                  <li><strong>Projects</strong> - View all projects</li>
                  <li><strong>People</strong> - Manage team members</li>
                  <li><strong>Docs</strong> - This documentation</li>
                </ul>
              </section>

              <section id="project-view">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Project View
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  The project detail page uses a two-panel layout:
                </p>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Left Panel - Accordion List</h3>
                <p className="text-xs text-text-secondary mb-3">
                  Shows all epics as collapsible sections. Each epic row displays:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li>Epic title</li>
                  <li>Status badge</li>
                  <li>Story count</li>
                  <li>Total story points</li>
                  <li>Progress percentage</li>
                </ul>
                <p className="text-xs text-text-secondary mb-3">
                  When expanded, stories are shown as rows with:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li>Story title</li>
                  <li>Manager name</li>
                  <li>Status badge</li>
                </ul>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Right Panel - Detail View</h3>
                <p className="text-xs text-text-secondary mb-3">
                  Displays the full details of the selected epic or story, or the project overview if nothing is
                  selected.
                </p>
              </section>

              <section id="accordion-list">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Accordion List
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  The accordion on the left allows you to quickly navigate between epics and stories:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li>Click an epic row to expand/collapse its stories</li>
                  <li>Click an epic title to select it and view details</li>
                  <li>Click a story row to select it and view details</li>
                  <li>The selected item is highlighted</li>
                  <li>Multiple epics can be expanded simultaneously</li>
                </ul>
              </section>

              <section id="editing-in-place">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Editing In Place
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  All editing happens directly on the project detail page:
                </p>
                <ol className="list-decimal list-inside text-xs text-text-secondary space-y-1.5 mb-3">
                  <li>Select an epic or story from the accordion</li>
                  <li>Edit fields in the right panel</li>
                  <li>The Save button becomes enabled when changes are detected</li>
                  <li>Click Save to persist changes to the JSON file</li>
                  <li>Changes are saved immediately to disk</li>
                </ol>
                <p className="text-xs text-text-secondary mb-3">
                  No separate edit pages or modals - everything is inline for a seamless experience.
                </p>
              </section>

              <section id="markdown-preview">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Markdown Preview
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  The description field for epics and stories supports markdown formatting with a live preview:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li>By default, the preview is shown</li>
                  <li>Click the &quot;Edit&quot; button to switch to edit mode</li>
                  <li>Click the &quot;Preview&quot; button to see the rendered markdown</li>
                  <li>Supports headers, bold, italic, code blocks, lists, and links</li>
                </ul>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Markdown Syntax</h3>
                <div className="bg-surface border border-border-light rounded-lg p-2.5 mb-2">
                  <code className="text-[11px]">
                    <div># Heading 1</div>
                    <div>## Heading 2</div>
                    <div>### Heading 3</div>
                    <div>&nbsp;</div>
                    <div>**Bold text**</div>
                    <div>*Italic text*</div>
                    <div>`Inline code`</div>
                    <div>&nbsp;</div>
                    <div>- List item 1</div>
                    <div>- List item 2</div>
                    <div>&nbsp;</div>
                    <div>[Link text](https://example.com)</div>
                  </code>
                </div>
              </section>

              {/* Data Model */}
              <section id="json-schema">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  JSON Schema
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  All data in Project Manager is validated using Zod schemas. This ensures type safety and prevents
                  invalid data from being saved.
                </p>
                <p className="text-xs text-text-secondary mb-3">
                  The schemas are defined in <code>src/lib/types.ts</code> and include:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li>ProjectSchema</li>
                  <li>EpicSchema</li>
                  <li>StorySchema</li>
                  <li>PersonSchema</li>
                  <li>StoryFileSchema</li>
                </ul>
              </section>

              <section id="project-json">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  project.json
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Example structure:
                </p>
                <div className="bg-surface border border-border-light rounded-lg p-4 mb-4 overflow-x-auto">
                  <pre className="text-sm">
{`{
  "name": "Healthcare Workflow Platform",
  "description": "Platform for hospital management.",
  "epicIds": [],
  "defaultStatuses": [
    "todo",
    "in_progress",
    "blocked",
    "done",
    "archived"
  ],
  "defaultPriorities": [
    "low",
    "medium",
    "high",
    "critical"
  ],
  "metadata": {
    "manager": "person-001",
    "contributors": ["person-002", "person-003"],
    "repoUrl": "https://github.com/org/repo",
    "custom": {}
  }
}`}
                  </pre>
                </div>
              </section>

              <section id="epic-json">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  epic.json
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Example structure:
                </p>
                <div className="bg-surface border border-border-light rounded-lg p-4 mb-4 overflow-x-auto">
                  <pre className="text-sm">
{`{
  "id": "EPIC-1",
  "title": "Patient Management System",
  "summary": "Build patient management features",
  "description": "Detailed description...",
  "status": "in_progress",
  "priority": "high",
  "manager": "person-001",
  "createdAt": "2025-01-05T10:00:00Z",
  "updatedAt": "2025-01-10T14:30:00Z",
  "targetRelease": "2025-03-01",
  "tags": ["frontend", "backend"],
  "metadata": {
    "createdBy": "person-001",
    "custom": {}
  }
}`}
                  </pre>
                </div>
              </section>

              <section id="story-json">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  STORY-*.json
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Example structure:
                </p>
                <div className="bg-surface border border-border-light rounded-lg p-4 mb-4 overflow-x-auto">
                  <pre className="text-sm">
{`{
  "id": "STORY-1733664268523-456",
  "epicId": "EPIC-1",
  "title": "Create patient profile form",
  "summary": "User can create patient profiles",
  "description": "Detailed description...",
  "acceptanceCriteria": [
    "Form validates required fields",
    "Success shows confirmation",
    "Patient appears in list"
  ],
  "status": "todo",
  "priority": "medium",
  "manager": "person-002",
  "createdAt": "2025-01-05T10:00:00Z",
  "updatedAt": "2025-01-05T10:00:00Z",
  "dueDate": "2025-01-20",
  "tags": ["frontend", "patients"],
  "estimate": {
    "storyPoints": 5,
    "confidence": "high"
  },
  "files": [
    {
      "path": "src/app/patients/new/page.tsx",
      "role": "primary"
    }
  ],
  "relatedStories": [],
  "metadata": {
    "createdBy": "person-001",
    "custom": {}
  }
}`}
                  </pre>
                </div>
              </section>

              <section id="people-json">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  people.json
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Example structure:
                </p>
                <div className="bg-surface border border-border-light rounded-lg p-4 mb-4 overflow-x-auto">
                  <pre className="text-sm">
{`[
  {
    "id": "person-001",
    "name": "John Smith",
    "email": "john@example.com",
    "designation": "Senior Developer",
    "roleInProject": "Tech Lead"
  },
  {
    "id": "person-002",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "designation": "Product Manager",
    "roleInProject": "Project Lead"
  }
]`}
                  </pre>
                </div>
              </section>

              {/* Best Practices */}
              <section id="organizing-epics">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Organizing Epics
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Tips for organizing your epics effectively:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><strong>Group by feature</strong> - Each epic should represent a cohesive feature or module</li>
                  <li><strong>Keep them independent</strong> - Minimize dependencies between epics</li>
                  <li><strong>Use descriptive names</strong> - Epic names become folder names, so keep them clear</li>
                  <li><strong>Set clear goals</strong> - Write a detailed description of what success looks like</li>
                  <li><strong>Track progress</strong> - Regularly update epic status based on story completion</li>
                </ul>
              </section>

              <section id="writing-stories">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Writing Good Stories
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Follow these guidelines for effective stories:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><strong>Keep them small</strong> - Stories should be completable in a few days</li>
                  <li><strong>Be specific</strong> - Clearly define what needs to be built</li>
                  <li><strong>Include context</strong> - Explain why the story is needed</li>
                  <li><strong>Add acceptance criteria</strong> - Define what &quot;done&quot; means</li>
                  <li><strong>Link files</strong> - Reference relevant code files</li>
                  <li><strong>Use user perspective</strong> - Frame as &quot;As a [user], I can [action]&quot;</li>
                  <li><strong>Add story points</strong> - Estimate effort for planning</li>
                </ul>
              </section>

              <section id="acceptance-criteria-tips">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Acceptance Criteria Tips
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Write clear acceptance criteria:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><strong>Make them testable</strong> - Each criterion should be verifiable</li>
                  <li><strong>Be specific</strong> - Avoid vague language like &quot;works well&quot;</li>
                  <li><strong>Cover edge cases</strong> - Include error scenarios and validations</li>
                  <li><strong>Keep them independent</strong> - Each criterion should stand alone</li>
                  <li><strong>Focus on behavior</strong> - Describe what should happen, not how to implement it</li>
                </ul>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Good Examples</h3>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li>✅ &quot;Form validates email format and shows error message for invalid emails&quot;</li>
                  <li>✅ &quot;User can select a date from the date picker&quot;</li>
                  <li>✅ &quot;Save button is disabled when no changes are made&quot;</li>
                </ul>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Bad Examples</h3>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li>❌ &quot;Everything works correctly&quot;</li>
                  <li>❌ &quot;Use React Hook Form for validation&quot;</li>
                  <li>❌ &quot;It should be fast&quot;</li>
                </ul>
              </section>

              <section id="version-control">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Version Control
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Since all project data is stored as JSON files, you can use Git to track changes:
                </p>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Committing Changes</h3>
                <div className="bg-surface border border-border-light rounded-lg p-2.5 mb-2">
                  <code className="text-[11px]">
                    <div># View changes to project management data</div>
                    <div>git status</div>
                    <div>&nbsp;</div>
                    <div># Review specific changes</div>
                    <div>git diff pm/</div>
                    <div>&nbsp;</div>
                    <div># Commit changes</div>
                    <div>git add pm/</div>
                    <div>git commit -m &quot;Add user authentication epic with 3 stories&quot;</div>
                  </code>
                </div>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Benefits</h3>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><strong>History</strong> - Track how requirements evolve over time</li>
                  <li><strong>Collaboration</strong> - Multiple team members can edit and merge changes</li>
                  <li><strong>Branching</strong> - Work on planning in feature branches</li>
                  <li><strong>Blame/Annotations</strong> - See who changed what and when</li>
                  <li><strong>Rollback</strong> - Revert to previous versions if needed</li>
                </ul>
              </section>

              {/* Advanced */}
              <section id="direct-url-navigation">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Direct URL Navigation
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  You can navigate directly to specific epics and stories using URL parameters:
                </p>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">URL Format</h3>
                <div className="bg-surface border border-border-light rounded-lg p-2.5 mb-2">
                  <code className="text-[11px]">
                    <div># View a project</div>
                    <div>/projects/[project-name]</div>
                    <div>&nbsp;</div>
                    <div># View a specific epic</div>
                    <div>/projects/[project-name]?epic=[epic-name]</div>
                    <div>&nbsp;</div>
                    <div># View a specific story</div>
                    <div>/projects/[project-name]?epic=[epic-name]&story=[story-id]</div>
                  </code>
                </div>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Examples</h3>
                <div className="bg-surface border border-border-light rounded-lg p-2.5 mb-2">
                  <code className="text-[11px]">
                    <div>/projects/healthcare-platform</div>
                    <div>/projects/healthcare-platform?epic=appointment-scheduling</div>
                    <div>/projects/healthcare-platform?epic=appointment-scheduling&story=STORY-125</div>
                  </code>
                </div>
                <p className="text-xs text-text-secondary mb-3">
                  These URLs can be bookmarked or shared with team members to link directly to specific work items.
                  The accordion will automatically expand to show the selected story.
                </p>
              </section>

              <section id="keyboard-shortcuts">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  Keyboard Shortcuts
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Keyboard shortcuts for common actions (planned for future release):
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><strong>Ctrl/Cmd + S</strong> - Save current epic or story</li>
                  <li><strong>Ctrl/Cmd + E</strong> - Toggle markdown preview</li>
                  <li><strong>Ctrl/Cmd + N</strong> - Create new story (when epic is selected)</li>
                  <li><strong>Escape</strong> - Deselect current item</li>
                </ul>
              </section>

              <section id="ai-integration">
                <h2 className="text-xl font-bold text-text-primary mb-3 pb-2 border-b border-border-light mt-8">
                  AI Integration (Future)
                </h2>
                <p className="text-xs text-text-secondary mb-3">
                  Future versions will include AI-powered features:
                </p>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Planned Features</h3>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li><strong>Epic Expansion</strong> - Generate stories from an epic description</li>
                  <li><strong>Acceptance Criteria</strong> - AI suggests acceptance criteria for stories</li>
                  <li><strong>File Path Suggestions</strong> - AI recommends relevant code files</li>
                  <li><strong>Technical Breakdown</strong> - Convert user stories into technical tasks</li>
                  <li><strong>Story Estimation</strong> - AI assists with story point estimation</li>
                  <li><strong>Dependency Detection</strong> - Identify dependencies between stories</li>
                </ul>
                <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">Cursor AI Integration</h3>
                <p className="text-xs text-text-secondary mb-3">
                  Project Manager is designed to work seamlessly with Cursor AI. You can already use Cursor to:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 mb-3">
                  <li>Read JSON files and understand project structure</li>
                  <li>Generate code based on story descriptions</li>
                  <li>Suggest improvements to acceptance criteria</li>
                  <li>Create new stories and epics via conversation</li>
                </ul>
              </section>

              {/* Footer */}
              <section className="mt-12 pt-8 border-t border-border-light">
                <p className="text-text-secondary text-sm">
                  For more information, check out the{' '}
                  <Link href="https://github.com" className="text-primary hover:underline">
                    GitHub repository
                  </Link>{' '}
                  or reach out to the development team.
                </p>
              </section>
            </div>
          </main>

          {/* Right Sidebar - Table of Contents - Desktop Only */}
          <aside className="hidden xl:block w-64 flex-shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <h3 className="text-sm font-semibold text-text-primary mb-3">On This Page</h3>
              <nav className="space-y-1">
                {headings.map((heading) => (
                  <button
                    key={heading.id}
                    onClick={() => scrollToSection(heading.id)}
                    className={`block w-full text-left py-1 text-xs transition-colors ${
                      heading.level === 3 ? 'pl-3' : ''
                    } ${
                      activeSection === heading.id
                        ? 'text-primary font-medium'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {heading.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
