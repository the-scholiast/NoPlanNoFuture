import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request: req,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Check if user has a valid session
  const { data: { session } } = await supabase.auth.getSession()

  // Protect specific routes that require authentication
  const protectedPaths = ['/gym', '/todo', '/stats', '/calendar', '/memo']
  const isProtectedRoute = protectedPaths.some(path =>
    req.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedRoute && !session) {
    // No session found - redirect to login with return URL
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('returnTo', req.nextUrl.pathname + req.nextUrl.search)

    console.log(`Redirecting unauthenticated user from ${req.nextUrl.pathname} to /login`)
    return NextResponse.redirect(loginUrl)
  }

  // Return the response with potentially updated cookies
  return supabaseResponse
}

// Configuration object specifies which routes this middleware runs on
export const config = {
  // Match protected routes
  matcher: [
    '/gym/:path*',
    '/todo/:path*',
    '/stats/:path*',
    '/calendar/:path*'
  ]
}