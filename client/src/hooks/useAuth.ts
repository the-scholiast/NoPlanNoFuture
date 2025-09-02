'use client'

import { useEffect, useState } from "react"
import { createBrowserClient } from '@supabase/ssr'
import { User } from "@supabase/supabase-js"
import { apiCall } from '@/lib/api/client' 

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Create Supabase client for browser
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Save user timezone to profile on login
  const saveUserTimezone = async (userId: string) => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Check if already saved to avoid unnecessary API calls
      const lastSavedTimezone = localStorage.getItem('user_timezone');
      if (lastSavedTimezone === timezone) {
        return;
      }

      await apiCall('/profile', {
        method: 'PATCH',
        body: JSON.stringify({ timezone }),
      });

      localStorage.setItem('user_timezone', timezone);
      console.log('User timezone saved:', timezone);
    } catch (error) {
      console.error('Failed to save user timezone:', error);
    }
  };

  useEffect(() => {
    let hasProcessedLogin = false;

    // Check for existing session on component mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)

      // Save timezone for existing session
      if (session?.user && !hasProcessedLogin) {
        hasProcessedLogin = true;
        saveUserTimezone(session.user.id);
      }
    })

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)

        // Save timezone when user signs in
        if (event === 'SIGNED_IN' && session?.user && !hasProcessedLogin) {
          hasProcessedLogin = true;
          await saveUserTimezone(session.user.id);
        }

        // Reset flag when user signs out
        if (event === 'SIGNED_OUT') {
          hasProcessedLogin = false;
          localStorage.removeItem('user_timezone');
        }
      }
    )

    // Cleanup function
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Signs out the current user
  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, loading, signOut }
}