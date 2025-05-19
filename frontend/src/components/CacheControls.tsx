import { useState, useEffect } from 'react';

interface CacheInfo {
  feedSize: string;
  summariesSize: string;
  feedItemCount: number;
  summariesCount: number;
  feedLastUpdated: string | null;
}

export default function CacheControls() {
  const [isOpen, setIsOpen] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({
    feedSize: '0 KB',
    summariesSize: '0 KB',
    feedItemCount: 0,
    summariesCount: 0,
    feedLastUpdated: null
  });
  const [importFile, setImportFile] = useState<File | null>(null);

  const calculateCacheInfo = () => {
    try {
      // Calculate feed cache info
      let feedSize = '0 KB';
      let feedItemCount = 0;
      let feedLastUpdated = null;
      
      const cachedFeed = localStorage.getItem('cached_feed');
      if (cachedFeed) {
        feedSize = (cachedFeed.length / 1024).toFixed(2) + ' KB';
        const feedData = JSON.parse(cachedFeed);
        feedItemCount = feedData.data?.length || 0;
        feedLastUpdated = feedData.timestamp ? new Date(feedData.timestamp).toLocaleString() : null;
      }
      
      // Calculate summaries cache info
      let summariesSize = '0 KB';
      let summariesCount = 0;
      
      const cachedSummaries = localStorage.getItem('cached_summaries');
      if (cachedSummaries) {
        summariesSize = (cachedSummaries.length / 1024).toFixed(2) + ' KB';
        const summariesData = JSON.parse(cachedSummaries);
        summariesCount = Object.keys(summariesData).length;
      }
      
      // Calculate total cache size
      const totalCacheSize = Object.keys(localStorage).reduce((total, key) => {
        const value = localStorage.getItem(key) || '';
        return total + (value.length * 2); // Approximate size in bytes (2 bytes per character)
      }, 0);
      
      setCacheInfo({
        feedSize,
        summariesSize,
        feedItemCount,
        summariesCount,
        feedLastUpdated
      });
    } catch (e) {
      console.error('Error calculating cache info:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      calculateCacheInfo();
    }
  }, [isOpen]);

  const clearFeedCache = () => {
    if (window.confirm('Clear feed cache? This will cause the app to fetch new data from YouTube API on next refresh.')) {
      localStorage.removeItem('cached_feed');
      calculateCacheInfo();
    }
  };

  const clearSummariesCache = () => {
    if (window.confirm('Clear all video summaries cache? You will need to fetch summaries again using the YouTube API.')) {
      localStorage.removeItem('cached_summaries');
      calculateCacheInfo();
    }
  };

  const clearAllCache = () => {
    if (window.confirm('Clear all cached data? This will reset all local storage for the application.')) {
      localStorage.removeItem('cached_feed');
      localStorage.removeItem('cached_summaries');
      calculateCacheInfo();
    }
  };
  
  const exportCache = () => {
    try {
      const cache = {
        feed: localStorage.getItem('cached_feed') ? JSON.parse(localStorage.getItem('cached_feed')!) : null,
        summaries: localStorage.getItem('cached_summaries') ? JSON.parse(localStorage.getItem('cached_summaries')!) : null,
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cache));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "youtube-text-cache.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (e) {
      console.error('Error exporting cache:', e);
    }
  };
  
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
    }
  };
  
  const importCache = () => {
    if (!importFile) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        
        if (importedData.feed) {
          localStorage.setItem('cached_feed', JSON.stringify(importedData.feed));
        }
        
        if (importedData.summaries) {
          localStorage.setItem('cached_summaries', JSON.stringify(importedData.summaries));
        }
        
        calculateCacheInfo();
        alert('Cache imported successfully!');
        setImportFile(null);
      } catch (e) {
        console.error('Error importing cache:', e);
        alert('Failed to import cache. Invalid file format.');
      }
    };
    reader.readAsText(importFile);
  };

  return (
    <div className="mt-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Cache Settings
      </button>
      
      {isOpen && (
        <div className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-fade-in">
          <h3 className="text-lg font-bold mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            Local Cache Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h4 className="font-medium text-primary-600 dark:text-primary-400 mb-2">Feed Cache</h4>
              <p className="text-sm">Size: <span className="font-mono">{cacheInfo.feedSize}</span></p>
              <p className="text-sm">Videos: <span className="font-mono">{cacheInfo.feedItemCount}</span></p>
              <p className="text-sm">Last Updated: <span className="font-mono">{cacheInfo.feedLastUpdated || 'Never'}</span></p>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h4 className="font-medium text-primary-600 dark:text-primary-400 mb-2">Summaries Cache</h4>
              <p className="text-sm">Size: <span className="font-mono">{cacheInfo.summariesSize}</span></p>
              <p className="text-sm">Video Summaries: <span className="font-mono">{cacheInfo.summariesCount}</span></p>
            </div>
          </div>
          
          <div className="border-t dark:border-gray-600 pt-4 mt-4">
            <h4 className="font-medium mb-3">Cache Management</h4>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={clearFeedCache}
                className="btn btn-sm btn-outline"
              >
                Clear Feed Cache
              </button>
              <button 
                onClick={clearSummariesCache}
                className="btn btn-sm btn-outline"
              >
                Clear Summaries Cache
              </button>
              <button 
                onClick={clearAllCache}
                className="btn btn-sm btn-danger"
              >
                Clear All Cache
              </button>
              <button 
                onClick={exportCache}
                className="btn btn-sm btn-secondary"
              >
                Export Cache
              </button>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Import Cache</h4>
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleImportFileChange}
                  className="text-sm"
                />
                <button 
                  onClick={importCache}
                  disabled={!importFile}
                  className={`btn btn-sm ${importFile ? 'btn-primary' : 'btn-disabled'}`}
                >
                  Import
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Cache Expiration</h4>
              <div className="flex items-center space-x-2 text-xs bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-300">
                  Feed cache expires based on settings (default: 24 hours)<br />
                  Summary cache expires based on settings (default: 7 days)
                </p>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Note: Clearing cache will require fetching fresh data from YouTube API on next use, which will consume your quota.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
