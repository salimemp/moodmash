import { vi } from 'vitest';

// Constants matching those in the implementation
export const DEFAULT_THROTTLE_INTERVAL = 1000;
export const DEFAULT_RETRY_COUNT = 3;
export const DEFAULT_BACKOFF_FACTOR = 2;

// Type definition for any function (same as in the original module)
export type AnyFunction = (...args: unknown[]) => unknown;

// Define ThrottleOptions interface (similar to the original)
export interface ThrottleOptions {
  interval?: number;
  onThrottle?: () => void;
}

// Define BackoffOptions interface (similar to the original)
export interface BackoffOptions {
  maxRetries?: number;
  baseDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, delay: number) => void;
}

// Define a type for mock functions to avoid using 'any'
export interface MockFn {
  mockImplementation: (implementation: (...args: unknown[]) => unknown) => MockFn;
}

// Setup mocks for the rate-limit-client module
export const setupMocks = () => {
  // Mock the rate-limit-client module
  vi.mock('@/lib/auth/rate-limit-client', () => {
    return {
      throttle: vi.fn().mockImplementation((fn: AnyFunction, _options: ThrottleOptions = {}) => {
        // Simplified throttle mock implementation
        return function(...args: unknown[]) {
          return fn(...args);
        };
      }),
      withBackoff: vi.fn().mockImplementation(async (fn: AnyFunction) => {
        return await fn();
      })
    };
  });
};

// Setup throttle mock with realistic behavior
export const setupThrottleMock = () => {
  // Reset the throttle mock to use a simplified implementation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (vi.fn() as any).mockImplementation((fn: AnyFunction, _options: ThrottleOptions = {}) => {
    const { interval = DEFAULT_THROTTLE_INTERVAL, onThrottle } = _options;
    let lastCall = 0;
    let timeout: NodeJS.Timeout | null = null;
    
    return function(...args: unknown[]) {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall;
      
      if (timeSinceLastCall < interval) {
        if (onThrottle) onThrottle();
        
        // Add queuing behavior for testing promise resolution
        if (timeout) {
          clearTimeout(timeout);
        }
        
        return new Promise((resolve) => {
          timeout = setTimeout(() => {
            lastCall = Date.now();
            resolve(fn(...args));
          }, interval - timeSinceLastCall);
        });
      }
      
      lastCall = now;
      return fn(...args);
    };
  });
};

// Setup withBackoff mock with realistic behavior
export const setupWithBackoffMock = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (vi.fn() as any).mockImplementation(async (fn: AnyFunction, options: BackoffOptions = {}) => {
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
      } catch (error) {
        attempt++;
        
        // Check if it's a rate limit error (status 429)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isRateLimitError = (error as any).status === 429 || (error as any).statusCode === 429;
        
        // If we've reached max retries or it's not a rate limit error, throw
        if (attempt >= maxRetries || !isRateLimitError) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
        
        if (onRetry) {
          onRetry(attempt, delay);
        }
        
        // Simulate waiting with advanceTimersByTime instead of setTimeout
        await new Promise(resolve => {
          setTimeout(resolve, delay);
          vi.advanceTimersByTime(delay);
        });
      }
    }
  });
}; 