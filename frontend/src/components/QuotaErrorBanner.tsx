import { useEffect, useState } from 'react';

export default function QuotaErrorBanner() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  
  useEffect(() => {
    // Check if quota is exceeded from sessionStorage
    const isExceeded = sessionStorage.getItem('youtube_quota_exceeded') === 'true';
    setQuotaExceeded(isExceeded);
    
    // Listen for storage events
    const handleStorageChange = () => {
      setQuotaExceeded(sessionStorage.getItem('youtube_quota_exceeded') === 'true');
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also set up a custom event listener for cross-component communication
    const handleCustomEvent = (e: Event) => {
      if ((e as CustomEvent).detail?.quotaExceeded !== undefined) {
        setQuotaExceeded((e as CustomEvent).detail.quotaExceeded);
      }
    };
    
    window.addEventListener('youtube_quota_status', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('youtube_quota_status', handleCustomEvent);
    };
  }, []);
  
  if (!quotaExceeded) return null;
  
  return (
    <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="p-2 rounded-lg bg-yellow-600 shadow-lg sm:p-3">
          <div className="flex items-center justify-between flex-wrap">
            <div className="w-0 flex-1 flex items-center">
              <span className="flex p-2 rounded-lg bg-yellow-800">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <p className="ml-3 font-medium text-white truncate">
                <span>YouTube API quota exceeded. Some features are temporarily unavailable.</span>
              </p>
            </div>
            <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-2">
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem('youtube_quota_exceeded');
                  setQuotaExceeded(false);
                }}
                className="-mr-1 flex p-2 rounded-md hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
