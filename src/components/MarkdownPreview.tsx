'use client'

import dynamic from 'next/dynamic'
import '@uiw/react-md-editor/markdown-editor.css'

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

interface MarkdownPreviewProps {
  value: string
  className?: string
}

export function MarkdownPreview({ value, className = '' }: MarkdownPreviewProps) {
  return (
    <div data-color-mode="light" className={`${className} markdown-preview-compact`}>
      <style jsx global>{`
        .markdown-preview-compact .w-md-editor-preview {
          font-size: 0.875rem;
          line-height: 1.4;
        }
        .markdown-preview-compact .w-md-editor-preview h1 {
          font-size: 2rem;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        .markdown-preview-compact .w-md-editor-preview h2 {
          font-size: 1.125rem;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }
        .markdown-preview-compact .w-md-editor-preview h3 {
          font-size: 1rem;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        .markdown-preview-compact .w-md-editor-preview h4 {
          font-size: 0.9375rem;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        .markdown-preview-compact .w-md-editor-preview h5,
        .markdown-preview-compact .w-md-editor-preview h6 {
          font-size: 0.875rem;
          margin-top: 0.75rem;
          margin-bottom: 0.375rem;
          font-weight: 600;
        }
        .markdown-preview-compact .w-md-editor-preview p {
          margin-top: 0.375rem;
          margin-bottom: 0.625rem;
          line-height: 1.4;
          font-size: 0.875rem !important;
        }
        .markdown-preview-compact .w-md-editor-preview ul,
        .markdown-preview-compact .w-md-editor-preview ol {
          margin-top: 0.375rem;
          margin-bottom: 0.625rem;
          padding-left: 1.25rem;
          font-size: 0.875rem !important;
        }
        .markdown-preview-compact .w-md-editor-preview li {
          margin-top: 0.1875rem;
          margin-bottom: 0.1875rem;
          line-height: 1.4;
          font-size: 0.875rem !important;
        }
        .markdown-preview-compact .w-md-editor-preview strong {
          font-weight: 600;
          font-size: inherit;
        }
        /* Ensure bold text in paragraphs doesn't exceed heading sizes */
        .markdown-preview-compact .w-md-editor-preview p strong {
          font-size: 0.875rem !important;
          font-weight: 600;
        }
        /* Ensure bold text is always smaller than any heading */
        .markdown-preview-compact .w-md-editor-preview p strong,
        .markdown-preview-compact .w-md-editor-preview li strong {
          font-size: 0.875rem !important;
        }
        .markdown-preview-compact .w-md-editor-preview table {
          font-size: 0.875rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        /* Keep table font size unchanged - don't override */
        .markdown-preview-compact .w-md-editor-preview table th,
        .markdown-preview-compact .w-md-editor-preview table td {
          font-size: 0.875rem !important;
          padding: 0.375rem 0.5rem;
        }
        /* Make topics and content appear on same line for patterns like "Topic: Content" */
        .markdown-preview-compact .w-md-editor-preview p:has(strong:first-child) {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
          align-items: baseline;
        }
        .markdown-preview-compact .w-md-editor-preview p:has(strong:first-child) strong {
          margin-right: 0.25rem;
          white-space: nowrap;
          font-size: 0.875rem !important;
          font-weight: 600;
        }
        /* Compact spacing for lists after headings */
        .markdown-preview-compact .w-md-editor-preview h3 + ul,
        .markdown-preview-compact .w-md-editor-preview h4 + ul,
        .markdown-preview-compact .w-md-editor-preview h3 + ol,
        .markdown-preview-compact .w-md-editor-preview h4 + ol {
          margin-top: 0.375rem;
        }
        /* Spacing between list items */
        .markdown-preview-compact .w-md-editor-preview li + li {
          margin-top: 0.1875rem;
        }
        /* Spacing between paragraphs */
        .markdown-preview-compact .w-md-editor-preview p + p {
          margin-top: 0.5rem;
        }
        /* Spacing between paragraphs and lists */
        .markdown-preview-compact .w-md-editor-preview p + ul,
        .markdown-preview-compact .w-md-editor-preview p + ol {
          margin-top: 0.375rem;
        }
        /* Spacing for nested lists */
        .markdown-preview-compact .w-md-editor-preview li ul,
        .markdown-preview-compact .w-md-editor-preview li ol {
          margin-top: 0.375rem;
          margin-bottom: 0.375rem;
        }
        /* Extra spacing after main sections (H1, H2) */
        .markdown-preview-compact .w-md-editor-preview h1 + *,
        .markdown-preview-compact .w-md-editor-preview h2 + * {
          margin-top: 1rem;
        }
        /* Extra spacing after sub-sections (H3, H4) */
        .markdown-preview-compact .w-md-editor-preview h3 + *,
        .markdown-preview-compact .w-md-editor-preview h4 + * {
          margin-top: 0.75rem;
        }
        /* Extra spacing between main sections */
        .markdown-preview-compact .w-md-editor-preview h1 + h2,
        .markdown-preview-compact .w-md-editor-preview h2 + h2,
        .markdown-preview-compact .w-md-editor-preview h2 + h3 {
          margin-top: 1.5rem;
        }
        /* Extra spacing between sub-sections */
        .markdown-preview-compact .w-md-editor-preview h3 + h4,
        .markdown-preview-compact .w-md-editor-preview h4 + h4,
        .markdown-preview-compact .w-md-editor-preview h4 + h5 {
          margin-top: 1rem;
        }
      `}</style>
      <MDEditor
        value={value}
        onChange={() => {}} // Read-only, no-op onChange
        preview="preview" // Preview mode only
        hideToolbar={true}
        visibleDragbar={false}
        height={400}
      />
    </div>
  )
}

