'use client'

import GoogleAuthButton from '@/components/login/GoogleAuthButton'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (user) {
      // Check if there's a return URL
      const returnTo = searchParams.get('returnTo')

      if (returnTo && returnTo !== '/login') {
        // Redirect to the intended page
        router.push(returnTo)
      } else {
        // No return URL, go home
        router.push('/')
      }
    }
  }, [user, router, searchParams])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div>Loading...</div>
    </div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to NoPlanNoFuture
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Stop being lazy! 💪
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <GoogleAuthButton />
        </div>
      </div>
    </div>
  )
}