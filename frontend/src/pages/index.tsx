import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Handle auth callback if token is in URL
    if (router.isReady) {
      const { token, error } = router.query;
      
      if (error) {
        console.error('Authentication error:', error);
        return;
      }
      
      if (token) {
        // Store the token in localStorage
        localStorage.setItem('youtube_token', token as string);
        
        // Redirect to the feed page
        router.push('/feed');
        return;
      }
      
      // Check if user is already authenticated
      const storedToken = localStorage.getItem('youtube_token');
      if (storedToken) {
        router.push('/feed');
      }
    }
  }, [router, router.isReady]);

  return (
    <PageLayout showHeader={false}>
      <div className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-5xl w-full items-center justify-center text-center animate-fade-in">
          <div className="mb-10">
            <div className="flex justify-center items-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-youtube-red">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C1.5 3.42.8 5.318.8 9.07c0 3.752.7 5.65 3.585 5.885 3.6.245 11.626.246 15.23 0C22.5 14.72 23.2 12.822 23.2 9.07c0-3.752-.7-5.65-3.585-5.886zm-11.313 9.305v-6.89l6.498 3.445-6.498 3.445z" />
              </svg>
              <h1 className="text-5xl md:text-6xl font-bold ml-3">SummaTube</h1>
            </div>
            <p className="text-xl md:text-2xl mb-4 text-gray-600 dark:text-gray-300">
              AI-powered summaries of your YouTube videos
            </p>
            <p className="text-md md:text-lg mb-12 text-gray-500 dark:text-gray-400">
              Get concise, on-point summaries of any video in your YouTube feed
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
              <Link
                href="/api/auth/youtube"
                className="youtube-btn btn rounded-full px-8 py-4 text-lg shadow-lg flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C1.5 3.42.8 5.318.8 9.07c0 3.752.7 5.65 3.585 5.885 3.6.245 11.626.246 15.23 0C22.5 14.72 23.2 12.822 23.2 9.07c0-3.752-.7-5.65-3.585-5.886zm-11.313 9.305v-6.89l6.498 3.445-6.498 3.445z" />
                </svg>
                Sign in with YouTube
              </Link>
            </div>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-6 text-center">
              <div className="h-12 w-12 mx-auto bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Concise Summaries</h3>
              <p className="text-gray-500 dark:text-gray-400">Quick TL;DR versions of all your favorite videos</p>
            </div>
            
            <div className="card p-6 text-center">
              <div className="h-12 w-12 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Save Time</h3>
              <p className="text-gray-500 dark:text-gray-400">Decide which videos are worth your time before watching</p>
            </div>
            
            <div className="card p-6 text-center">
              <div className="h-12 w-12 mx-auto bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Powered by AI</h3>
              <p className="text-gray-500 dark:text-gray-400">Advanced AI technology extracts key points accurately</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
