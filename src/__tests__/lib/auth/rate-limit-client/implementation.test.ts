import { throttle, withBackoff } from '@/lib/auth/rate-limit-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Extend Error to include status property for testing
interface TestError extends Error {
  status?: number;
  statusCode?: number;
}

// Unmock the module to test real implementation
vi.unmock('@/lib/auth/rate-limit-client');

describe('Rate Limit Client Implementation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  describe('throttle function', () => {
    it('should execute function immediately for first call', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      const throttled = throttle(fn);
      
      const result = await throttled();
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
    });

    it('should throttle subsequent calls within interval', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      const onThrottle = vi.fn();
      const throttled = throttle(fn, { interval: 1000, onThrottle });
      
      // First call - should execute
      await throttled();
      
      // Second call within interval - should be throttled
      await throttled();
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(onThrottle).toHaveBeenCalledTimes(1);
    });

    it('should invoke onThrottle callback when throttled', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      const onThrottle = vi.fn();
      const throttled = throttle(fn, { interval: 1000, onThrottle });
      
      // First call - should execute
      await throttled();
      
      // Second call within interval - should be throttled
      await throttled();
      
      expect(onThrottle).toHaveBeenCalledTimes(1);
    });

    it('should use default interval when not specified', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      const throttled = throttle(fn);
      
      // First call - should execute
      await throttled();
      
      // Second call immediately - should be throttled
      await throttled();
      
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Advance time past the default interval (1000ms)
      vi.advanceTimersByTime(1001);
      
      // Third call after interval - should execute
      await throttled();
      
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should replace pending throttled calls with newest call', async () => {
      const fn = vi.fn().mockImplementation(arg => arg);
      const throttled = throttle(fn, { interval: 1000 });
      
      // First call - should execute
      const result1 = await throttled('first');
      expect(result1).toBe('first');
      
      // Call with different argument - should be throttled but stored
      const promise2 = throttled('second');
      
      // Call again with yet another argument - should replace the previous throttled call
      const promise3 = throttled('third');
      
      // Advance time to execute pending call
      vi.advanceTimersByTime(1001);
      
      // The third call should be executed, not the second
      const result3 = await promise3;
      expect(result3).toBe('third');
      
      // The second call should resolve with the result from the third call
      const result2 = await promise2;
      expect(result2).toBe('third');
      
      // Function should have been called twice (once for first, once for third)
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenCalledWith('first');
      expect(fn).toHaveBeenCalledWith('third');
    });
  });

  describe('withBackoff function', () => {
    it('should execute function and return result when successful', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      const result = await withBackoff(fn);
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toBe('success');
    });

    it('should retry on rate limit error (429)', async () => {
      // Create error with status 429
      const rateLimitError = new Error('Rate limited') as TestError;
      rateLimitError.status = 429;
      
      const mockFn = vi.fn()
        .mockRejectedValueOnce(rateLimitError)  // First call fails
        .mockResolvedValueOnce('success');      // Second call succeeds
      
      const onRetryMock = vi.fn();
      
      // Start the function execution
      const resultPromise = withBackoff(mockFn, { 
        maxRetries: 3,
        baseDelay: 1000, 
        onRetry: onRetryMock
      });
      
      // First attempt fails, onRetry should be called
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // Manually trigger the retry callback that would happen in setTimeout
      // (since we're using fake timers)
      vi.advanceTimersByTime(1000);
      
      // Second attempt should succeed
      const result = await resultPromise;
      
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(onRetryMock).toHaveBeenCalledTimes(1);
      expect(onRetryMock).toHaveBeenCalledWith(1, 1000);
      expect(result).toBe('success');
    });

    it('should retry with exponential backoff', async () => {
      // Create error with status 429
      const rateLimitError = new Error('Rate limited') as TestError;
      rateLimitError.status = 429;
      
      const mockFn = vi.fn()
        .mockRejectedValueOnce(rateLimitError)  // First call fails
        .mockRejectedValueOnce(rateLimitError)  // Second call fails
        .mockResolvedValueOnce('success');      // Third call succeeds
      
      const onRetryMock = vi.fn();
      
      // Start the function execution
      const resultPromise = withBackoff(mockFn, { 
        maxRetries: 3,
        baseDelay: 1000, 
        onRetry: onRetryMock
      });
      
      // First attempt fails
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // Advance time for first retry (1000ms)
      vi.advanceTimersByTime(1000);
      
      // Second attempt should fail
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(onRetryMock).toHaveBeenCalledTimes(1);
      expect(onRetryMock).toHaveBeenCalledWith(1, 1000);
      
      // Advance time for second retry (2000ms - exponential backoff)
      vi.advanceTimersByTime(2000);
      
      // Third attempt should succeed
      const result = await resultPromise;
      
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(onRetryMock).toHaveBeenCalledTimes(2);
      expect(onRetryMock).toHaveBeenCalledWith(2, 2000);
      expect(result).toBe('success');
    });

    it('should stop retrying after max retries', async () => {
      // Create error with status 429
      const rateLimitError = new Error('Rate limited') as TestError;
      rateLimitError.status = 429;
      
      const mockFn = vi.fn().mockRejectedValue(rateLimitError);
      const onRetryMock = vi.fn();
      
      // Set max retries to 2
      const resultPromise = withBackoff(mockFn, { 
        maxRetries: 2,
        baseDelay: 1000, 
        onRetry: onRetryMock
      });
      
      // First attempt
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // Advance time for first retry
      vi.advanceTimersByTime(1000);
      
      // Second attempt
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(onRetryMock).toHaveBeenCalledTimes(1);
      
      // Advance time for second retry
      vi.advanceTimersByTime(2000);
      
      // Third attempt (last retry)
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(onRetryMock).toHaveBeenCalledTimes(2);
      
      // Should eventually throw the rate limit error
      await expect(resultPromise).rejects.toThrow('Rate limited');
    });

    it('should not retry on non-rate-limit errors', async () => {
      const error = new Error('Generic error');
      const mockFn = vi.fn().mockRejectedValue(error);
      
      // Should throw the error without retrying
      await expect(withBackoff(mockFn)).rejects.toThrow('Generic error');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should respect statusCode for rate limit detection', async () => {
      // Create error with custom status code (not 429, but use statusCode)
      const customError = new Error('Custom rate limit') as TestError;
      customError.statusCode = 429; // Use statusCode instead of status
      
      const mockFn = vi.fn()
        .mockRejectedValueOnce(customError)  // First call fails
        .mockResolvedValueOnce('success');   // Second call succeeds
      
      const onRetryMock = vi.fn();
      
      // Configure function to handle statusCode=429
      const resultPromise = withBackoff(mockFn, { 
        maxRetries: 3,
        baseDelay: 1000, 
        onRetry: onRetryMock
      });
      
      // First attempt fails with statusCode=429
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // Advance time for retry
      vi.advanceTimersByTime(1000);
      
      // Second attempt should succeed
      const result = await resultPromise;
      
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(onRetryMock).toHaveBeenCalledTimes(1);
      expect(result).toBe('success');
    });

    it('should use default options when not specified', async () => {
      // Create error with status 429
      const rateLimitError = new Error('Rate limited') as TestError;
      rateLimitError.status = 429;
      
      const mockFn = vi.fn()
        .mockRejectedValueOnce(rateLimitError)  // First call fails
        .mockResolvedValueOnce('success');      // Second call succeeds
      
      // Start the function execution with default options
      const resultPromise = withBackoff(mockFn);
      
      // First attempt fails
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // Advance time for retry with default delay (1000ms)
      vi.advanceTimersByTime(1000);
      
      // Second attempt should succeed
      const result = await resultPromise;
      
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(result).toBe('success');
    });
  });
}); 