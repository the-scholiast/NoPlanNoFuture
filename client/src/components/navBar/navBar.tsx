'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader
} from "@/components/ui/sidebar"
import Link from "next/link";
import { Switch } from "../ui/switch";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

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
    url: "/gym",
  },
  {
    title: "To Do",
    url: "/todo",
  },
  {
    title: "Stats",
    url: "/stats",
  },
]

export function NavSidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering theme-dependent content
  // Prevents hydration issues where server renders theme without knowing client state
  useEffect(() => {
    setMounted(true);
  }, [])

  const toggleTheme = () => {
    setTheme(theme == 'dark' ? 'light' : 'dark')
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
        {/* Connect to logout function */}
        <div className="px-3 py-2">
          <span>Login</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}