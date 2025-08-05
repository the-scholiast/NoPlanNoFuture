'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import TodoBoard from '@/components/todo/TodoBoard';
import { NavSidebar } from "@/components/navBar/navBar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

interface Sentence {
  id: number;
  content: string;
  created_at: string;
  created_by?: string;
}

// Sentence App Component (when not logged in)
function SentenceApp() {
  const [currentSentence, setCurrentSentence] = useState<string>('Blowing solves everything :D');
  const [inputValue, setInputValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Fetch a random sentence on component mount
  useEffect(() => {
    fetchRandomSentence();
  }, []);

  const fetchRandomSentence = async () => {
    try {
      const { data, error } = await supabase
        .from('sentences')
        .select('content')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sentences:', error);
        return;
      }

      if (data && data.length > 0) {
        // Get a random sentence from all sentences
        const randomIndex = Math.floor(Math.random() * data.length);
        setCurrentSentence(data[randomIndex].content);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const submitSentence = async () => {
    if (!inputValue.trim()) {
      setMessage('Please enter a sentence!');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const { data, error } = await supabase
        .from('sentences')
        .insert([
          {
            content: inputValue.trim(),
            created_by: 'Anonymous' // can modify this to track users if needed
          }
        ]);

      if (error) {
        console.error('Error inserting sentence:', error);
        setMessage('Failed to submit sentence. Please try again.');
      } else {
        setMessage('Sentence submitted successfully! 🎉');
        setInputValue('');
        // Optionally refresh the current sentence
        setTimeout(() => {
          fetchRandomSentence();
          setMessage('');
        }, 2000);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitSentence();
    }
  };

  return (
    <SidebarProvider>
      <NavSidebar />
      <SidebarInset>
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6">
          <h1 className="text-2xl font-bold mb-4">No Meow no meow-meow</h1>

          <Image
            src="/images/banner.png"
            alt="Banner"
            width={300}
            height={150}
            priority
            className="mb-6"
          />

          <div className="text-center">
            <div className="mb-6">
              <div className='flex space-x-1'>
                <h2 className="text-lg font-semibold mb-2">Sentence of the day: </h2>
                <p className="text-xl italic text-blue-300 mb-4">"{currentSentence}"</p>
              </div>
              <Button
                onClick={fetchRandomSentence}
                variant="outline"
                size="sm"
                className="mb-4"
              >
                Get Me a new one!
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-md font-medium">Share your own sentence:</h3>
              <div className="flex gap-2 max-w-md mx-auto items-center justify-center">
                <Textarea
                  placeholder='Say something inspiring...'
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={isSubmitting}
                />
                <Button
                  onClick={submitSentence}
                  disabled={isSubmitting || !inputValue.trim()}
                  className="whitespace-nowrap"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>

              {message && (
                <p className={`text-sm ${message.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
                  {message}
                </p>
              )}
            </div>

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
      </SidebarInset>
    </SidebarProvider>
  );
}

// Todo App Component (when logged in) - No changes needed since it's already wrapped by the layout
function TodoApp() {
  const handleAddTasks = () => {
    // Tasks are automatically refreshed via TodoContext
  };

  return (
    <TodoBoard onAddTasks={handleAddTasks} />
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