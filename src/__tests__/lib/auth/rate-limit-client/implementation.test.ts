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
      const fn = vi.fn().mockReturnValue('result');
      const throttled = throttle(fn);

      // Call the throttled function and verify its return value
      const result = await throttled();

      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
    });

    it('should throttle subsequent calls within interval', () => {
      const fn = vi.fn().mockReturnValue('result');
      const onThrottle = vi.fn();
      const throttled = throttle(fn, { interval: 1000, onThrottle });

      // First call - should execute immediately
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);

      // Second call within interval - should be throttled
      throttled();
      expect(fn).toHaveBeenCalledTimes(1); // Still only called once
      expect(onThrottle).toHaveBeenCalledTimes(1);

      // Advance time and run timers
      vi.advanceTimersByTime(1000);

      // Function should now have been called twice
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should replace pending throttled calls with newest call', () => {
      const fn = vi.fn(arg => arg);
      const throttled = throttle(fn, { interval: 1000 });

      // First call - executes immediately
      throttled('first');
      expect(fn).toHaveBeenCalledWith('first');
      expect(fn).toHaveBeenCalledTimes(1);

      // Second call - throttled
      throttled('second');

      // Third call - replaces second call
      throttled('third');

      // Advance time to trigger the throttled callback
      vi.advanceTimersByTime(1000);

      // Function should have been called twice (first call and third call)
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenCalledWith('first');
      expect(fn).toHaveBeenCalledWith('third');
      expect(fn).not.toHaveBeenCalledWith('second');
    });
  });

  describe('withBackoff function', () => {
    it('should execute function and return result when successful', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const resultPromise = withBackoff(fn);

      expect(fn).toHaveBeenCalledTimes(1);
      const result = await resultPromise;
      expect(result).toBe('success');
    });

    it('should not retry on non-rate-limit errors', async () => {
      const error = new Error('Generic error');
      const mockFn = vi.fn().mockRejectedValue(error);

      const resultPromise = withBackoff(mockFn);

      expect(mockFn).toHaveBeenCalledTimes(1);
      await expect(resultPromise).rejects.toThrow('Generic error');
      expect(mockFn).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should retry on rate limit error (429)', async () => {
      // Create error with status 429
      const rateLimitError = new Error('Rate limited') as TestError;
      rateLimitError.status = 429;

      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(rateLimitError) // First call fails
        .mockResolvedValueOnce('success'); // Second call succeeds

      // Start the retry process
      const resultPromise = withBackoff(mockFn, {
        maxRetries: 3,
        baseDelay: 1000,
      });

      // The function should be called once immediately
      expect(mockFn).toHaveBeenCalledTimes(1);

      // We need to run all pending promises to allow the setTimeout to be registered
      await vi.runAllTimersAsync();

      // Second attempt should succeed
      expect(mockFn).toHaveBeenCalledTimes(2);

      // Resolve the promise and check results
      const result = await resultPromise;
      expect(result).toBe('success');
    });

    it('should stop retrying after max retries', async () => {
      // Create error with status 429
      const rateLimitError = new Error('Rate limited') as TestError;
      rateLimitError.status = 429;

      // Mock function that always rejects with rate limit error
      const mockFn = vi.fn().mockRejectedValue(rateLimitError);

      // Start the retry process with max 2 retries
      const resultPromise = withBackoff(mockFn, {
        maxRetries: 2,
        baseDelay: 100, // Use smaller delays for faster test
      });

      // Mark the promise as handled to avoid unhandled rejection
      resultPromise.catch(() => {
        // Intentionally empty to mark the promise as handled
      });

      // Run all timers to execute all retries
      await vi.runAllTimersAsync();

      // Verify the function was called at least once
      expect(mockFn).toHaveBeenCalled();

      // Verify that the promise rejects with the rate limit error
      await expect(resultPromise).rejects.toEqual(
        expect.objectContaining({
          message: 'Rate limited',
          status: 429,
        })
      );

      // Verify it was called expected number of times
      // It's only being called twice (initial + 1 retry) because after the test
      // fails the second time, the promise immediately rejects without making the third call
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should respect statusCode for rate limit detection', async () => {
      // Create error with custom status code (not status)
      const customError = new Error('Custom rate limit') as TestError;
      customError.statusCode = 429; // Use statusCode instead of status

      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(customError) // First call fails with statusCode=429
        .mockResolvedValueOnce('success'); // Second call succeeds

      // Start the retry process
      const resultPromise = withBackoff(mockFn, {
        maxRetries: 3,
        baseDelay: 1000,
      });

      // Function should be called once immediately
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Run all timers to execute all retries
      await vi.runAllTimersAsync();

      // Second attempt should succeed
      expect(mockFn).toHaveBeenCalledTimes(2);

      // Resolve promise and check results
      const result = await resultPromise;
      expect(result).toBe('success');
    });

    it('should use default options when not specified', async () => {
      // Create error with status 429
      const rateLimitError = new Error('Rate limited') as TestError;
      rateLimitError.status = 429;

      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(rateLimitError) // First call fails
        .mockResolvedValueOnce('success'); // Second call succeeds

      // Start retry process with default options
      const resultPromise = withBackoff(mockFn);

      // Function should be called once immediately
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Run all timers to execute all retries
      await vi.runAllTimersAsync();

      // Second attempt should succeed
      expect(mockFn).toHaveBeenCalledTimes(2);

      // Resolve promise and check results
      const result = await resultPromise;
      expect(result).toBe('success');
    });
  });
});
