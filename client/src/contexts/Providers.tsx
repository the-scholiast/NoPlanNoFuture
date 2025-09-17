'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavSidebar } from "@/components/navBar/navBar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddTaskModal } from "@/components/todo/";
import UniversalDateNavigation from "@/components/calendar/UniversalDateNavigation";
import UniversalBreadcrumb from "@/components/calendar/UniversalBreadcrumb";
import { usePathname } from "next/navigation";
import TodoModalButton from "@/components/todo/global/TodoModalButton";
import { useAuth } from '@/hooks/useAuth';
import { TaskData } from '@/types/todoTypes';

/**
 * This creates a client that manages data fetching and caching for the entire app.
 * Smart cache that automatically fetches data from the backend
 * and keeps it fresh across the entire application.
 * 
 * The settings tell it:
 * - Always get fresh data when a page loads
 * - Try 3 times if a request fails
 * - Don't waste bandwidth refetching when you just click back to a tab
 * - Do get fresh data if your internet reconnects
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      retry: 3,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

/**
 * This function decides whether to show breadcrumb navigation (like "Year View > Month View > Week View").
 * Currently shows breadcrumbs on calendar pages (except the main calendar page).
 */
function shouldShowBreadcrumb(pathname: string): boolean {
  return (pathname.startsWith('/calendar') && pathname !== '/calendar' && !pathname.startsWith('/calendar/shared'))
    // (pathname.startsWith('/gym') && pathname !== '/gym')
}

/**
 * This is the main layout wrapper that creates the structure for the entire app.
 * It provides the basic structure that every page uses.
 * 
 * What it provides:
 * - A sidebar navigation menu (only for logged-in users)
 * - A top bar with breadcrumbs and quick action buttons
 * - Date navigation arrows
 * - A floating "+" button to add tasks
 * - Dark/light theme switching capability
 * - A modal for adding new tasks
 * 
 * It automatically changes what it shows based on whether someone is logged in or not.
 */
function LayoutContent({ children }: { children: React.ReactNode }) {
  // Tracks whether the "Add Task" modal window is currently open
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Gets the current page URL (like "/calendar/week" or "/gym/workout")
  const pathname = usePathname();
  // Checks if someone is currently logged into the app
  const { user } = useAuth();

  // Used for debugging
  const handleAddTasks = (tasks: TaskData[]) => {
    console.log('Tasks added:', tasks);
  };

  // For non-logged in users, show content without sidebar
  if (!user) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    );
  }

  // For logged in users, always show sidebar layout
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {/* This creates the sidebar layout structure */}
      <SidebarProvider>
        {/* The left sidebar with navigation menu */}
        <NavSidebar />
        {/* The main content area */}
        <SidebarInset>
          <main className="p-6">
            {/* 
              Top navigation area that changes based on the current page.
              Some pages show breadcrumbs (like "Calendar > Week View"), others don't.
              Right side contains the todo tasks modal and button.
            */}
            <div>
              {shouldShowBreadcrumb(pathname) ? (
                <div className="mb-2 flex justify-between">
                  <UniversalBreadcrumb />
                  {!['/memo', '/'].includes(pathname) && <TodoModalButton />}
                </div>
              ) : (
                <div className="mb-2 flex justify-end">
                  {!['/memo', '/'].includes(pathname) && <TodoModalButton />}
                </div>
              )}
            </div>
            {/* 
              Main navigation bar with three sections:
              - Left: Empty spacer (to center the date navigation)
              - Center: Date navigation arrows   
              - Right: Round "+" button to add new tasks
            */}
            <div className="flex items-center justify-between mb-6">
              <div className="w-12"></div>
              <UniversalDateNavigation />
              {!['/memo', '/'].includes(pathname) && (
                <Button
                  className="h-12 w-12 rounded-full shadow-lg"
                  size="icon"
                  onClick={() => setIsAddModalOpen(true)}
                  type="button"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              )}
            </div>
            {/* This is where the actual page content gets displayed */}
            {children}
            {/* 
              Modal window for adding new tasks. It floats over the page content
              and can be opened from any page using the "+" button above.
            */}
            <AddTaskModal
              open={isAddModalOpen}
              onOpenChange={setIsAddModalOpen}
              onAddTasks={handleAddTasks}
            />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
/**
 * This is the root provider component that wraps the entire application.
 * Provides essential services to every page.
 * 
 * What it provides to your entire app:
 * 1. Data fetching and caching (React Query) - automatically manages API calls
 * 2. App layout and navigation structure - sidebar, breadcrumbs, date navigation arrows
 * 3. Theme switching (dark/light mode) - users can switch between themes
 * 4. Authentication-aware layouts - different layouts for logged in vs logged out users
 * 5. Global task creation modal - consistent way to add tasks from anywhere
 * 6. Global task list modal - see tasks anywhere
 * 
 * This component must wrap the entire app in the root layout file.
 * Every page will automatically get these features without having to set them up individually.
 * 
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LayoutContent>
        {children}
      </LayoutContent>
    </QueryClientProvider>
  );
}