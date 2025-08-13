import { supabase } from '@/lib/supabaseClient'

export async function getAuthHeaders() {
 try {
   // Force a fresh session check
   const { data: { session }, error } = await supabase.auth.getSession()

   if (error) {
     throw new Error(`Session error: ${error.message}`)
   }

   if (!session) {
     // Try to refresh the session
     const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()

     if (refreshError || !refreshedSession) {
       throw new Error('No authentication session - please login again')
     }

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
     const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()

     if (refreshError || !refreshedSession) {
       throw new Error('Token expired and refresh failed - please login again')
     }

     return {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${refreshedSession.access_token}`
     }
   }

   return {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${session.access_token}`
   }
 } catch (error) {
   throw error
 }
}