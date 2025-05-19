import { format } from 'timeago.js';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useVideoSummary } from '@/hooks/useVideoSummary';
import { ApiError } from '@/utils/errorHandling';
import { decodeHtmlEntities } from '@/utils/htmlEntities';
import CacheIndicator from '@/components/CacheIndicator';

interface FeedItemProps {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  videoUrl: string;
  feedSource?: 'cache' | 'api';
}

export default function FeedItem({ id, title, thumbnail, publishedAt, videoUrl, feedSource = 'api' }: FeedItemProps) {
  // Try to get cached summary directly from localStorage first
  const [cachedSummary, setCachedSummary] = useState<string | null>(null);
  const [summaryTimestamp, setSummaryTimestamp] = useState<number | null>(null);
  const [summarySource, setSummarySource] = useState<'cache' | 'api'>('api');
  
  useEffect(() => {
    try {
      const cachedSummaries = localStorage.getItem('cached_summaries');
      if (cachedSummaries) {
        const summariesObj = JSON.parse(cachedSummaries);
        if (summariesObj[id] && summariesObj[id].summary) {
          setCachedSummary(summariesObj[id].summary);
          setSummaryTimestamp(summariesObj[id].timestamp || Date.now());
          setSummarySource('cache');
        }
      }
    } catch (e) {
      console.error('Error retrieving cached summary:', e);
    }
  }, [id]);

  // Set enabled to false if we know there's a quota issue or if we already have a cached summary
  const quotaExceeded = typeof window !== 'undefined' ? sessionStorage.getItem('youtube_quota_exceeded') === 'true' : false;
  const { data: summary, isLoading: isLoadingSummary, error } = useVideoSummary(id, !quotaExceeded && !cachedSummary);

  // If we get a quota error, mark it for other components
  if (error && error.isQuotaError && typeof window !== 'undefined') {
    sessionStorage.setItem('youtube_quota_exceeded', 'true');
  }

  // Use cached summary if available, otherwise use the one from the API
  const summaryStatus = cachedSummary ? 'completed' : isLoadingSummary ? 'loading' : error ? 'error' : 'completed';
  const summaryContent = cachedSummary || (summaryStatus === 'completed' ? summary : null);
  
  // Update summary source if fresh data comes from API
  useEffect(() => {
    if (summary && !cachedSummary) {
      setSummarySource('api');
      setSummaryTimestamp(Date.now());
    }
  }, [summary, cachedSummary]);

  return (
    <a 
      href={videoUrl}
      target="_blank" 
      rel="noopener noreferrer"
      className="card group flex flex-col h-full transform hover:scale-[1.02] transition-all duration-300"
    >
      <div className="relative aspect-video overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
        <Image
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Watch
        </div>
      </div>
      <div className="p-5 flex-grow">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">{decodeHtmlEntities(title)}</h3>
        <div className="flex items-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(publishedAt)}
          </p>
        </div>
        
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
              <h4 className="text-sm font-semibold text-primary-600 dark:text-primary-400">Summary</h4>
            </div>
            <div className="flex items-center space-x-1">
              {summaryStatus === 'completed' && (
                <CacheIndicator 
                  source={summarySource} 
                  timestamp={summaryTimestamp || undefined}
                  type="summary"
                />
              )}
              <CacheIndicator
                source={feedSource}
                type="feed"
              />
            </div>
          </div>
          
          {summaryStatus === 'loading' ? (
            <div className="space-y-2 animate-pulse-slow">
              <div className="pulse-text"></div>
              <div className="pulse-text"></div>
              <div className="pulse-text w-3/4"></div>
            </div>
          ) : summaryStatus === 'error' ? (
            <div>
              {error?.isQuotaError ? (
                <div className="text-sm bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-md">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-amber-700 dark:text-amber-300">API quota exceeded. Summaries unavailable until quota resets.</p>
                      <p className="text-xs text-gray-500 mt-1">Try enabling "Prefer Cache" in settings to reduce API usage</p>
                      <div className="flex space-x-2 mt-2">
                        <a 
                          href={videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary-600 dark:text-primary-400 hover:underline text-xs inline-flex items-center"
                        >
                          Watch on YouTube 
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ) : error?.isPermissionError ? (
                <div className="text-sm bg-red-50 dark:bg-red-900/30 p-3 rounded-md">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <p className="text-red-700 dark:text-red-300">Insufficient permissions to access captions.</p>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = '/api/auth/youtube?reauth=true';
                        }}
                        className="text-primary-600 dark:text-primary-400 hover:underline text-xs mt-2 inline-flex items-center"
                      >
                        Reauthorize Access
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ) : error?.isCaptionsNotAvailable ? (
                <div className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">No captions available for this video.</p>
                      <p className="text-xs text-gray-500 mt-1">The video either has no captions or they are not publicly accessible.</p>
                      <a 
                        href={videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary-600 dark:text-primary-400 hover:underline text-xs mt-2 inline-flex items-center"
                      >
                        Watch on YouTube
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 dark:text-red-300">
                      {error?.message?.slice(0, 50) || "Failed to generate summary"}
                      {error?.message && error.message.length > 50 ? '...' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <p className="text-sm line-clamp-3 text-gray-600 dark:text-gray-300">{summaryContent}</p>
              <div className="absolute bottom-0 right-0 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pl-6 pr-1">
                <span className="text-primary-600 dark:text-primary-400 text-xs">more</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
