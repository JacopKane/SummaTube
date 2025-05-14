import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AuthCallback() {
  const router = useRouter();
  
  useEffect(() => {
    if (!router.isReady) return;

    const { token, error } = router.query;
    
    if (error) {
      console.error('Authentication error:', error);
      router.push('/');
      return;
    }
    
    if (token) {
      // Store the token in localStorage
      localStorage.setItem('youtube_token', token as string);
      
      // Redirect to the feed page
      router.push('/feed');
    } else {
      router.push('/');
    }
  }, [router, router.isReady]);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center text-center font-mono">
        <h1 className="text-2xl font-bold mb-8">Authenticating...</h1>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded col-span-2"></div>
                <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
