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

// Create a client with optimized settings
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

// Helper function to determine if breadcrumb should be shown
function shouldShowBreadcrumb(pathname: string): boolean {
  return (pathname.startsWith('/calendar') && pathname !== '/calendar' && !pathname.startsWith('/calendar/shared'))
    // (pathname.startsWith('/gym') && pathname !== '/gym')
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

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
      <SidebarProvider>
        <NavSidebar />
        <SidebarInset>
          <main className="p-6 flex flex-col h-full overflow-hidden">
            <div className="flex-shrink-0">
              {shouldShowBreadcrumb(pathname) ? (
                <div className="mb-2 flex justify-between">
                  <UniversalBreadcrumb />
                  {!['/memo', '/'].includes(pathname) && (
                    <div className="flex items-center gap-2">
                      <TodoModalButton />
                      <Button
                        className="h-8 w-8 rounded-full shadow-lg"
                        size="icon"
                        onClick={() => setIsAddModalOpen(true)}
                        type="button"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-2 flex justify-end">
                  {!['/memo', '/'].includes(pathname) && (
                    <div className="flex items-center gap-2">
                      <TodoModalButton />
                      <Button
                        className="h-8 w-8 rounded-full shadow-lg"
                        size="icon"
                        onClick={() => setIsAddModalOpen(true)}
                        type="button"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center mb-3 flex-shrink-0">
              <UniversalDateNavigation />
            </div>

            <div className="flex-1 min-h-0">
              {children}
            </div>

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
      <LayoutContent>
        {children}
      </LayoutContent>
    </QueryClientProvider>
  );
}