'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * React Query Provider
 * 
 * Provides caching, background updates, and loading states for data fetching.
 * Wraps the application to enable React Query throughout.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Time before stale data is considered fresh
            staleTime: 60 * 1000, // 1 minute
            
            // Number of retry attempts on failure
            retry: 2,
            
            // Delay between retries
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // Don't refetch on window focus for better UX
            refetchOnWindowFocus: false,
            
            // Don't refetch on reconnect automatically
            refetchOnReconnect: false,
            
            // Cache time - how long unused data stays in cache
            gcTime: 10 * 60 * 1000, // 10 minutes
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default QueryProvider;
