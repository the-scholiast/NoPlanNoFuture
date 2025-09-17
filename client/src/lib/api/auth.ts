import { supabase } from '@/lib/supabaseClient'

/**
 * This function creates the authorization headers needed to make secure API calls.
 * Think of it as getting your "ID card" that proves you're logged in when talking to the server.
 * 
 * What it does:
 * - Checks if you're currently logged in
 * - Gets your authentication token (like a temporary password)
 * - Refreshes expired tokens automatically
 * - Returns properly formatted headers for API requests
 * 
 * This is used every time you need to fetch data from your backend that requires authentication,
 * like getting tasks, workout data, or calendar events.
 * 
 * @returns Promise that resolves to HTTP headers with authorization token
 * @throws Error if user is not authenticated or tokens can't be refreshed
 */
export async function getAuthHeaders() {
  try {
    // Check if there's currently an active login session
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      throw new Error(`Session error: ${error.message}`)
    }

    // If no session exists, try to refresh it automatically
    if (!session) {
      // Attempt to get a fresh login session using stored refresh tokens
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError || !refreshedSession) {
        throw new Error('No authentication session - please login again')
      }

      // Return headers with the fresh authentication token
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshedSession.access_token}`
      }
    }

    // Safety check - make sure the session actually contains an access token
    if (!session.access_token) {
      throw new Error('No access token in session')
    }

    // Check if the current token has expired
    const now = Math.floor(Date.now() / 1000) // Current time in seconds
    if (session.expires_at && session.expires_at < now) {
      // Token is expired, try to get a new one automatically
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError || !refreshedSession) {
        throw new Error('Token expired and refresh failed - please login again')
      }

      // Return headers with the new authentication token
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshedSession.access_token}`
      }
    }

    // Session is valid and not expired, return headers with current token
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    }
  } catch (error) {
    throw error
  }
}