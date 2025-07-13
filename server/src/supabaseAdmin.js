/**
 * Supabase Admin Client for Server-Side Operations
 * 
 * This file creates a Supabase client with service role privileges
 * Used for server-side operations that bypass Row Level Security (RLS)
 * 
 * Security notes:
 * - Service role key has full database access
 * - NEVER expose this key to the client
 * - Only use in secure server environments
 */

import 'dotenv/config' // Automatically loads .env file
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key
// Service role key bypasses RLS and has full access
const supabase = createClient(
  process.env.SUPABASE_URL,        
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Verify JWT tokens from the client
 * 
 * Use this to validate tokens in your Express API endpoints
 * 
 * @param {string} token - JWT token from Authorization header
 * @returns {Promise<User>} - User object if valid
 * @throws {Error} - If token is invalid or expired
 * 
 * Example usage in Express:
 * app.get('/api/protected', async (req, res) => {
 *   try {
 *     const token = req.headers.authorization?.replace('Bearer ', '')
 *     const user = await verifyToken(token)
 *     res.json({ message: 'Authorized', user })
 *   } catch (error) {
 *     res.status(401).json({ error: 'Unauthorized' })
 *   }
 * })
 */
export const verifyToken = async (token) => {
  // getUser validates the token and returns user data
  const { data, error } = await supabase.auth.getUser(token)

  if (error) throw error

  return data.user
}

export default supabase