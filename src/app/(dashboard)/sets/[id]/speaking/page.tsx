'use client'

import { useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

export default function SetSpeakingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()

  useEffect(() => {
    router.replace(`/sets/${resolvedParams.id}/flashcards`)
  }, [router, resolvedParams.id])

  return null
}
