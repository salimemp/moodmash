import { describe, it, expect } from 'vitest';
import { cn } from './utils';

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