'use client'

import GoogleAuthButton from '@/components/GoogleAuthButton'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Login Page Component
 * 
 * Features:
 * - Displays login UI with Google OAuth button
 * - Automatically redirects authenticated users to dashboard
 * - Shows loading state during auth check
 * - Responsive design with Tailwind CSS
 */
export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter() // Next.js navigation hook for programmatic routing

  // Effect to redirect authenticated users
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router]) // Re-run when user or router changes

  if (loading) {
    return <div>Loading...</div>
  }

  // Main login UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {/* Container for login form */}
      <div className="max-w-md w-full space-y-8">
        {/* Header section */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to NoPlanNoFuture
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Stop being lazy! 💪
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Google OAuth button component */}
          <GoogleAuthButton />
        </div>
      </div>
    </div>
  )
}
