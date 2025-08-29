'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader
} from "@/components/ui/sidebar"
import Link from "next/link";
import { Switch } from "../ui/switch";
import { Moon, Sun, LogIn, LogOut, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

interface MenuItem {
  title: string;
  url: string;
}

// Menu items
const items: MenuItem[] = [
  {
    title: "Home",
    url: "/",
  },
  {
    title: "Calendar",
    url: "/calendar",
  },
  {
    title: "Planner",
    url: "/calendar/planner",
  },
  {
    title: "Gym",
    url: "/gym/workout",
  },
  {
    title: "To Do",
    url: "/todo",
  },
  // FOR FUTURE VERSION
  // {
  //   title: "Stats",
  //   url: "/stats",
  // },
  {
    title: "Memo",
    url: "/memo",
  },
  {
    title: "Shares",
    url: "/calendar/shares",
  },
]

export function NavSidebar() {
  const { theme, setTheme } = useTheme();
  const { user, loading, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering theme-dependent content
  // Prevents hydration issues where server renders theme without knowing client state
  useEffect(() => {
    setMounted(true);
  }, [])

  const toggleTheme = () => {
    setTheme(theme == 'dark' ? 'light' : 'dark')
  }

  const handleGoogleLogin = async () => {
    try {
      // Initiate OAuth flow with Google as the provider
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            // Request offline access to get refresh token
            access_type: 'offline',
            // Force the consent screen to appear
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
    } catch (error) {
      console.error('Error logging in with Google:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <Sidebar>
      {/* Replace with app icon */}
      <SidebarHeader className="text-2xl font-semibold mx-2">No Plan No Future</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="lg" className="text-lg">
                    <Link href={item.url}>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* Theme Toggle */}
        <div className="flex items-center justify-between px-3 py-2 border-t">
          <div className="flex items-center gap-2">
            {mounted && (
              <>
                <Sun className="h-4 w-4" />
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                  aria-label="Toggle dark mode"
                />
                <Moon className="h-4 w-4" />
              </>
            )}
          </div>
        </div>

        {/* Authentication Section */}
        <div className="px-3 py-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              Loading...
            </div>
          ) : user ? (
            <div className="space-y-2">
              {/* User Info */}
              <Link href="/profile" className="flex items-center gap-2 text-sm transition-colors py-2 rounded-md hover:bg-accent">
                <User className="h-4 w-4" />
                <span className="truncate">{user.email}</span>
              </Link>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full text-sm text-red-600 hover:text-red-700 py-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            /* Login Button */
            <button
              onClick={handleGoogleLogin}
              className="flex items-center gap-2 w-full text-sm text-blue-600 hover:text-blue-700 py-1"
            >
              <LogIn className="h-4 w-4" />
              Sign in with Google
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}