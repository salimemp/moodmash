/**
 * Utility Function Tests
 * Tests for date formatting, currency, validation, and other utilities
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Utility Functions', () => {
  describe('Date Formatting', () => {
    const formatDate = (date: Date | string, format: string = 'full'): string => {
      const d = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(d.getTime())) return 'Invalid Date';
      
      switch (format) {
        case 'short':
          return d.toLocaleDateString();
        case 'time':
          return d.toLocaleTimeString();
        case 'iso':
          return d.toISOString().split('T')[0];
        case 'full':
        default:
          return d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
      }
    };

    it('should format date in full format', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date, 'full');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('January');
    });

    it('should format date as ISO string', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date, 'iso')).toBe('2024-01-15');
    });

    it('should handle string input', () => {
      const formatted = formatDate('2024-01-15', 'iso');
      expect(formatted).toBe('2024-01-15');
    });

    it('should return Invalid Date for bad input', () => {
      expect(formatDate('invalid', 'iso')).toBe('Invalid Date');
    });
  });

  describe('Currency Formatting', () => {
    const formatCurrency = (amount: number, currency: string = 'USD', locale: string = 'en-US'): string => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(amount);
    };

    it('should format USD correctly', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
    });

    it('should format EUR correctly', () => {
      const formatted = formatCurrency(1234.56, 'EUR', 'de-DE');
      expect(formatted).toContain('1.234,56');
      expect(formatted).toContain('€');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0, 'USD')).toBe('$0.00');
    });

    it('should handle negative amounts', () => {
      const formatted = formatCurrency(-100, 'USD');
      expect(formatted).toContain('100');
      expect(formatted).toContain('-');
    });
  });

  describe('String Utilities', () => {
    const capitalize = (str: string): string => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const truncate = (str: string, maxLength: number): string => {
      if (str.length <= maxLength) return str;
      return str.slice(0, maxLength - 3) + '...';
    };

    const slugify = (str: string): string => {
      return str
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    };

    it('should capitalize strings', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
      expect(capitalize('')).toBe('');
    });

    it('should truncate long strings', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...');
      expect(truncate('Hi', 10)).toBe('Hi');
    });

    it('should slugify strings', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      // Special chars are removed, multiple dashes collapsed to single
      expect(slugify('Test! @#$ String')).toBe('test-string');
    });
  });

  describe('Validation Helpers', () => {
    const isValidUUID = (str: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    const isValidUrl = (str: string): boolean => {
      try {
        new URL(str);
        return true;
      } catch {
        return false;
      }
    };

    const isValidJSON = (str: string): boolean => {
      try {
        JSON.parse(str);
        return true;
      } catch {
        return false;
      }
    };

    it('should validate UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('invalid-uuid')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });

    it('should validate URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('not-a-url')).toBe(false);
    });

    it('should validate JSON strings', () => {
      expect(isValidJSON('{"key": "value"}')).toBe(true);
      expect(isValidJSON('[1, 2, 3]')).toBe(true);
      expect(isValidJSON('invalid json')).toBe(false);
    });
  });

  describe('Array Utilities', () => {
    const unique = <T>(arr: T[]): T[] => [...new Set(arr)];
    
    const chunk = <T>(arr: T[], size: number): T[][] => {
      const chunks: T[][] = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    };

    const shuffle = <T>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    it('should remove duplicates', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(unique(['a', 'b', 'a'])).toEqual(['a', 'b']);
    });

    it('should chunk arrays', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
    });

    it('should shuffle arrays', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);
      expect(shuffled.length).toBe(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });
  });
});
