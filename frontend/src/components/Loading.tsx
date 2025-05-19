import React from 'react';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export default function Loading({ message = 'Loading...', fullScreen = false }: LoadingProps) {
  return (
    <div className={`flex flex-col justify-center items-center ${fullScreen ? 'min-h-screen' : 'py-12'}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-300">{message}</p>
    </div>
  );
}
