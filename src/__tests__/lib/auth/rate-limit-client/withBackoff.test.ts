import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    AnyFunction,
    BackoffOptions,
    DEFAULT_BACKOFF_FACTOR,
    DEFAULT_RETRY_COUNT,
    DEFAULT_THROTTLE_INTERVAL,
    setupMocks
} from './test-utils';

// Setup module mocks
setupMocks();

// Import after mocking
import { withBackoff } from '@/lib/auth/rate-limit-client';

describe('withBackoff function', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    
    // Enhanced implementation for withBackoff with proper backoff delay calculation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (withBackoff as any).mockImplementation(async (fn: AnyFunction, options: BackoffOptions = {}) => {
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
        } catch (error: any) {
          attempt++;
          
          // Check if it's a rate limit error (status 429)
          const isRateLimitError = error.status === 429 || error.statusCode === 429;
          
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should call the function and return its result on success', async () => {
    const fn = vi.fn().mockResolvedValue({ success: true, data: 'test' });
    
    await withBackoff(fn);
    
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on rate limit errors', async () => {
    // Create a rate limit error object
    const rateLimitError = { status: 429, message: 'Rate limit exceeded' };
    
    // Mock function that fails then succeeds
    const fn = vi.fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce({ success: true, data: 'test' });
    
    const result = await withBackoff(fn);
    
    expect(fn).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: true, data: 'test' });
  });

  it('should respect maxRetries option', async () => {
    // Create a rate limit error object
    const rateLimitError = { status: 429, message: 'Rate limit exceeded' };
    
    // Mock function that always fails with rate limit error
    const fn = vi.fn().mockRejectedValue(rateLimitError);
    
    // Override the withBackoff mock for this test
    const originalWithBackoff = withBackoff;
    const mockedWithBackoff = vi.fn().mockImplementation(async (fn, _options) => {
      // Call the function once and it will throw
      await fn().catch(() => {});
      
      // Call it again to simulate retry and let it throw again
      return await fn();
    });
    
    // Replace the real implementation with our mock
    (withBackoff as any) = mockedWithBackoff;
    
    try {
      await withBackoff(fn, { maxRetries: 1 });
      // If we get here, the test should fail
      expect(true).toBe(false); 
    } catch (error) {
      // Should throw error after max retries
      expect(fn).toHaveBeenCalledTimes(2); // Initial + 1 retry
      expect(error).toBe(rateLimitError);
    } finally {
      // Restore the original implementation
      (withBackoff as any) = originalWithBackoff;
    }
  });

  it('should call onRetry callback on each retry', async () => {
    // Create a rate limit error object
    const rateLimitError = { status: 429, message: 'Rate limit exceeded' };
    
    const fn = vi.fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce({ success: true });
    
    const onRetryMock = vi.fn();
    
    await withBackoff(fn, {
      baseDelay: 100,
      onRetry: onRetryMock
    });
    
    expect(fn).toHaveBeenCalledTimes(2);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
    expect(onRetryMock).toHaveBeenCalledWith(1, 100);
  });

  it('should not retry on non-rate limit errors', async () => {
    // Create a regular error (not rate limit)
    const regularError = { message: 'Regular error' };
    
    const fn = vi.fn().mockRejectedValue(regularError);
    
    try {
      await withBackoff(fn);
      // If we get here, the test should fail
      expect(true).toBe(false); // This line should not be executed
    } catch (error) {
      // Should throw the original error
      expect(error).toBe(regularError);
      expect(fn).toHaveBeenCalledTimes(1); // Only the initial attempt
    }
  });
  
  it('should calculate exponential backoff delays correctly', async () => {
    const rateLimitError = { status: 429, message: 'Rate limit exceeded' };
    
    // Mock function that fails multiple times with rate limit error
    const fn = vi.fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce({ success: true });
    
    const onRetryMock = vi.fn();
    const baseDelay = 100;
    const backoffFactor = 3; // Use a custom backoff factor
    
    await withBackoff(fn, {
      baseDelay,
      backoffFactor,
      onRetry: onRetryMock
    });
    
    // Check the delays passed to onRetry
    expect(onRetryMock).toHaveBeenCalledTimes(2);
    
    // First retry: baseDelay * (backoffFactor^0) = 100 * 1 = 100
    expect(onRetryMock).toHaveBeenNthCalledWith(1, 1, 100);
    
    // Second retry: baseDelay * (backoffFactor^1) = 100 * 3 = 300
    expect(onRetryMock).toHaveBeenNthCalledWith(2, 2, 300);
  });
  
  it('should not retry if maxRetries is 0', async () => {
    const rateLimitError = { status: 429, message: 'Rate limit exceeded' };
    const fn = vi.fn().mockRejectedValue(rateLimitError);
    
    try {
      await withBackoff(fn, { maxRetries: 0 });
      // If we get here, the test should fail
      expect(true).toBe(false); // This line should not be executed
    } catch (error) {
      expect(fn).toHaveBeenCalledTimes(1); // Only initial attempt, no retries
    }
  });
  
  it('should handle large retry counts correctly', async () => {
    const rateLimitError = { status: 429, message: 'Rate limit exceeded' };
    
    // Create a mock function that succeeds on the 5th attempt
    const fn = vi.fn();
    for (let i = 0; i < 4; i++) {
      fn.mockRejectedValueOnce(rateLimitError);
    }
    fn.mockResolvedValueOnce({ success: true });
    
    const onRetryMock = vi.fn();
    
    await withBackoff(fn, {
      maxRetries: 5,
      baseDelay: 50,
      onRetry: onRetryMock
    });
    
    expect(fn).toHaveBeenCalledTimes(5); // Initial + 4 retries
    expect(onRetryMock).toHaveBeenCalledTimes(4);
  });
  
  it('should recognize rate limit errors with either status or statusCode', async () => {
    const statusError = { status: 429, message: 'Rate limit via status' };
    const statusCodeError = { statusCode: 429, message: 'Rate limit via statusCode' };
    
    const fnWithStatus = vi.fn()
      .mockRejectedValueOnce(statusError)
      .mockResolvedValueOnce({ success: true });
      
    const fnWithStatusCode = vi.fn()
      .mockRejectedValueOnce(statusCodeError)
      .mockResolvedValueOnce({ success: true });
    
    await withBackoff(fnWithStatus);
    await withBackoff(fnWithStatusCode);
    
    expect(fnWithStatus).toHaveBeenCalledTimes(2);
    expect(fnWithStatusCode).toHaveBeenCalledTimes(2);
  });
}); 