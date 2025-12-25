/**
 * Supabase Admin Client for Server-Side Operations in Next.js API Routes
 * 
 * This file creates a Supabase client with service role privileges
 * Used for server-side operations that bypass Row Level Security (RLS)
 * 
 * Security notes:
 * - Service role key has full database access
 * - NEVER expose this key to the client
 * - Only use in Next.js API routes (server-side)
 */
import { createClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// Create Supabase client with service role key
// Service role key bypasses RLS and has full access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default supabase

