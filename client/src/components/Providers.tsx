'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoProvider } from '@/contexts/TodoContext';
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

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
    },
  },
});

// Helper function to determine if breadcrumb should be shown
function shouldShowBreadcrumb(pathname: string): boolean {
  // Show breadcrumb on calendar and gym routes (but not root section pages)
  return (pathname.startsWith('/calendar') && pathname !== '/calendar') ||
    (pathname.startsWith('/gym') && pathname !== '/gym')
}

// Helper function to check if we should show the sidebar layout
function shouldShowSidebar(pathname: string): boolean {
  const { user } = useAuth();
  // Show sidebar for logged in users on all routes except login/register pages
  return !!user;
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const handleAddTasks = (tasks: any[]) => {
    // implement global task management 
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
      <SidebarProvider>
        <NavSidebar />
        <SidebarInset>
          <main className="p-6">
            {/* Always show TodoModalButton for logged in users */}
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

            {/* Header with Date Navigation and Add Button aligned */}
            <div className="flex items-center justify-between mb-6">
              {/* Left spacer for balance */}
              <div className="w-12"></div>

              {/* Center: Date Navigation */}
              <UniversalDateNavigation />

              {/* Right: Add Button - always show for logged in users */}
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

            {children}

            {/* Add Task Modal - always available for logged in users */}
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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TodoProvider>
        <LayoutContent>
          {children}
        </LayoutContent>
      </TodoProvider>
    </QueryClientProvider>
  );
}