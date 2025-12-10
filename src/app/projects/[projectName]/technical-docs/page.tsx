'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect to global technical-docs page
export default function TechnicalDocsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/technical-docs')
  }, [router])

  return null
}
