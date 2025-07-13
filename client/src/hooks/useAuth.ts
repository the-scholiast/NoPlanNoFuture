'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { User } from "@supabase/supabase-js"

/**
 * Custom hook for authentication state management
 * 
 * Features:
 * - Provides current user object
 * - Loading state during initial session check
 * - Sign out functionality
 * - Automatically updates when auth state changes
 * 
 * Usage:
 * const { user, loading, signOut } = useAuth()
 */

export function useAuth() {
  // State to store the current user object
  // null means no authenticated user
  const [user, setUser] = useState<User | null>(null)
  // Loading state to prevent flash of unauthenticated content
  // Starts as true, set to false after initial session check
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on component mount
    // This handles page refreshes and initial app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Set user from session (or null if no session)
      setUser(session?.user ?? null)
      setLoading(false) // Session check complete, stop loading
    })

    // Subscribe to auth state changes
    // This listener fires when:
    // - User signs in
    // - User signs out
    // - Session is refreshed
    // - User data is updated
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Update user state whenever auth state changes
        // _event parameter tells us what happened (SIGNED_IN, SIGNED_OUT, etc.)
        // but we only care about the resulting session
        setUser(session?.user ?? null)
      }
    )

    // Cleanup function - unsubscribe when component unmounts
    // Prevents memory leaks and duplicate listeners
    return () => subscription.unsubscribe()
  }, [])

  /**
   * Signs out the current user
   * Clears the session and removes auth cookies
   * The onAuthStateChange listener will automatically update the user state
   */
  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, loading, signOut } // Return authentication state and methods
}
