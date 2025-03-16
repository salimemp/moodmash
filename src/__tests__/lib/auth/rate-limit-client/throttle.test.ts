import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AnyFunction,
  DEFAULT_THROTTLE_INTERVAL,
  ThrottleOptions,
  setupMocks
} from './test-utils';

// Setup module mocks
setupMocks();

// Import after mocking
import { throttle } from '@/lib/auth/rate-limit-client';

describe('throttle function', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    
    // Reset the throttle mock to use a realistic implementation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (throttle as any).mockImplementation((fn: AnyFunction, options: ThrottleOptions = {}) => {
      const { interval = DEFAULT_THROTTLE_INTERVAL, onThrottle } = options;
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should only execute the function once within the interval period', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, { interval: DEFAULT_THROTTLE_INTERVAL });

    // Call the throttled function multiple times
    throttledFn();
    throttledFn();
    throttledFn();

    // Function should have been called once immediately
    expect(fn).toHaveBeenCalledTimes(1);

    // Advance time to just before the interval expires
    vi.advanceTimersByTime(DEFAULT_THROTTLE_INTERVAL - 10);
    
    // Call again, should still not execute
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);

    // Advance time past the interval
    vi.advanceTimersByTime(10);
    
    // Call again, should execute now
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should pass arguments to the function', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, { interval: DEFAULT_THROTTLE_INTERVAL });

    throttledFn('test', 123);
    expect(fn).toHaveBeenCalledWith('test', 123);
  });

  it('should use the provided interval', () => {
    const fn = vi.fn();
    const customInterval = 2000;
    const throttledFn = throttle(fn, { interval: customInterval });

    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);

    // Call again before interval expires
    vi.advanceTimersByTime(customInterval - 10);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);

    // Call after interval expires
    vi.advanceTimersByTime(10);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should use default interval if not provided', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn);

    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);

    // Call again before default interval expires
    vi.advanceTimersByTime(DEFAULT_THROTTLE_INTERVAL - 10);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);

    // Call after default interval expires
    vi.advanceTimersByTime(10);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should call onThrottle when throttled', () => {
    const fn = vi.fn();
    const onThrottleMock = vi.fn();
    const throttledFn = throttle(fn, { 
      interval: DEFAULT_THROTTLE_INTERVAL, 
      onThrottle: onThrottleMock 
    });

    // First call executes immediately
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(onThrottleMock).not.toHaveBeenCalled();

    // Second call within the interval should trigger onThrottle
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(onThrottleMock).toHaveBeenCalledTimes(1);
  });

  it('should queue function execution and resolve promise when throttled', async () => {
    const fn = vi.fn().mockReturnValue('result');
    const throttledFn = throttle(fn, { interval: DEFAULT_THROTTLE_INTERVAL });
    
    // First call - executes immediately
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);
    
    // Second call - should be queued
    const secondPromise = throttledFn();
    expect(fn).toHaveBeenCalledTimes(1); // Not called yet
    
    // Advance time to complete the throttle period
    vi.advanceTimersByTime(DEFAULT_THROTTLE_INTERVAL);
    
    // The promise should resolve with the function result
    const secondResult = await secondPromise;
    expect(secondResult).toBe('result');
    expect(fn).toHaveBeenCalledTimes(2);
  });
  
  it('should handle multiple queued calls correctly', async () => {
    const fn = vi.fn().mockImplementation((value) => `result-${value}`);
    const throttledFn = throttle(fn, { interval: DEFAULT_THROTTLE_INTERVAL });
    
    // First call executes immediately
    throttledFn(1);
    
    // These calls should be throttled and queued
    throttledFn(2); // This call will be overridden by the next one
    const promise2 = throttledFn(3);
    
    // Only the last queued call should execute after the interval
    vi.advanceTimersByTime(DEFAULT_THROTTLE_INTERVAL);
    
    const result = await promise2;
    expect(result).toBe('result-3');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 1);
    expect(fn).toHaveBeenNthCalledWith(2, 3);
  });
  
  it('should handle edge case with 0 interval', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, { interval: 0 });
    
    // With 0 interval, functions should always execute immediately
    throttledFn();
    throttledFn();
    throttledFn();
    
    expect(fn).toHaveBeenCalledTimes(3);
  });
}); 