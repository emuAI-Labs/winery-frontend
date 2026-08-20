import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './apiClient';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Never retry auth/permission/validation failures — only transient
        // network blips, and even then just once or twice.
        if (error instanceof ApiError) {
          if (
            error.code === 'NETWORK_ERROR' ||
            error.code === 'SERVICE_UNAVAILABLE'
          ) {
            return failureCount < 2;
          }
          return false;
        }
        return failureCount < 1;
      },
      staleTime: 15_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
