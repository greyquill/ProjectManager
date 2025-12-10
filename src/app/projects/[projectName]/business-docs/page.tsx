'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { MarkdownPreview } from '@/components/MarkdownPreview'
import { ArrowLeft } from 'lucide-react'

export default function BusinessDocsPage() {
  const params = useParams()
  const projectName = params.projectName as string
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true)
        const response = await fetch(`/api/projects/${projectName}/business-docs`)
        const result = await response.json()

        if (result.success) {
          setContent(result.data || '')
        } else {
          setError(result.error || 'Failed to load business documentation')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load business documentation')
      } finally {
        setLoading(false)
      }
    }

    if (projectName) {
      fetchContent()
    }
  }, [projectName])

  const displayProjectName = projectName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <div className="min-h-screen bg-background-light">
      <Header />
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href={`/projects/${projectName}`}
              className="inline-flex items-center text-sm text-text-secondary hover:text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {displayProjectName}
            </Link>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Business Documentation
            </h1>
            <p className="text-text-secondary text-sm">
              Implementation, pricing, compliance, and business strategy for {displayProjectName}
            </p>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-text-secondary">Loading documentation...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="prose prose-sm max-w-none">
              {content ? (
                <MarkdownPreview value={content} />
              ) : (
                <div className="text-center py-12 text-text-secondary">
                  <p>No business documentation available for this project.</p>
                  <p className="text-sm mt-2">
                    Create a <code className="px-1 py-0.5 bg-surface rounded">business-docs.md</code> file in{' '}
                    <code className="px-1 py-0.5 bg-surface rounded">pm/{projectName}/</code>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

