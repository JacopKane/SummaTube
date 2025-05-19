import { useRouter } from 'next/router';
import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function Header({ onRefresh, isLoading }: HeaderProps) {
  const router = useRouter();
  
  const handleSignOut = () => {
    localStorage.removeItem('youtube_token');
    router.push('/');
  };
  
  const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('youtube_token') !== null;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-youtube-red">
            <Link href="/" className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C1.5 3.42.8 5.318.8 9.07c0 3.752.7 5.65 3.585 5.885 3.6.245 11.626.246 15.23 0C22.5 14.72 23.2 12.822 23.2 9.07c0-3.752-.7-5.65-3.585-5.886zm-11.313 9.305v-6.89l6.498 3.445-6.498 3.445z" />
              </svg>
              <span>SummaTube</span>
            </Link>
          </h1>
        </div>
        
        <div className="flex gap-3">
          {isAuthenticated && onRefresh && (
            <button
              onClick={() => {
                if (window.confirm('This will use your API quota. Continue?')) {
                  onRefresh();
                }
              }}
              disabled={isLoading}
              className="btn btn-primary flex items-center gap-2"
              title="Will use YouTube API quota"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Refresh Feed (Uses Quota)
                </>
              )}
            </button>
          )}
          
          {isAuthenticated ? (
            <button
              onClick={handleSignOut}
              className="btn btn-secondary flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707L11.414 2.414A1 1 0 0010.707 2H4a1 1 0 00-1 1zm0 2a1 1 0 011-1h5v4a1 1 0 001 1h4v7a1 1 0 01-1 1H4a1 1 0 01-1-1V5z" clipRule="evenodd" />
              </svg>
              Sign Out
            </button>
          ) : (
            <Link
              href="/api/auth/youtube"
              className="youtube-btn btn rounded-full"
            >
              Sign in with YouTube
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
