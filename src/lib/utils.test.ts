import { describe, expect, it } from 'vitest';
import { cn, safeParseJSON } from './utils';


// Tests for Utils functionality
// Validates core behaviors and edge cases

// Tests for the utils module
// Validates core functionality and edge cases
// Tests for cn utility functionality
// Validates expected behavior in various scenarios
describe('cn utility', () => {
  // Verifies should merge class names
// Ensures expected behavior in this scenario
it('should merge class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  // Verifies should handle conditional class names
// Ensures expected behavior in this scenario
it('should handle conditional class names', () => {
    const condition = true;
    const result = cn('class1', condition ? 'class2' : '');
    expect(result).toBe('class1 class2');
  });

  // Verifies should handle falsy values
// Ensures expected behavior in this scenario
it('should handle falsy values', () => {
    const result = cn('class1', false && 'class2', null, undefined, 0, '');
    expect(result).toBe('class1');
  });

  // Verifies should handle tailwind-merge functionality
// Ensures expected behavior in this scenario
it('should handle tailwind-merge functionality', () => {
    const result = cn('pt-2 pt-4', 'pt-6');
    // tailwind-merge should override the pt-2 and pt-4 with pt-6
    expect(result).toBe('pt-6');
  });
});

// Tests for safeparsejson utility functionality
// Validates expected behavior in various scenarios
describe('safeParseJSON utility', () => {
  // Verifies validation logic
// Ensures data meets expected format and requirements
it('should parse valid JSON correctly', () => {
    const json = '{"name":"test","value":123}';
    const result = safeParseJSON(json, {});
    expect(result).toEqual({ name: 'test', value: 123 });
  });

  // Verifies the correct return value
// Ensures the function behaves as expected
it('should return fallback for invalid JSON', () => {
    const invalidJson = '{name:test}';
    const fallback = { name: 'fallback' };
    const result = safeParseJSON(invalidJson, fallback);
    expect(result).toBe(fallback);
  });
});
