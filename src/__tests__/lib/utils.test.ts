import { cn, debounce, safeParseJSON } from '@/lib/utils';
import { describe, expect, it, vi } from 'vitest';

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle conditional class names', () => {
    const condition = true;
    const result = cn('class1', condition ? 'class2' : '');
    expect(result).toBe('class1 class2');
  });

  it('should handle falsy values', () => {
    const result = cn('class1', false && 'class2', null, undefined, 0, '');
    expect(result).toBe('class1');
  });

  it('should handle tailwind-merge functionality', () => {
    const result = cn('pt-2 pt-4', 'pt-6');
    // tailwind-merge should override the pt-2 and pt-4 with pt-6
    expect(result).toBe('pt-6');
  });
});

describe('safeParseJSON utility', () => {
  it('should parse valid JSON correctly', () => {
    const json = '{"name":"test","value":123}';
    const result = safeParseJSON(json, {});
    expect(result).toEqual({ name: 'test', value: 123 });
  });

  it('should return fallback for invalid JSON', () => {
    const invalidJson = '{name:test}';
    const fallback = { name: 'fallback' };
    const result = safeParseJSON(invalidJson, fallback);
    expect(result).toBe(fallback);
  });
});

describe('debounce utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should debounce the function call', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should use the latest call parameters', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('first');
    vi.advanceTimersByTime(200);
    
    debouncedFn('second');
    vi.advanceTimersByTime(200);
    
    debouncedFn('third');
    vi.advanceTimersByTime(300);
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('third');
  });
}); 