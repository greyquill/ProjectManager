'use client'

import Link from 'next/link'
import { FolderKanban } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border-light bg-surface">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-text-primary">
                Project Manager
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-text-primary mb-6">
            AI-Native Project Management
          </h1>
          <p className="text-xl text-text-secondary mb-8">
            File-based, type-safe project management with AI-powered epic breakdown
            and story generation. Every epic and story is a JSON file in your repo.
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link href="/projects" className="btn-primary">
              View Projects
            </Link>
            <Link href="/projects" className="btn-outline">
              Get Started
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="card p-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">File-Based & Type-Safe</h3>
              <p className="text-text-secondary text-sm">
                Every epic and story is a JSON file checked into your repo.
                Full version control and collaboration.
              </p>
            </div>

            <div className="card p-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
              <p className="text-text-secondary text-sm">
                Use Cursor AI to expand epics into stories, generate acceptance criteria,
                and suggest technical breakdowns.
              </p>
            </div>

            <div className="card p-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Dev-First</h3>
              <p className="text-text-secondary text-sm">
                Lives next to your code, editable in your repo. The UI is just a
                better interface over JSON files.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

