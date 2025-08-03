"use client"

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavSidebar } from "@/components/navBar/navBar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AddTaskModal from "@/components/todo/AddTaskModal";
import UniversalDateNavigation from "@/components/calendar/UniversalDateNavigation";
import UniversalBreadcrumb from "@/components/calendar/UniversalBreadcrumb";
import { usePathname } from "next/navigation";
import TodoModalButton from "@/components/todo/TodoModalButton";
import Providers from "@/components/QueryProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Helper function to determine if breadcrumb should be shown
function shouldShowBreadcrumb(pathname: string): boolean {
  // Show breadcrumb on calendar and gym routes (but not root section pages)
  return (pathname.startsWith('/calendar') && pathname !== '/calendar') ||
    (pathname.startsWith('/gym') && pathname !== '/gym')
}

// Helper function to not show Todo modal button and Add task button on home page
function hideTodoButtons(pathname: string): boolean {
  return pathname != '/'
}

// Create a client component for the layout content
function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const pathname = usePathname();

  const handleAddTasks = (tasks: any[]) => {
    // implement global task management 
    console.log('Tasks added:', tasks);
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider>
        <NavSidebar />
        <SidebarInset>
          <main className="p-6">
            {hideTodoButtons(pathname) && (
              <div>
                {shouldShowBreadcrumb(pathname) ? (
                  <div className="mb-2 flex justify-between">
                    <UniversalBreadcrumb />
                    <TodoModalButton />
                  </div>
                ) : (
                  <div className="mb-2 flex justify-end">
                    <TodoModalButton />
                  </div>
                )}
              </div>
            )}

            {/* Header with Date Navigation and Add Button aligned */}
            <div className="flex items-center justify-between mb-6">
              {/* Left spacer for balance */}
              <div className="w-12"></div>

              {/* Center: Date Navigation */}
              <UniversalDateNavigation />

              {/* Right: Add Button */}
              {hideTodoButtons(pathname) && (
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

            {/* Add Task Modal */}
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}