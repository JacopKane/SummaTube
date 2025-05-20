import { useEffect, useState } from 'react';
import api from '@/utils/api';

export default function PermissionErrorBanner() {
  const [permissionError, setPermissionError] = useState(false);
  
  useEffect(() => {
    // Check if permission error from sessionStorage
    const hasPermissionError = sessionStorage.getItem('youtube_permission_error') === 'true';
    setPermissionError(hasPermissionError);
    
    // Listen for storage events
    const handleStorageChange = () => {
      setPermissionError(sessionStorage.getItem('youtube_permission_error') === 'true');
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also set up a custom event listener for cross-component communication
    const handleCustomEvent = (e: Event) => {
      if ((e as CustomEvent).detail?.permissionError !== undefined) {
        setPermissionError((e as CustomEvent).detail.permissionError);
      }
    };
    
    window.addEventListener('youtube_permission_status', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('youtube_permission_status', handleCustomEvent);
    };
  }, []);

  const handleReauthorize = async () => {
    try {
      // First clear any existing auth tokens to ensure a fresh authentication flow
      localStorage.removeItem('youtube_token');
      
      // Redirect to YouTube auth with reauth=true to ensure all scopes are requested
      // This forces the consent screen to appear again with all required permissions
      // Adding timestamp to prevent caching issues with the OAuth flow
      window.location.href = `/api/auth/youtube?reauth=true&prompt=consent&t=${Date.now()}`;
    } catch (error) {
      console.error('Failed to initiate reauthorization:', error);
    }
  };
  
  if (!permissionError) return null;
  
  return (
    <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="p-2 rounded-lg bg-red-600 shadow-lg sm:p-3">
          <div className="flex items-center justify-between flex-wrap">
            <div className="w-0 flex-1 flex items-center">
              <span className="flex p-2 rounded-lg bg-red-800">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <p className="ml-3 font-medium text-white">
                <span className="block">Insufficient YouTube API permissions to access captions</span>
                <span className="text-sm">We need expanded YouTube permissions to read video captions and subtitle data</span>
              </p>
            </div>
            <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
              <button
                onClick={handleReauthorize}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50"
              >
                Grant Caption Access Permissions
              </button>
            </div>
            <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-2">
              <button
                type="button"
                className="flex p-2 rounded-md hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-white"
                onClick={() => {
                  sessionStorage.removeItem('youtube_permission_error');
                  setPermissionError(false);
                  // Dispatch custom event to notify other components
                  window.dispatchEvent(
                    new CustomEvent('youtube_permission_status', {
                      detail: { permissionError: false }
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