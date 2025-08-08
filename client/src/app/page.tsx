'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus } from "lucide-react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { NavSidebar } from "@/components/navBar/navBar"
import { useAuth } from '@/hooks/useAuth'
import TodoBoard from '@/components/todo/TodoBoard'
import CompletedTasks from '@/components/todo/CompletedTasks/CompletedTasks'

// Sentence App Component (when not logged in)
function SentenceApp() {
  const [sentence, setSentence] = useState('')
  const [tasks, setTasks] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const addTask = () => {
    if (sentence.trim() !== '') {
      setTasks([...tasks, sentence.trim()])
      setSentence('')
      setMessage('Task added successfully!')
      setMessageType('success')

      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const removeTask = (index: number) => {
    const newTasks = tasks.filter((_, i) => i !== index)
    setTasks(newTasks)
    setMessage('Task removed!')
    setMessageType('success')

    // Clear message after 3 seconds
    setTimeout(() => setMessage(''), 3000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask()
    }
  }

  return (
    <SidebarProvider>
      <NavSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
                  Simple Task Manager
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Add tasks and manage them easily
                </p>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add New Task
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter a task..."
                      value={sentence}
                      onChange={(e) => setSentence(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button onClick={addTask} disabled={!sentence.trim()}>
                      Add Task
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {tasks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Tasks ({tasks.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {tasks.map((task, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <span className="text-gray-800 dark:text-white flex-1">
                            {task}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTask(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status Message */}
              {message && (
                <p className={`text-center mt-4 font-medium ${messageType === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                  {message}
                </p>
              )}

              {/* Login prompt - Updated since user can now sign in via sidebar */}
              <div className="mt-8 p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">
                  Want to access your personal todo app and more features?
                </p>
                <p className="text-sm text-muted-foreground">
                  Sign in using the sidebar to get started! 👈
                </p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Todo App Component (when logged in) - Now includes all todo page components
function TodoApp() {
  const handleAddTasks = () => {
    // Tasks are automatically refreshed via TodoContext
  };

  return (
    <div className="flex-1">
      {/* Header positioned to align with the add button that's above */}
      <div className="flex items-center justify-center -mt-18 mb-6 h-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600">
            To Do
          </h1>
        </div>
      </div>

      <TodoBoard onAddTasks={handleAddTasks} />
      <CompletedTasks />
    </div>
  );
}

// Main Page Component
export default function HomePage() {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show todo app if user is logged in, otherwise show sentence app with navbar
  return user ? <TodoApp /> : <SentenceApp />;
}