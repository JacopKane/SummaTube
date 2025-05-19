import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import FeedItem from '@/components/FeedItem';
import PageLayout from '@/components/PageLayout';
import Loading from '@/components/Loading';
import CacheControls from '@/components/CacheControls';
import CacheSettings, { CacheSettings as CacheSettingsType } from '@/components/CacheSettings';
import LoadMoreButton from '@/components/LoadMoreButton';
import QuotaWarningBanner from '@/components/QuotaWarningBanner';
import { ApiError, handleApiError } from '@/utils/errorHandling';
import api from '@/utils/api';
import { 
  isCacheValid, 
  getCacheSettings, 
  cleanupCache, 
  getCacheSize,
  getQuotaUsage, 
  incrementQuotaUsage, 
  isApproachingQuotaLimit 
} from '@/utils/cacheManager';
import { useLazyLoading } from '@/hooks/useLazyLoading';

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
  const [useCachedData, setUseCachedData] = useState<boolean>(false);
  const [cachedFeedItems, setCachedFeedItems] = useState<VideoFeedItem[] | null>(null);
  const [cacheSource, setCacheSource] = useState<'cache' | 'api'>('api');
  const [feedTimestamp, setFeedTimestamp] = useState<number | null>(null);
  const [isApproachingQuota, setIsApproachingQuota] = useState<boolean>(false);
  const [cacheSize, setCacheSize] = useState<number>(0);
  
  // Function to get cached feed data
  const getCachedFeedData = (): VideoFeedItem[] | null => {
    const cachedFeed = localStorage.getItem('cached_feed');
    if (cachedFeed) {
      try {
        const parsedData = JSON.parse(cachedFeed);
        // Check if cache is valid based on settings
        if (parsedData.timestamp && isCacheValid(parsedData.timestamp, 'feed')) {
          setFeedTimestamp(parsedData.timestamp);
          setCacheSource('cache');
          return parsedData.data;
        } else {
          console.log('Feed cache has expired based on settings');
          return null;
        }
      } catch (e) {
        console.error('Error parsing cached feed data', e);
        return null;
      }
    }
    return null;
  };

  // Handle cache settings change
  const handleCacheSettingsChange = (newSettings: CacheSettingsType) => {
    // Clean up cache based on new settings
    cleanupCache();
    
    // Check if we should reload feed based on prefer cache setting
    if (newSettings.preferCache && !useCachedData) {
      const cachedData = getCachedFeedData();
      if (cachedData) {
        setUseCachedData(true);
        setCachedFeedItems(cachedData);
      }
    }
  };
  
  useEffect(() => {
    const token = localStorage.getItem('youtube_token');
    if (!token) {
      router.push('/');
    } else {
      setAuthenticated(true);
      
      // Clean up any expired cache entries based on settings
      cleanupCache();
      
      // Check if we have valid cached feed data
      const cachedData = getCachedFeedData();
      if (cachedData && cachedData.length > 0) {
        // Get cache settings to determine if we should use the cache
        const settings = getCacheSettings();
        
        if (settings.preferCache) {
          setUseCachedData(true);
          setCachedFeedItems(cachedData);
        }
      }
    }
  }, [router]);

  const { data: feedItems, isLoading, error, refetch } = useQuery<VideoFeedItem[], ApiError>({
    queryKey: ['feed'],
    queryFn: async () => {
      try {
        // If we have usable cached data, check if we should use it instead
        const cachedData = getCachedFeedData();
        if (useCachedData && cachedData) {
          console.log('Using cached feed data to reduce API calls');
          return cachedData;
        }
        
        // Check if we're approaching quota limits
        if (isApproachingQuotaLimit()) {
          setIsApproachingQuota(true);
          
          // If we have any cached data, use it to avoid hitting the quota
          if (cachedData) {
            console.log('Using cached data because approaching API quota limit');
            return cachedData;
          }
        }
        
        console.log('Making API request to fetch feed');
        
        // Using our API client which automatically adds headers
        const { data } = await api.get<VideoFeedItem[]>('/youtube/feed');
        
        // Increment API usage counter
        incrementQuotaUsage();
        
        console.log('Feed data received:', data?.length || 0, 'items');
        
        // Store the data in localStorage to avoid repeated API calls
        if (data && data.length > 0) {
          const timestamp = Date.now();
          localStorage.setItem('cached_feed', JSON.stringify({
            timestamp,
            data: data
          }));
          setFeedTimestamp(timestamp);
          setCacheSource('api');
        }
        return data;
      } catch (error) {
        console.error('Error fetching feed:', error);
        
        // If error occurs but we have cached data, use it as fallback
        const cachedData = getCachedFeedData();
        if (cachedData) {
          console.log('Using cached data as fallback after API error');
          return cachedData;
        }
        
        // Make sure we always return an ApiError
        if (error && typeof error === 'object' && ('isQuotaError' in error || 'isPermissionError' in error)) {
          throw error as ApiError;
        } else {
          throw handleApiError(error);
        }
      }
    },
    enabled: authenticated && !useCachedData, // Only run the query if we don't have usable cached data
    // Remove auto-refresh to minimize API usage
    refetchInterval: undefined,
  });
  
  // Convert null to empty array to ensure type safety
  const allFeedItems: VideoFeedItem[] = useCachedData 
    ? (cachedFeedItems ?? []) 
    : (feedItems ?? []);
  
  // Initialize lazy loading for feed items - moved BEFORE conditional returns
  // This ensures hooks are called in the same order every render
  const {
    visibleItems: displayedFeedItems,
    hasMore,
    isLoadingMore,
    loadMore,
    totalCount,
    visibleCount
  } = useLazyLoading<VideoFeedItem>(
    allFeedItems,
    {
      initialItems: 6,
      increment: 6
    }
  );

  // Get current cache size
  useEffect(() => {
    setCacheSize(getCacheSize());
  }, []);

  // Early returns AFTER all hooks have been called
  if (!authenticated) {
    return null;
  }

  if (isLoading) {
    return <Loading message="Loading your feed..." fullScreen={true} />;
  }

  if (error) {
    console.error('Feed loading error:', error);
    
    return (
      <PageLayout title="Error - SummaTube" showHeader={false}>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden animate-fade-in">
            <div className="p-1 bg-gradient-to-r from-red-500 to-yellow-500"></div>
            <div className="p-6">
              {error.isQuotaError ? (
                <>
                  <div className="flex items-center mb-4">
                    <span className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-yellow-100 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <h2 className="ml-3 text-xl font-bold text-yellow-600 dark:text-yellow-400">YouTube API Quota Exceeded</h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">The application has reached its YouTube API quota limit. This typically resets at midnight Pacific Time.</p>
                </>
              ) : error.isPermissionError ? (
                <>
                  <div className="flex items-center mb-4">
                    <span className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-red-100 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <h2 className="ml-3 text-xl font-bold text-red-600 dark:text-red-400">Permission Error</h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">Your account doesn't have the necessary permissions to access some YouTube features.</p>
                </>
              ) : error.isAuthError ? (
                <>
                  <div className="flex items-center mb-4">
                    <span className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-red-100 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                      </svg>
                    </span>
                    <h2 className="ml-3 text-xl font-bold text-red-600 dark:text-red-400">Authentication Error</h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">Your authentication token is invalid or has expired.</p>
                </>
              ) : (
                <>
                  <div className="flex items-center mb-4">
                    <span className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-orange-100 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </span>
                    <h2 className="ml-3 text-xl font-bold text-orange-600 dark:text-orange-400">Error {error.status}</h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">{error.message || 'An unexpected error occurred'}</p>
                </>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                {!error.isQuotaError && (
                  <button
                    onClick={() => refetch()}
                    className="btn btn-primary"
                  >
                    Try Again
                  </button>
                )}
                
                <button
                  onClick={() => {
                    localStorage.removeItem('youtube_token');
                    router.push('/');
                  }}
                  className="btn btn-secondary"
                >
                  Sign in again
                </button>
                
                {error.isPermissionError && (
                  <button 
                    onClick={() => window.location.href = '/api/auth/youtube?reauth=true'}
                    className="btn btn-danger"
                  >
                    Reauthorize YouTube Access
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Your Feed - SummaTube"
      description="Your YouTube feed with AI-powered summaries"
      onRefresh={refetch}
      isLoading={isLoading}
    >
      <div className="container mx-auto p-4 sm:p-8">
        <div className="flex justify-between items-center mb-4 flex-wrap">
          <h2 className="text-2xl font-bold animate-fade-in">Your YouTube Feed</h2>
          <div className="flex items-center gap-2">
            <CacheSettings onApply={handleCacheSettingsChange} />
          </div>
        </div>
        
        {useCachedData && (
          <div className="mb-6 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md flex-wrap">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Using cached data to minimize API usage</span>
              <button 
                onClick={() => {
                  setUseCachedData(false);
                  refetch();
                }}
                className="ml-2 text-blue-500 hover:underline text-xs"
              >
                Refresh (uses API quota)
              </button>
            </div>
            {feedTimestamp && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">
                <span className="mr-2">Cache size: {cacheSize.toFixed(2)} MB</span>
                Last updated: {new Date(feedTimestamp).toLocaleString()}
              </div>
            )}
          </div>
        )}
        
        {/* Display quota warning if approaching limit */}
        {isApproachingQuota && <QuotaWarningBanner />}
        
        <CacheControls />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {displayedFeedItems?.map((item) => (
            <div key={item.id} className="animate-slide-up">
              <FeedItem
                id={item.id}
                title={item.title}
                thumbnail={item.thumbnail}
                publishedAt={item.publishedAt}
                videoUrl={item.videoUrl}
                feedSource={cacheSource}
              />
            </div>
          ))}
        </div>
        
        <LoadMoreButton 
          hasMore={hasMore}
          isLoading={isLoadingMore}
          onClick={loadMore}
          loadedCount={visibleCount}
          totalCount={totalCount}
        />

        {allFeedItems?.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 mt-4 text-xl">No videos found in your feed</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">Try refreshing or subscribing to more channels</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
