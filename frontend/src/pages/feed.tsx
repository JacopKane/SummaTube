import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import FeedItem from '@/components/FeedItem';

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

  const { data: feedItems, isLoading, error } = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const token = localStorage.getItem('youtube_token');
      const { data } = await axios.get<VideoFeedItem[]>('/api/youtube/feed', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return data;
    },
    enabled: authenticated,
    refetchInterval: 60000, // Refetch every minute
  });

  if (!authenticated) {
    return null;
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading your feed...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen">Error loading feed. Please try again later.</div>;
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
