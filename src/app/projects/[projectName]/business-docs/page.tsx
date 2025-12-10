'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect to global business-docs page
export default function BusinessDocsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/business-docs')
  }, [router])

  return null
}
