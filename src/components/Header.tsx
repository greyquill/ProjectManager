import Link from 'next/link'
import { FolderKanban } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b border-border-light bg-surface sticky top-0 z-50">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <FolderKanban className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-text-primary">
              Project Manager
            </h1>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/projects"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/people"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              People
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

