import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuotaErrorBanner from '@/components/QuotaErrorBanner';

// Configure React Query with defaults to handle API quota issues
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry if it's a quota error
        if (error?.isQuotaError) return false;
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes - reduce API calls
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
      <QuotaErrorBanner />
    </QueryClientProvider>
  );
}
