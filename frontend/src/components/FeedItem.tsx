import { format } from 'timeago.js';
import Image from 'next/image';
import { useVideoSummary } from '@/hooks/useVideoSummary';
import { ApiError } from '@/utils/errorHandling';

interface FeedItemProps {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  videoUrl: string;
}

export default function FeedItem({ id, title, thumbnail, publishedAt, videoUrl }: FeedItemProps) {
  // Set enabled to false if we know there's a quota issue (can be stored in sessionStorage)
  const quotaExceeded = typeof window !== 'undefined' ? sessionStorage.getItem('youtube_quota_exceeded') === 'true' : false;
  const { data: summary, isLoading: isLoadingSummary, error } = useVideoSummary(id, !quotaExceeded);

  // If we get a quota error, mark it for other components
  if (error && error.isQuotaError && typeof window !== 'undefined') {
    sessionStorage.setItem('youtube_quota_exceeded', 'true');
  }

  const summaryStatus = isLoadingSummary ? 'loading' : error ? 'error' : 'completed';
  const summaryContent = summaryStatus === 'completed' ? summary : null;

  return (
    <a 
      href={videoUrl}
      target="_blank" 
      rel="noopener noreferrer"
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
    >
      <div className="relative aspect-video">
        <Image
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {format(publishedAt)}
        </p>
        
        {summaryStatus === 'loading' ? (
          <div className="space-y-2">
            <div className="pulse-text"></div>
            <div className="pulse-text"></div>
            <div className="pulse-text w-3/4"></div>
          </div>
        ) : summaryStatus === 'error' ? (
          <div>
            {error?.isQuotaError ? (
              <div className="text-sm bg-yellow-50 p-2 rounded border border-yellow-200">
                <p className="text-amber-700">API quota exceeded. Summaries unavailable until quota resets.</p>
                <a 
                  href={videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-xs mt-1 inline-block"
                >
                  Watch on YouTube →
                </a>
              </div>
            ) : (
              <p className="text-sm text-red-500">
                {error?.message?.slice(0, 50) || "Failed to generate summary"}
                {error?.message && error.message.length > 50 ? '...' : ''}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm line-clamp-3">{summaryContent}</p>
        )}
      </div>
    </a>
  );
}
