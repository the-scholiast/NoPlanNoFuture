"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

// Custom hook for managing workout authentication state
// Handles session validation and auth readiness for API calls
export function useWorkoutAuth() {
  const { user, loading: authLoading } = useAuth();
  const [authReady, setAuthReady] = useState(false);

  // Wait for authentication to be ready
  useEffect(() => {
    const waitForAuth = async () => {
      if (authLoading) {
        console.log('Waiting for auth to load...');
        return;
      }

      if (!user) {
        console.log('No user found after auth loading');
        setAuthReady(false);
        return;
      }

      // Wait a bit more and verify session
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Final session check:', {
          hasSession: !!session,
          hasToken: !!session?.access_token,
          userId: user.id,
          email: user.email
        });

        if (session?.access_token) {
          console.log('Auth ready for API calls');
          setAuthReady(true);
        } else {
          console.log('Session not ready, retrying...');
          // Retry once more
          setTimeout(() => waitForAuth(), 1000);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthReady(false);
      }
    };

    waitForAuth();
  }, [user, authLoading]);

  return {
    user,
    authLoading,
    authReady
  };
}