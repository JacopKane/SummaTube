import { useEffect, useState } from 'react';

export default function ScopeWarningBanner() {
  const [scopeWarning, setScopeWarning] = useState(false);
  
  useEffect(() => {
    // Check if scope warning from sessionStorage
    const hasScopeWarning = sessionStorage.getItem('youtube_scope_warning') === 'true';
    setScopeWarning(hasScopeWarning);
    
    // Listen for storage events
    const handleStorageChange = () => {
      setScopeWarning(sessionStorage.getItem('youtube_scope_warning') === 'true');
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleReauthorize = async () => {
    try {
      // Clear any existing auth tokens to ensure a fresh authentication flow
      localStorage.removeItem('youtube_token');
      
      // Redirect to YouTube auth with reauth=true to ensure all scopes are requested
      window.location.href = `/api/auth/youtube?reauth=true&prompt=consent&t=${Date.now()}`;
    } catch (error) {
      console.error('Failed to initiate reauthorization:', error);
    }
  };
  
  const handleDismiss = () => {
    sessionStorage.removeItem('youtube_scope_warning');
    setScopeWarning(false);
  };
  
  if (!scopeWarning) return null;
  
  return (
    <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5 z-40">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="p-2 rounded-lg bg-yellow-600 shadow-lg sm:p-3">
          <div className="flex items-center justify-between flex-wrap">
            <div className="w-0 flex-1 flex items-center">
              <span className="flex p-2 rounded-lg bg-yellow-800">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <p className="ml-3 font-medium text-white">
                <span className="block">Limited YouTube API permissions detected</span>
                <span className="text-sm">Some caption features may not work properly without full permissions</span>
              </p>
            </div>
            <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
              <button
                onClick={handleReauthorize}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-yellow-600 bg-white hover:bg-yellow-50"
              >
                Grant Full Permissions
              </button>
            </div>
            <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-2">
              <button
                type="button"
                className="flex p-2 rounded-md hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-white"
                onClick={handleDismiss}
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
