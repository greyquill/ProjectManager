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
      { id: 'quick-start', title: 'Quick Start' },
    ],
  },
  {
    id: 'core-concepts',
    title: 'Core Concepts',
    children: [
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
    id: 'analytics',
    title: 'Analytics & Metrics',
    children: [
      { id: 'analytics-overview', title: 'Analytics Overview' },
      { id: 'key-metrics', title: 'Key Metrics' },
      { id: 'status-distribution', title: 'Status Distribution' },
      { id: 'risk-analysis', title: 'Risk Analysis' },
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
    id: 'best-practices',
    title: 'Best Practices',
    children: [
      { id: 'organizing-epics', title: 'Organizing Epics' },
      { id: 'writing-stories', title: 'Writing Good Stories' },
      { id: 'acceptance-criteria-tips', title: 'Acceptance Criteria Tips' },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    children: [
      { id: 'direct-url-navigation', title: 'Direct URL Navigation' },
      { id: 'keyboard-shortcuts', title: 'Keyboard Shortcuts' },
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
                <h2 className="text-lg font-semibold text-text-primary">Documentation</h2>
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
            <div id="doc-content" className="prose prose-slate max-w-none">
              {/* Getting Started */}
              <section id="introduction">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light">
                  Introduction
                </h2>
                <p className="text-text-secondary mb-4">
                  Welcome to Project Manager, a powerful project management tool designed to help you organize and track
                  your work efficiently.
                </p>
                <p className="text-text-secondary mb-4">
                  Project Manager helps you:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li>Organize work into <strong>Projects</strong>, <strong>Epics</strong>, and <strong>Stories</strong></li>
                  <li>Track progress with status updates and metrics</li>
                  <li>Manage your team and assign work</li>
                  <li>Define clear acceptance criteria for each story</li>
                  <li>Link code files to stories for better organization</li>
                </ul>
              </section>

              <section id="quick-start">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Quick Start
                </h2>
                <p className="text-text-secondary mb-4">
                  Follow these steps to start managing your projects:
                </p>
                <ol className="list-decimal list-inside text-text-secondary space-y-3 mb-4">
                  <li><strong>Navigate to Projects</strong> - Click &quot;Projects&quot; in the header</li>
                  <li><strong>Create a Project</strong> - Click &quot;New Project&quot; and fill in the details</li>
                  <li><strong>Add People</strong> - Go to &quot;People&quot; and add team members to your projects</li>
                  <li><strong>Create Epics</strong> - Open your project and click &quot;+ Epic&quot;</li>
                  <li><strong>Add Stories</strong> - Expand an epic and click the &quot;+&quot; button to add a story</li>
                  <li><strong>Edit In-Place</strong> - Click any epic or story to edit it in the right panel</li>
                </ol>
              </section>

              {/* Core Concepts */}
              <section id="projects">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Projects
                </h2>
                <p className="text-text-secondary mb-4">
                  Projects are the top-level containers that organize your work. Each project represents a major
                  initiative, product, or codebase.
                </p>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Project Properties</h3>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li><strong>Name</strong> - Unique identifier for the project</li>
                  <li><strong>Description</strong> - Markdown description of the project</li>
                  <li><strong>Manager</strong> - Person responsible for the project</li>
                  <li><strong>Contributors</strong> - Team members working on the project</li>
                </ul>
              </section>

              <section id="epics">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Epics
                </h2>
                <p className="text-text-secondary mb-4">
                  Epics represent high-level features or initiatives. They group related stories and provide a
                  higher-level view of your project&apos;s progress.
                </p>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Epic Properties</h3>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li><strong>Title</strong> - Short, descriptive name</li>
                  <li><strong>Summary</strong> - One-line description</li>
                  <li><strong>Description</strong> - Detailed markdown description</li>
                  <li><strong>Status</strong> - Current state (To Do, In Progress, Blocked, Done)</li>
                  <li><strong>Priority</strong> - Importance level (Low, Medium, High, Critical)</li>
                  <li><strong>Manager</strong> - Person responsible for the epic</li>
                  <li><strong>Target Release</strong> - Target completion date</li>
                </ul>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Epic Metrics</h3>
                <p className="text-text-secondary mb-4">
                  Epics automatically calculate cumulative metrics from their stories:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li>Total story points</li>
                  <li>Number of stories</li>
                  <li>Progress percentage</li>
                  <li>Status breakdown</li>
                </ul>
              </section>

              <section id="stories">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Stories
                </h2>
                <p className="text-text-secondary mb-4">
                  Stories are the smallest unit of work. Each story represents a specific, actionable task that can
                  be completed independently.
                </p>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Story Properties</h3>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li><strong>Title</strong> - Descriptive name</li>
                  <li><strong>Summary</strong> - Brief description</li>
                  <li><strong>Description</strong> - Detailed markdown description</li>
                  <li><strong>Acceptance Criteria</strong> - List of completion requirements</li>
                  <li><strong>Status</strong> - Current state (To Do, In Progress, Blocked, Done)</li>
                  <li><strong>Priority</strong> - Importance level</li>
                  <li><strong>Manager</strong> - Person responsible for the story</li>
                  <li><strong>Story Points</strong> - Effort estimate</li>
                  <li><strong>Tags</strong> - Categorization labels</li>
                  <li><strong>Due Date</strong> - Target completion date</li>
                  <li><strong>Files</strong> - Linked code files</li>
                </ul>
              </section>

              <section id="people-management">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  People Management
                </h2>
                <p className="text-text-secondary mb-4">
                  Each project maintains a team of people who can be assigned as managers or contributors across
                  projects, epics, and stories.
                </p>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Person Properties</h3>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li><strong>Name</strong> - Full name</li>
                  <li><strong>Email</strong> - Contact email</li>
                  <li><strong>Designation</strong> - Job title or role</li>
                  <li><strong>Role in Project</strong> - Project-specific role</li>
                </ul>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Managing People</h3>
                <p className="text-text-secondary mb-4">
                  Navigate to the &quot;People&quot; page to view all people across all projects. You can:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li>Add new people with their details</li>
                  <li>Edit existing person information</li>
                  <li>Delete people (only if not assigned to any work)</li>
                  <li>View usage across projects, epics, and stories</li>
                </ul>
              </section>

              {/* Working with Projects */}
              <section id="creating-projects">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Creating Projects
                </h2>
                <p className="text-text-secondary mb-4">
                  To create a new project:
                </p>
                <ol className="list-decimal list-inside text-text-secondary space-y-3 mb-4">
                  <li>Navigate to the Projects page</li>
                  <li>Click the &quot;New Project&quot; button</li>
                  <li>Fill in the project name and description</li>
                  <li>Click Save</li>
                </ol>
              </section>

              <section id="project-metadata">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Project Metadata
                </h2>
                <p className="text-text-secondary mb-4">
                  When viewing a project, you can edit its metadata:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li><strong>Name</strong> - Must be unique</li>
                  <li><strong>Description</strong> - Supports markdown formatting</li>
                  <li><strong>Manager</strong> - Select from people in the project</li>
                  <li><strong>Contributors</strong> - Multiple people can be selected</li>
                  <li><strong>Repository URL</strong> - Optional link to code repository</li>
                </ul>
              </section>

              <section id="project-team">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Managing Project Team
                </h2>
                <p className="text-text-secondary mb-4">
                  When viewing a project, you can manage the team by:
                </p>
                <ol className="list-decimal list-inside text-text-secondary space-y-3 mb-4">
                  <li>Click the project name to deselect any epic/story</li>
                  <li>Scroll down to the &quot;Project Team&quot; section</li>
                  <li>Click &quot;Add Person&quot; to add team members</li>
                  <li>Fill in their details (name, email, designation, role)</li>
                  <li>Assign them as manager or add them to contributors</li>
                </ol>
                <p className="text-text-secondary mb-4">
                  People added to a project become available in dropdown menus for epics and stories within that
                  project.
                </p>
              </section>

              {/* Working with Epics */}
              <section id="creating-epics">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Creating Epics
                </h2>
                <p className="text-text-secondary mb-4">
                  To create a new epic within a project:
                </p>
                <ol className="list-decimal list-inside text-text-secondary space-y-3 mb-4">
                  <li>Open the project detail page</li>
                  <li>Click the &quot;+ Epic&quot; button in the left panel</li>
                  <li>Fill in the epic details (title, summary, description)</li>
                  <li>Set the priority and manager</li>
                  <li>Click &quot;Create Epic&quot;</li>
                </ol>
                <p className="text-text-secondary mb-4">
                  New epics are automatically assigned a sequential ID (EPIC-0001, EPIC-0002, etc.) and start with
                  &quot;To Do&quot; status.
                </p>
              </section>

              <section id="epic-metrics">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Epic Metrics
                </h2>
                <p className="text-text-secondary mb-4">
                  When you select an epic, the right panel displays:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li><strong>Total Story Points</strong> - Sum of all story estimates</li>
                  <li><strong>Story Count</strong> - Number of stories in the epic</li>
                  <li><strong>Progress</strong> - Percentage of completed stories</li>
                  <li><strong>Status Breakdown</strong> - Count by status (todo, in progress, done, etc.)</li>
                </ul>
                <p className="text-text-secondary mb-4">
                  These metrics are calculated in real-time from the stories in the epic.
                </p>
              </section>

              {/* Working with Stories */}
              <section id="creating-stories">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Creating Stories
                </h2>
                <p className="text-text-secondary mb-4">
                  To create a new story within an epic:
                </p>
                <ol className="list-decimal list-inside text-text-secondary space-y-3 mb-4">
                  <li>Expand an epic in the accordion list</li>
                  <li>Click the &quot;+&quot; button at the bottom of the epic</li>
                  <li>Fill in the story details (title and summary are required)</li>
                  <li>Set the priority and manager</li>
                  <li>Click &quot;Create Story&quot;</li>
                </ol>
                <p className="text-text-secondary mb-4">
                  New stories are automatically assigned a sequential ID (STORY-001, STORY-002, etc.) and start with
                  &quot;To Do&quot; status. You can add more details like acceptance criteria and files after creation.
                </p>
              </section>

              <section id="story-fields">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Story Fields
                </h2>
                <p className="text-text-secondary mb-4">
                  Each story has multiple fields that help define the work:
                </p>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Metadata Fields</h3>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li><strong>Status</strong> - Select from available statuses (To Do, In Progress, Blocked, Done)</li>
                  <li><strong>Priority</strong> - Select from available priorities (Low, Medium, High, Critical)</li>
                  <li><strong>Manager</strong> - Select from project&apos;s people</li>
                  <li><strong>Due Date</strong> - Optional target completion date</li>
                  <li><strong>Story Points</strong> - Numeric effort estimate</li>
                  <li><strong>Tags</strong> - Add tags for categorization</li>
                </ul>
                <p className="text-text-secondary mb-4">
                  <strong>Note:</strong> Status and Priority changes are automatically saved when you select them.
                </p>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Content Fields</h3>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li><strong>Title</strong> - Short, descriptive name</li>
                  <li><strong>Summary</strong> - One-line description</li>
                  <li><strong>Description</strong> - Detailed markdown description with preview</li>
                </ul>
              </section>

              <section id="acceptance-criteria">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Acceptance Criteria
                </h2>
                <p className="text-text-secondary mb-4">
                  Acceptance criteria define what &quot;done&quot; means for a story. They are displayed as a list of
                  requirements that must be met.
                </p>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Adding Criteria</h3>
                <ol className="list-decimal list-inside text-text-secondary space-y-3 mb-4">
                  <li>Scroll to the &quot;Acceptance Criteria&quot; section</li>
                  <li>Click &quot;Add Criterion&quot; button</li>
                  <li>Enter the requirement in the text field</li>
                  <li>Click the plus icon or press Enter</li>
                  <li>Repeat for additional criteria</li>
                </ol>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Editing Criteria</h3>
                <p className="text-text-secondary mb-4">
                  You can edit or delete existing criteria:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li>Click in the text field to edit</li>
                  <li>Click the X icon to remove a criterion</li>
                  <li>Click Save to persist changes</li>
                </ul>
              </section>

              <section id="story-files">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Linking Code Files
                </h2>
                <p className="text-text-secondary mb-4">
                  Stories can reference specific code files that are relevant to the work. This creates a clear
                  connection between planning and implementation.
                </p>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Adding Files</h3>
                <ol className="list-decimal list-inside text-text-secondary space-y-3 mb-4">
                  <li>Scroll to the &quot;Files&quot; section</li>
                  <li>Click &quot;Add File&quot;</li>
                  <li>Enter the file path (e.g., <code>src/components/Button.tsx</code>)</li>
                  <li>Select the role: primary, supporting, or test</li>
                  <li>Click Save</li>
                </ol>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">File Roles</h3>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li><strong>Primary</strong> - Main files being created or modified</li>
                  <li><strong>Supporting</strong> - Related files that may need changes</li>
                  <li><strong>Test</strong> - Test files for the story</li>
                </ul>
              </section>

              {/* User Interface */}
              <section id="navigation">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Navigation
                </h2>
                <p className="text-text-secondary mb-4">
                  The application has a simple header navigation:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li><strong>Project Manager</strong> - Logo/home link</li>
                  <li><strong>Projects</strong> - View all projects</li>
                  <li><strong>People</strong> - Manage team members</li>
                  <li><strong>Docs</strong> - This documentation</li>
                </ul>
              </section>

              <section id="project-view">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Project View
                </h2>
                <p className="text-text-secondary mb-4">
                  The project detail page uses a two-panel layout:
                </p>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Left Panel - Accordion List</h3>
                <p className="text-text-secondary mb-4">
                  Shows all epics as collapsible sections. Each epic row displays:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li>Epic title</li>
                  <li>Status indicator (colored icon and left border)</li>
                  <li>Story count</li>
                  <li>Total story points</li>
                  <li>Progress percentage</li>
                </ul>
                <p className="text-text-secondary mb-4">
                  When expanded, stories are shown as rows with:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li>Story title</li>
                  <li>Manager name</li>
                  <li>Status indicator</li>
                </ul>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Right Panel - Detail View</h3>
                <p className="text-text-secondary mb-4">
                  Displays the full details of the selected epic or story, or the project overview if nothing is
                  selected. You can edit all fields directly in this panel.
                </p>
              </section>

              <section id="accordion-list">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Accordion List
                </h2>
                <p className="text-text-secondary mb-4">
                  The accordion on the left allows you to quickly navigate between epics and stories:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li>Click an epic row to expand/collapse its stories</li>
                  <li>Click an epic title to select it and view details</li>
                  <li>Click a story row to select it and view details</li>
                  <li>The selected item is highlighted</li>
                  <li>Multiple epics can be expanded simultaneously</li>
                </ul>
              </section>

              <section id="editing-in-place">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Editing In Place
                </h2>
                <p className="text-text-secondary mb-4">
                  All editing happens directly on the project detail page:
                </p>
                <ol className="list-decimal list-inside text-text-secondary space-y-3 mb-4">
                  <li>Select an epic or story from the accordion</li>
                  <li>Edit fields in the right panel</li>
                  <li>The Save button becomes enabled when changes are detected</li>
                  <li>Click Save to persist changes</li>
                  <li>Status and Priority changes are saved automatically</li>
                </ol>
                <p className="text-text-secondary mb-4">
                  No separate edit pages or modals - everything is inline for a seamless experience.
                </p>
              </section>

              <section id="markdown-preview">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Markdown Preview
                </h2>
                <p className="text-text-secondary mb-4">
                  The description field for epics and stories supports markdown formatting with a live preview:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li>By default, the preview is shown</li>
                  <li>Click the &quot;Edit&quot; button to switch to edit mode</li>
                  <li>Click the &quot;Preview&quot; button to see the rendered markdown</li>
                  <li>Supports headers, bold, italic, code blocks, lists, and links</li>
                </ul>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Markdown Syntax</h3>
                <div className="bg-surface border border-border-light rounded-lg p-4 mb-4">
                  <code className="text-sm">
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

              {/* Best Practices */}
              <section id="organizing-epics">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Organizing Epics
                </h2>
                <p className="text-text-secondary mb-4">
                  Tips for organizing your epics effectively:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li><strong>Group by feature</strong> - Each epic should represent a cohesive feature or module</li>
                  <li><strong>Keep them independent</strong> - Minimize dependencies between epics</li>
                  <li><strong>Use descriptive names</strong> - Epic names should clearly indicate their purpose</li>
                  <li><strong>Set clear goals</strong> - Write a detailed description of what success looks like</li>
                  <li><strong>Track progress</strong> - Regularly update epic status based on story completion</li>
                </ul>
              </section>

              <section id="writing-stories">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Writing Good Stories
                </h2>
                <p className="text-text-secondary mb-4">
                  Follow these guidelines for effective stories:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
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
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Acceptance Criteria Tips
                </h2>
                <p className="text-text-secondary mb-4">
                  Write clear acceptance criteria:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li><strong>Make them testable</strong> - Each criterion should be verifiable</li>
                  <li><strong>Be specific</strong> - Avoid vague language like &quot;works well&quot;</li>
                  <li><strong>Cover edge cases</strong> - Include error scenarios and validations</li>
                  <li><strong>Keep them independent</strong> - Each criterion should stand alone</li>
                  <li><strong>Focus on behavior</strong> - Describe what should happen, not how to implement it</li>
                </ul>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Good Examples</h3>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li>✅ &quot;Form validates email format and shows error message for invalid emails&quot;</li>
                  <li>✅ &quot;User can select a date from the date picker&quot;</li>
                  <li>✅ &quot;Save button is disabled when no changes are made&quot;</li>
                </ul>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Bad Examples</h3>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li>❌ &quot;Everything works correctly&quot;</li>
                  <li>❌ &quot;Use React Hook Form for validation&quot;</li>
                  <li>❌ &quot;It should be fast&quot;</li>
                </ul>
              </section>

              {/* Advanced */}
              <section id="direct-url-navigation">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Direct URL Navigation
                </h2>
                <p className="text-text-secondary mb-4">
                  You can navigate directly to specific epics and stories using URL parameters:
                </p>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">URL Format</h3>
                <div className="bg-surface border border-border-light rounded-lg p-4 mb-4">
                  <code className="text-sm">
                    <div># View a project</div>
                    <div>/projects/[project-name]</div>
                    <div>&nbsp;</div>
                    <div># View a specific epic</div>
                    <div>/projects/[project-name]?epic=[epic-id]</div>
                    <div>&nbsp;</div>
                    <div># View a specific story</div>
                    <div>/projects/[project-name]?epic=[epic-id]&story=[story-id]</div>
                  </code>
                </div>
                <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Examples</h3>
                <div className="bg-surface border border-border-light rounded-lg p-4 mb-4">
                  <code className="text-sm">
                    <div>/projects/healthcare-platform</div>
                    <div>/projects/healthcare-platform?epic=EPIC-0001</div>
                    <div>/projects/healthcare-platform?epic=EPIC-0001&story=STORY-001</div>
                  </code>
                </div>
                <p className="text-text-secondary mb-4">
                  These URLs can be bookmarked or shared with team members to link directly to specific work items.
                  The accordion will automatically expand to show the selected story.
                </p>
              </section>

              <section id="keyboard-shortcuts">
                <h2 className="text-3xl font-bold text-text-primary mb-4 pb-3 border-b border-border-light mt-12">
                  Keyboard Shortcuts
                </h2>
                <p className="text-text-secondary mb-4">
                  Keyboard shortcuts for common actions (planned for future release):
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                  <li><strong>Ctrl/Cmd + S</strong> - Save current epic or story</li>
                  <li><strong>Ctrl/Cmd + E</strong> - Toggle markdown preview</li>
                  <li><strong>Ctrl/Cmd + N</strong> - Create new story (when epic is selected)</li>
                  <li><strong>Escape</strong> - Deselect current item</li>
                </ul>
              </section>

              {/* Footer */}
              <section className="mt-12 pt-8 border-t border-border-light">
                <p className="text-text-secondary text-sm">
                  For technical documentation including installation, file structure, and JSON schemas, see{' '}
                  <Link href="/technical-docs" className="text-primary hover:underline">
                    Technical Documentation
                  </Link>.
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
