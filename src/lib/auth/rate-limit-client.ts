/**
 * Client-side rate limiting utilities
 * 
 * This module provides utilities for implementing rate limiting
 * on the client side, such as request throttling and backoff strategies.
 */

// Define default client-side rate limiting values
const DEFAULT_THROTTLE_INTERVAL = 1000; // 1 second
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_BACKOFF_FACTOR = 2;

/**
 * Options for throttling requests
 */
interface ThrottleOptions {
  interval?: number;
  onThrottle?: () => void;
}

/**
 * Type definition for any function
 */
type AnyFunction = (...args: unknown[]) => unknown;

/**
 * Creates a throttled function that limits the rate at which a function can be called
 * Using a properly constrained generic without relying on 'any'
 */
export function throttle<TFunc extends AnyFunction>(
  fn: TFunc,
  options: ThrottleOptions = {}
): (...args: Parameters<TFunc>) => Promise<ReturnType<TFunc> | undefined> {
  const { interval = DEFAULT_THROTTLE_INTERVAL, onThrottle } = options;
  let lastCall = 0;
  let timeout: NodeJS.Timeout | null = null;

  return async (...args: Parameters<TFunc>): Promise<ReturnType<TFunc> | undefined> => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall < interval) {
      if (onThrottle) {
        onThrottle();
      }

      if (timeout) {
        clearTimeout(timeout);
      }

      return new Promise((resolve) => {
        timeout = setTimeout(() => {
          lastCall = Date.now();
          // Type assertion is needed here because TS can't infer that the result will match ReturnType<TFunc>
          // This is safer than using 'any' because we're maintaining the function's signature through generics
          resolve(fn(...args) as ReturnType<TFunc>);
        }, interval - timeSinceLastCall);
      });
    }

    lastCall = now;
    return fn(...args) as ReturnType<TFunc>;
  };
}

/**
 * Options for exponential backoff
 */
interface BackoffOptions {
  maxRetries?: number;
  baseDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, delay: number) => void;
}

/**
 * Error type for API responses
 */
interface ApiError extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * Implements exponential backoff for API requests
 */
export async function withBackoff<T>(
  fn: () => Promise<T>,
  options: BackoffOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_RETRY_COUNT,
    baseDelay = DEFAULT_THROTTLE_INTERVAL,
    backoffFactor = DEFAULT_BACKOFF_FACTOR,
    onRetry
  } = options;

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error: unknown) {
      attempt++;

      // Cast to ApiError to access status properties
      const apiError = error as ApiError;
      
      // Check if it's a rate limit error (429)
      const isRateLimitError = apiError.status === 429 || apiError.statusCode === 429;

      // If we've reached max retries or it's not a rate limit error, throw
      if (attempt >= maxRetries || !isRateLimitError) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
      
      if (onRetry) {
        onRetry(attempt, delay);
      }

      // Wait with backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
} 