import { useState } from 'react';

interface CacheIndicatorProps {
  source: 'cache' | 'api';
  timestamp?: number;
  type: 'feed' | 'summary';
}

export default function CacheIndicator({ source, timestamp, type }: CacheIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Format the timestamp to a readable format
  const formattedTime = timestamp 
    ? new Date(timestamp).toLocaleString() 
    : 'Unknown';
  
  // Calculate how long ago the data was cached
  const getTimeAgo = () => {
    if (!timestamp) return 'unknown time';
    
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };
  
  // Determine badge color based on source
  const badgeColor = source === 'cache' ? 'badge-info' : 'badge-primary';
  const sourceName = source === 'cache' ? 'Cached' : 'API';
  const tooltipText = source === 'cache'
    ? `This ${type} was loaded from your local cache (saved ${getTimeAgo()})`
    : `This ${type} was freshly loaded from the YouTube API`;

  return (
    <div className="inline-block relative">
      <span 
        className={`badge ${badgeColor} cursor-pointer`}
        onClick={() => setShowDetails(!showDetails)}
        title={tooltipText}
      >
        {sourceName}
      </span>
      
      {showDetails && timestamp && (
        <div className="absolute z-10 mt-1 bg-white dark:bg-gray-800 p-2 rounded-md shadow-lg text-xs w-48 animate-fade-in">
          <p className="font-medium">Cached on:</p>
          <p className="font-mono break-all">{formattedTime}</p>
          <p className="mt-1 text-gray-500">{getTimeAgo()}</p>
        </div>
      )}
    </div>
  );
}
