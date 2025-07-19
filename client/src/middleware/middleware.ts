/**
 * Next.js Middleware for Route Protection
 * 
 * This runs before every request to check authentication
 * Protects routes that require authentication
 * 
 * Execution flow:
 * 1. Runs on every request matching the config
 * 2. Checks for valid Supabase session
 * 3. Redirects unauthenticated users to login
 * 4. Allows authenticated users to proceed
 */

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Create a response object to modify
  const res = NextResponse.next()
  
  // Create a Supabase client configured for middleware
  // This client can read and write cookies in the request/response
  const supabase = createMiddlewareClient({ req, res })
  
  // Check if user has a valid session
  // This reads the auth cookies from the request
  const { data: { session } } = await supabase.auth.getSession()

  // Check if the request is for a protected route (starts with /dashboard)
  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    // No session found - redirect to login
    // Constructs absolute URL using the request's base URL
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // User is authenticated or accessing public route
  // Continue with the request
  return res
}

// Configuration object specifies which routes this middleware runs on
export const config = {
  // Match all routes starting with /dashboard
  // You can add more protected routes here
  matcher: [
    '/dashboard/:path*',
  ]
}