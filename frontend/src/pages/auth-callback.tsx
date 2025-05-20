import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AuthCallback() {
  const router = useRouter();
  
  useEffect(() => {
    if (!router.isReady) return;

    const { token, error, clearPermissionError, scopeWarning } = router.query;
    
    if (error) {
      console.error('Authentication error:', error);
      router.push('/');
      return;
    }
    
    if (token) {
      // Store the token in localStorage
      localStorage.setItem('youtube_token', token as string);
      
      // Clear any permission error if needed
      if (clearPermissionError === 'true') {
        sessionStorage.removeItem('youtube_permission_error');
        // Dispatch custom event to notify other components
        window.dispatchEvent(
          new CustomEvent('youtube_permission_status', {
            detail: { permissionError: false }
          })
        );
        console.log('Permission error cleared after successful reauthorization');
      }
      
      // Always clear any token errors when a new token is received
      sessionStorage.removeItem('youtube_token_error');
      window.dispatchEvent(
        new CustomEvent('youtube_token_status', {
          detail: { tokenError: false }
        })
      );
      
      // If we received a scope warning, set a flag but still proceed
      if (scopeWarning === 'true') {
        console.warn('Some requested YouTube scopes were not granted. Caption access may be limited.');
        sessionStorage.setItem('youtube_scope_warning', 'true');
      } else {
        sessionStorage.removeItem('youtube_scope_warning');
      }
      
      // Redirect to the feed page
      router.push('/feed');
    } else {
      router.push('/');
    }
  }, [router, router.isReady]);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center text-center font-mono">
        <h1 className="text-2xl font-bold mb-8">Authenticating...</h1>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded col-span-2"></div>
                <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
