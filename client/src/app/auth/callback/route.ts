import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

/**
 * This is the authentication callback handler - it completes the login process.
 * 
 * Here's what happens when someone logs in:
 * 1. User clicks "Login with Google" (or other provider) on your app
 * 2. They get redirected to Google's login page
 * 3. After logging in successfully, Google sends them back to this page
 * 4. This function receives a special "code" from Google
 * 5. It exchanges that code for a real login session
 * 6. Finally, it redirects the user back to your app's home page, now logged in
 * 
 * Think of this as the "handshake" that completes the login process.
 * It's like showing your ID to a bouncer who then gives you a special wristband (JWT token) 
 * that proves you're allowed inside and contains your membership details.
 * 
 * The JWT (JSON Web Token) that gets created contains encrypted information about who you are
 * and gets automatically included in every future request you make to the app.
 * 
 * This function runs on the server (not in the browser) for security reasons.
 * The authentication code should only be processed on the server side.
 */
export async function GET(request: NextRequest) {
  // Get the current page URL so we can extract information from it
  const requestUrl = new URL(request.url)
  
  // Look for the special "code" that the authentication provider (like Google) sent back
  // This code is like a temporary ticket that proves the user successfully logged in
  const code = requestUrl.searchParams.get('code')

  // Only proceed if we actually received an authentication code
  if (code) {
    // Get access to the browser cookies (where login sessions are stored)
    const cookieStore = await cookies()

    // Create a server-side Supabase client that can handle cookies properly
    // This is different from the browser client because it runs on the server
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // Function to read all existing cookies (including any JWT tokens from previous sessions)
          getAll() {
            return cookieStore.getAll()
          },
          // Function to save new cookies (like the JWT login session token)
          setAll(cookiesToSet) {
            try {
              // Save each cookie that contains login information (primarily the JWT token)
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // If something goes wrong saving cookies, log it but don't crash
              console.error('Could not set cookies:', error)
            }
          },
        },
      }
    )

    // Exchange the temporary code for a real login session
    // This is like trading your temporary ticket for an actual membership card
    // What you get back is a JWT (JSON Web Token) - a secure, encrypted package that contains:
    // - Your user ID and email
    // - When the token expires (for security)
    // - What permissions you have
    // - A digital signature that proves it's authentic
    // This JWT gets stored in cookies and sent with every API request to prove who you are
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      // If the login process failed, log the error for debugging
      // The user will still get redirected, but they won't be logged in
      console.error('Auth callback error:', error)
    }
  }

  // Always redirect the user back to the home page, whether login succeeded or failed
  // If login succeeded, they'll be logged in when they arrive
  // If it failed, they'll still see the home page but remain logged out
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}