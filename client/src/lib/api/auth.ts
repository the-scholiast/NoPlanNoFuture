import { supabase } from '@/lib/supabaseClient'

export async function getAuthHeaders() {
  try {
    // Force a fresh session check
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Session error:', error)
      throw new Error(`Session error: ${error.message}`)
    }

    if (!session) {
      console.error('No session found')
      // Try to refresh the session
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError || !refreshedSession) {
        throw new Error('No authentication session - please login again')
      }

      console.log('Session refreshed successfully')
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshedSession.access_token}`
      }
    }

    if (!session.access_token) {
      throw new Error('No access token in session')
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      console.log('Token expired, refreshing...')
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError || !refreshedSession) {
        throw new Error('Token expired and refresh failed - please login again')
      }

      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshedSession.access_token}`
      }
    }

    console.log('Using valid token:', session.access_token.substring(0, 20) + '...')

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    }
  } catch (error) {
    console.error('Auth error:', error)
    throw error
  }
}