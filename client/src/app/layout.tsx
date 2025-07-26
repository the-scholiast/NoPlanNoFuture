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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Create a client component for the layout content
function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
            {/* Global Add Button - positioned to push content down */}
            <div className="flex justify-end mb-6">
              <Button
                className="h-12 w-12 rounded-full shadow-lg"
                size="icon"
                onClick={() => setIsAddModalOpen(true)}
                type="button"
              >
                <Plus className="h-6 w-6" />
              </Button>
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}