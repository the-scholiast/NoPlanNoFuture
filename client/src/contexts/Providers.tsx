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

// Create a client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      retry: 4,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// Helper function to determine if breadcrumb should be shown
function shouldShowBreadcrumb(pathname: string): boolean {
  return (pathname.startsWith('/calendar') && pathname !== '/calendar') ||
    (pathname.startsWith('/gym') && pathname !== '/gym')
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const handleAddTasks = (tasks: any[]) => {
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

            {children}

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