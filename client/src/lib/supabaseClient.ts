import { createBrowserClient } from '@supabase/ssr'

/**
 * This creates the main connection to Supabase backend database and authentication system.
 * Think of it as setting up a phone line to talk to your server where all your data is stored.
 * 
 * What Supabase provides:
 * - Database storage for all your tasks, workouts, calendar events, and user data
 * - User authentication (login, signup, password management)
 * - Real-time updates (when data changes, your app updates automatically)
 * - File storage for any images or documents
 * - Automatic API generation (no need to write backend code for basic operations)
 * 
 * This client is used throughout the entire app whenever you need to:
 * - Save or fetch data (tasks, workouts, calendar events)
 * - Handle user login/logout
 * - Check if someone is authenticated
 * - Subscribe to real-time data changes
 * 
 * The configuration uses environment variables for security:
 * - NEXT_PUBLIC_SUPABASE_URL: The address of your specific Supabase project
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: A public key that allows basic access (safe to expose in browser)
 * 
 * Note: This is a browser client, meaning it runs in the user's web browser.
 * For server-side operations, you'd use a different client configuration.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, // Unique Supabase project URL
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Public API key for browser access

)