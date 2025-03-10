/**
 * Client-side API utilities for making requests to our custom API routes
 */

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface FetchOptions {
  method?: RequestMethod;
  body?: any;
  headers?: Record<string, string>;
  cache?: RequestCache;
  revalidate?: number;
}

/**
 * Enhanced fetch wrapper for API calls
 */
export async function fetchAPI<T = any>(
  endpoint: string, 
  options: FetchOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    cache,
    revalidate,
  } = options;

  // Build the full URL if it's not already absolute
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Prepare fetch options
  const fetchOptions: RequestInit = {
    method,
    headers: { ...defaultHeaders, ...headers },
    cache,
    next: revalidate ? { revalidate } : undefined,
  };

  // Add body for non-GET requests
  if (method !== 'GET' && body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      
      // Check if request was successful
      if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
      }
      
      return data as T;
    } else if (contentType?.includes('text/')) {
      const text = await response.text();
      
      if (!response.ok) {
        throw new Error(text || 'An error occurred');
      }
      
      return text as unknown as T;
    } else {
      // For other content types like blobs
      const blob = await response.blob();
      
      if (!response.ok) {
        throw new Error('An error occurred');
      }
      
      return blob as unknown as T;
    }
  } catch (error) {
    // Enhance error with additional context
    if (error instanceof Error) {
      console.error(`API request error (${url}):`, error);
      throw error;
    }
    
    throw new Error('Unknown error occurred during API request');
  }
}

/**
 * Utility functions for common API operations
 */
export const api = {
  get: <T = any>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'body'>) => 
    fetchAPI<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T = any>(endpoint: string, data?: any, options?: Omit<FetchOptions, 'method'>) => 
    fetchAPI<T>(endpoint, { ...options, method: 'POST', body: data }),
    
  put: <T = any>(endpoint: string, data?: any, options?: Omit<FetchOptions, 'method'>) => 
    fetchAPI<T>(endpoint, { ...options, method: 'PUT', body: data }),
    
  patch: <T = any>(endpoint: string, data?: any, options?: Omit<FetchOptions, 'method'>) => 
    fetchAPI<T>(endpoint, { ...options, method: 'PATCH', body: data }),
    
  delete: <T = any>(endpoint: string, options?: Omit<FetchOptions, 'method'>) => 
    fetchAPI<T>(endpoint, { ...options, method: 'DELETE' }),
}; 