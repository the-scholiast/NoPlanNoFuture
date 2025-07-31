"use client"

import React from 'react';

interface LoadingSpinnerProps {
  // Size of the spinner (affects both width and height)
  size?: 'sm' | 'md' | 'lg' | 'xl';
  // Whether to center the spinner in its container
  centered?: boolean;
  // Custom CSS classes
  className?: string;
  // Loading text to display below spinner
  text?: string;
  // Color variant
  variant?: 'primary' | 'secondary' | 'white';
}

export default function LoadingSpinner({
  size = 'md',
  centered = false,
  className = '',
  text,
  variant = 'primary'
}: LoadingSpinnerProps) {

  // Size classes mapping
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  // Color classes mapping
  const colorClasses = {
    primary: 'border-gray-900',
    secondary: 'border-gray-500',
    white: 'border-white'
  };

  // Container classes
  const containerClasses = [
    centered ? 'flex items-center justify-center' : '',
    centered && text ? 'flex-col gap-2' : '',
    className
  ].filter(Boolean).join(' ');

  // Spinner classes
  const spinnerClasses = [
    'animate-spin rounded-full border-b-2',
    sizeClasses[size],
    colorClasses[variant]
  ].join(' ');

  if (centered) {
    return (
      <div className={containerClasses}>
        <div className={spinnerClasses}></div>
        {text && (
          <p className={`text-sm ${variant === 'white' ? 'text-white' : 'text-gray-600'}`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={spinnerClasses}></div>
      {text && (
        <p className={`text-sm mt-2 ${variant === 'white' ? 'text-white' : 'text-gray-600'}`}>
          {text}
        </p>
      )}
    </div>
  );
}