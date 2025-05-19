import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuotaErrorBanner from '@/components/QuotaErrorBanner';
import PermissionErrorBanner from '@/components/PermissionErrorBanner';
import TokenErrorBanner from '@/components/TokenErrorBanner';

// Configure React Query with defaults to minimize API calls
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry if it's a quota or permission error
        if (error?.isQuotaError || error?.isPermissionError) return false;
        return failureCount < 1; // Reduce retry attempts to just once
      },
      staleTime: 1000 * 60 * 60 * 24, // 24 hours - significantly reduce API calls
      refetchOnWindowFocus: false, // Disable refetching when the window regains focus
      refetchOnReconnect: false, // Disable refetching when reconnecting
      refetchOnMount: false, // Disable refetching when component mounts
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
      <QuotaErrorBanner />
      <PermissionErrorBanner />
      <TokenErrorBanner />
    </QueryClientProvider>
  );
}
