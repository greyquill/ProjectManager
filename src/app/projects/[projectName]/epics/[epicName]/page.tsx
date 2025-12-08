'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

// Redirect to project page - editing happens in place now
export default function EpicDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectName = params.projectName as string

  useEffect(() => {
    router.replace(`/projects/${projectName}`)
  }, [projectName, router])

  return null
}
