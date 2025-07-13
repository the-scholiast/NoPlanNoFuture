/**
 * OAuth Callback Route Handler
 * 
 * This route handles the callback from Google after authentication
 * Google redirects here with an authorization code that we exchange for a session
 * 
 * Flow:
 * 1. User clicks "Sign in with Google"
 * 2. User authenticates with Google
 * 3. Google redirects to this route with a code parameter
 * 4. We exchange the code for a Supabase session
 * 5. Redirect user to the dashboard
 */

import { supabase } from '@/lib/supabaseClient'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Parse the request URL to extract query parameters
  const requestUrl = new URL(request.url)
  // Extract the authorization code from the query parameters
  // This code is provided by Google after successful authentication
  const code = requestUrl.searchParams.get('code')

  if (code) {
    // Exchange the authorization code for a Supabase session
    // This creates a session and stores auth cookies
    // The session includes:
    // - Access token (for API requests)
    // - Refresh token (to renew expired sessions)
    // - User information from Google
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}