import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Project Manager - AI-Native Project Management',
  description:
    'File-based, type-safe project management tool with AI-powered story generation and epic breakdown.',
  keywords: [
    'project management',
    'ai-native',
    'file-based',
    'epic',
    'story',
    'agile',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background-light font-display text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}

