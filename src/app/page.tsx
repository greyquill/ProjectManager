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
            Streamline your project management with real-time tracking, AI-powered insights,
            and seamless team collaboration. Everything you need to deliver projects on time.
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-Time Insights</h3>
              <p className="text-text-secondary text-sm">
                Track progress across all projects with live dashboards, analytics, and metrics.
                See exactly where your team stands at a glance.
              </p>
            </div>

            <div className="card p-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Efficiency</h3>
              <p className="text-text-secondary text-sm">
                Automatically break down epics into actionable stories, generate acceptance criteria,
                and get intelligent suggestions to accelerate your planning.
              </p>
            </div>

            <div className="card p-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Team Performance Tracking</h3>
              <p className="text-text-secondary text-sm">
                Monitor individual contributions, story points, and team velocity.
                Make data-driven decisions to optimize your team's productivity.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

