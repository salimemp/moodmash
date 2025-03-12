import { cn, debounce, delay, formatDate, safeParseJSON } from '@/lib/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Tests for utility functions
// Validates core utility functions used throughout the application
describe('Utility Functions', () => {
  // Tests for the cn (class names) function
  // Validates Tailwind class merging functionality
  describe('cn', () => {
    it('should merge class names correctly', () => {
      // Test basic merging
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
      
      // Test with conditional classes - note that tailwind-merge will remove duplicates
      // and text-lg will override text-base since they're in the same utility group
      expect(cn('text-base', true && 'text-lg', false && 'text-sm')).toBe('text-lg');
      
      // Test with array of classes
      expect(cn(['text-red-500', 'bg-blue-500'])).toBe('text-red-500 bg-blue-500');
    });

    it('should handle Tailwind conflicts correctly', () => {
      // Test that later classes override earlier ones with the same utility
      expect(cn('text-sm', 'text-lg')).toBe('text-lg');
      expect(cn('p-2', 'p-4')).toBe('p-4');
      
      // Test with mixed formats
      expect(cn('text-red-500', { 'text-blue-500': true })).toBe('text-blue-500');
    });
  });

  // Tests for the safeParseJSON function
  // Validates safe JSON parsing with fallback
  describe('safeParseJSON', () => {
    it('should parse valid JSON correctly', () => {
      const validJSON = '{"name":"John","age":30}';
      const fallback = { name: 'Default', age: 0 };
      
      expect(safeParseJSON(validJSON, fallback)).toEqual({ name: 'John', age: 30 });
    });

    it('should return fallback for invalid JSON', () => {
      const invalidJSON = '{name:"John",age:30}'; // Missing quotes around keys
      const fallback = { name: 'Default', age: 0 };
      
      expect(safeParseJSON(invalidJSON, fallback)).toEqual(fallback);
    });

    it('should handle arrays correctly', () => {
      const arrayJSON = '[1,2,3,4]';
      const fallback: number[] = [];
      
      expect(safeParseJSON(arrayJSON, fallback)).toEqual([1, 2, 3, 4]);
    });

    it('should handle primitive values correctly', () => {
      expect(safeParseJSON('42', 0)).toBe(42);
      expect(safeParseJSON('true', false)).toBe(true);
      expect(safeParseJSON('"hello"', '')).toBe('hello');
    });
  });

  // Tests for the debounce function
  // Validates debouncing behavior for function calls
  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should debounce function calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 500);

      // Call multiple times
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // Function should not have been called yet
      expect(mockFn).not.toHaveBeenCalled();

      // Fast-forward time
      vi.advanceTimersByTime(500);

      // Function should have been called exactly once
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn('test', 123);
      vi.advanceTimersByTime(500);

      expect(mockFn).toHaveBeenCalledWith('test', 123);
    });

    it('should reset timer on subsequent calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn();
      
      // Advance time but not enough to trigger
      vi.advanceTimersByTime(300);
      expect(mockFn).not.toHaveBeenCalled();
      
      // Call again, which should reset the timer
      debouncedFn();
      
      // Advance time but not enough to trigger from the second call
      vi.advanceTimersByTime(300);
      expect(mockFn).not.toHaveBeenCalled();
      
      // Advance enough time to trigger from the second call
      vi.advanceTimersByTime(200);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  // Tests for the delay function
  // Validates Promise-based delay functionality
  describe('delay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should resolve after specified time', async () => {
      const mockFn = vi.fn();
      
      const promise = delay(1000).then(mockFn);
      
      // Function should not have been called yet
      expect(mockFn).not.toHaveBeenCalled();
      
      // Fast-forward time
      vi.advanceTimersByTime(1000);
      
      // Wait for promise to resolve
      await promise;
      
      // Function should have been called
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should work with different delay values', async () => {
      const mockFn = vi.fn();
      
      const promise = delay(500).then(mockFn);
      
      // Advance time but not enough
      vi.advanceTimersByTime(300);
      await Promise.resolve(); // Let any pending promises run
      expect(mockFn).not.toHaveBeenCalled();
      
      // Advance remaining time
      vi.advanceTimersByTime(200);
      await promise;
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  // Tests for the formatDate function
  // Validates date formatting with different options
  describe('formatDate', () => {
    it('should format date with default options', () => {
      // Create a fixed date for testing
      const testDate = new Date(2023, 0, 15, 14, 30, 0); // Jan 15, 2023, 2:30 PM
      
      // Format with default options
      const formatted = formatDate(testDate);
      
      // Check that it contains expected parts (exact format may vary by locale)
      expect(formatted).toContain('2023');
      expect(formatted).toMatch(/Jan|January/);
      expect(formatted).toContain('15');
      expect(formatted).toMatch(/2:30|14:30/);
    });

    it('should format date with custom options', () => {
      const testDate = new Date(2023, 0, 15, 14, 30, 0);
      
      // Test with date-only format
      const dateOnly = formatDate(testDate, { dateStyle: 'long' });
      expect(dateOnly).toContain('2023');
      expect(dateOnly).not.toMatch(/2:30|14:30/);
      
      // Test with time-only format
      const timeOnly = formatDate(testDate, { timeStyle: 'medium' });
      expect(timeOnly).toMatch(/2:30|14:30/);
      expect(timeOnly).not.toContain('2023');
      
      // Test with numeric format
      const numeric = formatDate(testDate, { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
      expect(numeric).toMatch(/01\/15\/2023|15\/01\/2023|2023[\/-]01[\/-]15/);
    });

    it('should handle different date inputs', () => {
      // Test with date string
      const dateFromString = new Date('2023-01-15T14:30:00');
      expect(formatDate(dateFromString)).toContain('2023');
      
      // Test with timestamp
      const dateFromTimestamp = new Date(1673793000000); // Equivalent to a specific date
      expect(formatDate(dateFromTimestamp)).toBeTruthy();
    });
  });
}); 