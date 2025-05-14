import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import FeedItem from '@/components/FeedItem';
import { ApiError, handleApiError } from '@/utils/errorHandling';
import api from '@/utils/api';

interface VideoFeedItem {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  content: string | null;
  summaryStatus: 'loading' | 'completed' | 'error';
  videoUrl: string;
}

export default function Feed() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  
  useEffect(() => {
    const token = localStorage.getItem('youtube_token');
    if (!token) {
      router.push('/');
    } else {
      setAuthenticated(true);
    }
  }, [router]);

  const { data: feedItems, isLoading, error, refetch } = useQuery<VideoFeedItem[], ApiError>({
    queryKey: ['feed'],
    queryFn: async () => {
      try {
        console.log('Making API request to fetch feed');
        
        // Using our API client which automatically adds headers
        const { data } = await api.get<VideoFeedItem[]>('/youtube/feed');
        
        console.log('Feed data received:', data?.length || 0, 'items');
        return data;
      } catch (error) {
        console.error('Error fetching feed:', error);
        
        // Make sure we always return an ApiError
        if (error && typeof error === 'object' && 'isQuotaError' in error) {
          throw error as ApiError;
        } else {
          throw handleApiError(error);
        }
      }
    },
    enabled: authenticated,
    refetchInterval: 3600000, // Refetch every hour instead of every minute to reduce API calls
  });

  if (!authenticated) {
    return null;
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading your feed...</div>;
  }

  if (error) {
    console.error('Feed loading error:', error);
    
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        {error.isQuotaError ? (
          <>
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 max-w-lg">
              <p className="font-bold">YouTube API Quota Exceeded</p>
              <p>The application has reached its YouTube API quota limit. This typically resets at midnight Pacific Time.</p>
            </div>
            <p className="text-xl mb-4">Try again later or use a different Google account.</p>
          </>
        ) : error.isAuthError ? (
          <>
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 max-w-lg">
              <p className="font-bold">Authentication Error</p>
              <p>Your authentication token is invalid or has expired.</p>
            </div>
            <p className="text-xl mb-4">Please sign in again to continue.</p>
          </>
        ) : (
          <>
            <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4 max-w-lg">
              <p className="font-bold">Error {error.status}</p>
              <p>{error.message || 'An unexpected error occurred'}</p>
            </div>
            <p className="text-xl mb-4">Please try again later.</p>
          </>
        )}
        
        <div className="flex gap-3">
          {!error.isQuotaError && (
            <button
              onClick={() => refetch()}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
          
          <button
            onClick={() => {
              localStorage.removeItem('youtube_token');
              router.push('/');
            }}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Sign in again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Your Feed - SummaTube</title>
        <meta name="description" content="Your YouTube feed with AI-powered summaries" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-8">
        <header className="mb-8">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-bold">SummaTube</h1>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  refetch();
                }}
                className="text-sm bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Refresh Feed'}
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('youtube_token');
                  router.push('/');
                }}
                className="text-sm bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-6">Your YouTube Feed</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedItems?.map((item) => (
              <FeedItem
                key={item.id}
                id={item.id}
                title={item.title}
                thumbnail={item.thumbnail}
                publishedAt={item.publishedAt}
                videoUrl={item.videoUrl}
              />
            ))}
          </div>

          {feedItems?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No videos found in your feed</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
