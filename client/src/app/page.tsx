'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from '@/hooks/useAuth';
import GoogleAuthButton from '@/components/login/GoogleAuthButton';
import { useMemo } from "react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [currentSentence, setCurrentSentence] = useState<string>('Blowing solves everything :D');
  const [inputValue, setInputValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const banners = useMemo(() => [
    "/images/banner1.png",
    "/images/banner2.png",
    "/images/banner3.png",
    "/images/banner4.png"
  ], []);

  const [currentBanner, setCurrentBanner] = useState(banners[0]);

  useEffect(() => {
    //choose one banner from the pool
    const randomIndex = Math.floor(Math.random() * banners.length);
    setCurrentBanner(banners[randomIndex]);
  }, [banners]);

  // Fetch a random sentence on component mount
  useEffect(() => {
    if (user) {
      fetchRandomSentence();
    }
  }, [user]);

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
      const { error } = await supabase
        .from('sentences')
        .insert([
          {
            content: inputValue.trim(),
            created_by: 'Anonymous' // You can modify this to track users if needed
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

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Show login prompt for non-logged in users
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background text-foreground -m-6">
        <h1 className="text-4xl font-bold mb-4">No Meow no meow-meow</h1>

        <Image
          src={currentBanner}
          alt="Banner"
          width={300}
          height={150}
          priority
          className="mb-4"
        />

        <p className="mt-2 text-center text-sm text-gray-600">
          Stop being lazy, Sign in and get started! 💪
        </p>

        <div className="mt-8 space-y-6 flex flex-col items-center justify-center">
          <GoogleAuthButton />
        </div>
      </div>

    );
  }

  // Show main content for logged in users
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background text-foreground -m-6">
      <h1 className="text-4xl font-bold mb-4">No Meow no meow-meow</h1>

      <Image
        src={currentBanner}
        alt="Banner"
        width={300}
        height={150}
        priority
        className="mb-4"
      />

      <div className="text-center ">
        <div className="mb-6">
          <div className='flex space-x-1'>
          <h2 className="text-lg font-semibold mb-2">Sentence of the day: </h2>
          <p className="text-xl italic text-blue-300 mb-4">{`"${currentSentence}"`}</p>

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

            <Textarea placeholder='Say something inspiring...' 
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
      </div>
    </div>
  );
}