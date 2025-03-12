import { api } from '@/lib/api/client';
import { useCallback, useState } from 'react';
import useSWR, { SWRConfiguration, SWRResponse, mutate as swrMutate } from 'swr';

// Global configuration for SWR
export const DEFAULT_SWR_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false, // Don't revalidate when window focuses
  revalidateOnReconnect: true, // Revalidate when browser regains connection
  refreshWhenOffline: false, // Don't refresh when offline
  shouldRetryOnError: true,
  errorRetryCount: 3,
  dedupingInterval: 2000, // Dedupe requests with same key in this time span
};

// Define RequestBody type to match the one in api/client.ts
type RequestBody = Record<string, unknown> | unknown[] | string | number | boolean | null;

/**
 * Enhanced SWR fetcher function with our API client
 */
export function fetcher<T>(url: string): Promise<T> {
  return api.get<T>(url);
}

/**
 * Enhanced useFetch hook with SWR for data fetching and caching
 */
export function useFetch<Data = unknown, ErrorType = Error>(
  url: string | null,
  config: SWRConfiguration = {}
): SWRResponse<Data, ErrorType> {
  // Only fetch if we have a URL
  const finalUrl = url || null;

  return useSWR<Data, ErrorType>(finalUrl, finalUrl ? fetcher : null, {
    ...DEFAULT_SWR_CONFIG,
    ...config,
  });
}

/**
 * Type for paginated data response
 */
export interface PaginatedData<T> {
  total: number;
  items: T[];
}

/**
 * Hook for paginated data fetching
 */
export function usePaginatedFetch<T, ErrorType = Error>(
  baseUrl: string,
  page: number = 1,
  pageSize: number = 10,
  config: SWRConfiguration = {}
) {
  const url = baseUrl ? `${baseUrl}?page=${page}&pageSize=${pageSize}` : null;

  const result = useFetch<PaginatedData<T>, ErrorType>(url, config);

  // Calculate pagination details
  const pagination = result.data
    ? {
        currentPage: page,
        pageSize,
        totalItems: result.data.total,
        totalPages: Math.ceil(result.data.total / pageSize),
        hasMore: page * pageSize < result.data.total,
      }
    : {
        currentPage: page,
        pageSize,
        totalItems: 0,
        totalPages: 0,
        hasMore: false,
      };

  return {
    ...result,
    pagination,
  };
}

/**
 * Hook for search data fetching
 */
export function useSearchFetch<T, ErrorType = Error>(
  baseUrl: string,
  query: string,
  page: number = 1,
  pageSize: number = 10,
  config: SWRConfiguration = {}
) {
  // Only search if we have a non-empty query
  const url =
    query && baseUrl
      ? `${baseUrl}?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`
      : null;

  return usePaginatedFetch<T, ErrorType>(url || '', page, pageSize, {
    ...config,
    // Dedupe requests with same search term more aggressively
    dedupingInterval: 500,
  });
}

/**
 * Enhanced hook for creating a mutation function with optimistic updates
 */
export function useMutation<Data = unknown, Input extends RequestBody = RequestBody, RollbackData = unknown>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options: {
    // Keys to invalidate on success
    invalidateKeys?: string[];
    // Function to calculate optimistic data from input
    optimisticUpdate?: (input: Input) => RollbackData;
    // Function to revert optimistic update on error
    rollbackOnError?: boolean;
    // Whether to show toast notifications
    showToasts?: boolean;
    // Messages for toast notifications
    messages?: {
      loading?: string;
      success?: string;
      error?: string;
    };
  } = {}
): [
  (input: Input) => Promise<Data>,
  {
    isLoading: boolean;
    error: Error | null;
    reset: () => void;
  },
] {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Default options
  const {
    invalidateKeys = [url],
    optimisticUpdate,
    rollbackOnError = true,
    showToasts = false,
    messages = {
      loading: 'Processing request...',
      success: 'Request completed successfully',
      error: 'Failed to complete request',
    },
  } = options;

  // Reset the error state
  const reset = useCallback(() => {
    setError(null);
  }, []);

  // Mutation function
  const mutation = async (input: Input): Promise<Data> => {
    let rollbackData: RollbackData | undefined;
    let toastId: string | undefined;

    setIsLoading(true);
    setError(null);

    try {
      // Show loading toast if enabled
      if (showToasts) {
        toastId = Math.random().toString(36).substring(2, 9);
        const { toast } = await import('sonner');
        toast.loading(messages.loading || 'Processing...', { id: toastId });
      }

      // Apply optimistic update if provided
      if (optimisticUpdate) {
        rollbackData = optimisticUpdate(input);
      }

      // Execute the API call based on method
      let result: Data;
      switch (method) {
        case 'POST':
          result = await api.post<Data>(url, input);
          break;
        case 'PUT':
          result = await api.put<Data>(url, input);
          break;
        case 'PATCH':
          result = await api.patch<Data>(url, input);
          break;
        case 'DELETE':
          result = await api.delete<Data>(url);
          break;
        default:
          result = await api.post<Data>(url, input);
      }

      // Invalidate related caches
      for (const key of invalidateKeys) {
        await swrMutate(key);
      }

      // Show success toast
      if (showToasts && toastId) {
        const { toast } = await import('sonner');
        toast.success(messages.success || 'Success', { id: toastId });
      }

      return result;
    } catch (err) {
      console.error(`Mutation error (${url}):`, err);
      const errorObj =
        err instanceof Error ? err : new Error(messages.error || 'An error occurred');
      setError(errorObj);

      // Show error toast
      if (showToasts && toastId) {
        const { toast } = await import('sonner');
        toast.error(messages.error || 'An error occurred', {
          id: toastId,
          description: errorObj.message,
        });
      }

      // Apply rollback if we did an optimistic update
      if (rollbackOnError && rollbackData !== undefined) {
        // Here you would restore the previous state
        // This is application-specific and depends on your caching strategy
        // Example for SWR:
        for (const key of invalidateKeys) {
          await swrMutate(key, rollbackData, false);
        }
      }

      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  };

  return [mutation, { isLoading, error, reset }];
}
