import { useEffect, useState } from 'react';

export default function TokenErrorBanner() {
  const [tokenError, setTokenError] = useState(false);
  
  useEffect(() => {
    // Check if token error from sessionStorage
    const hasTokenError = sessionStorage.getItem('youtube_token_error') === 'true';
    setTokenError(hasTokenError);
    
    // Listen for storage events
    const handleStorageChange = () => {
      setTokenError(sessionStorage.getItem('youtube_token_error') === 'true');
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also set up a custom event listener for cross-component communication
    const handleCustomEvent = (e: Event) => {
      if ((e as CustomEvent).detail?.tokenError !== undefined) {
        setTokenError((e as CustomEvent).detail.tokenError);
      }
    };
    
    window.addEventListener('youtube_token_status', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('youtube_token_status', handleCustomEvent);
    };
  }, []);
  
  const handleLogin = async () => {
    try {
      // Redirect to YouTube auth
      window.location.href = '/api/auth/youtube';
    } catch (error) {
      console.error('Failed to initiate authentication:', error);
    }
  };
  
  if (!tokenError) return null;
  
  return (
    <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="p-2 rounded-lg bg-blue-600 shadow-lg sm:p-3">
          <div className="flex items-center justify-between flex-wrap">
            <div className="w-0 flex-1 flex items-center">
              <span className="flex p-2 rounded-lg bg-blue-800">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <p className="ml-3 font-medium text-white">
                <span className="block">You've been logged out due to an invalid or expired token</span>
                <span className="text-sm">Please sign in again to continue using SummaTube</span>
              </p>
            </div>
            <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
              <button
                onClick={handleLogin}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50"
              >
                Sign In Again
              </button>
            </div>
            <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-2">
              <button
                type="button"
                className="flex p-2 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
                onClick={() => {
                  sessionStorage.removeItem('youtube_token_error');
                  setTokenError(false);
                  // Dispatch custom event to notify other components
                  window.dispatchEvent(
                    new CustomEvent('youtube_token_status', {
                      detail: { tokenError: false }
                    })
                  );
                }}
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
