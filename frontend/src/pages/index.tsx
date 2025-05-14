import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

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
    <>
      <Head>
        <title>SummaTube - YouTube Video Summarizer</title>
        <meta name="description" content="Get AI-powered summaries of your YouTube videos" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-center text-center font-mono">
          <h1 className="text-6xl font-bold mb-8">SummaTube</h1>
          <p className="text-xl mb-8">
            AI-powered summaries of your YouTube videos
          </p>
          <div className="mt-8">
            <Link
              href="/api/auth/youtube"
              className="rounded-full bg-red-600 px-8 py-3 text-white font-semibold hover:bg-red-700 transition-colors"
            >
              Sign in with YouTube
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
