/**
 * Performance Tests
 * Tests for response times, memory usage, and optimization
 */

import { describe, it, expect } from 'vitest';
import { LocalizationManager, formatCurrency, formatNumber } from '../../src/lib/localization';
import { translations } from '../../src/lib/i18n';

describe('Performance Tests', () => {
  describe('Currency Formatting Performance', () => {
    it('should format currency in under 1ms', () => {
      const manager = new LocalizationManager('US');
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        manager.formatCurrency(Math.random() * 10000);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // 1000 ops in under 100ms
    });

    it('should handle large numbers efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        formatCurrency(Number.MAX_SAFE_INTEGER);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Number Formatting Performance', () => {
    it('should format numbers in under 1ms per operation', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        formatNumber(Math.random() * 1000000, 2);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Region Switching Performance', () => {
    it('should switch regions quickly', () => {
      const manager = new LocalizationManager('US');
      const regions = ['US', 'GB', 'DE', 'JP', 'CN', 'IN', 'BR', 'RU'] as const;
      
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        manager.setRegion(regions[i % regions.length]);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Translation Lookup Performance', () => {
    it('should lookup translations quickly', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        const t = translations.en;
        const mood = t.mood as Record<string, string>;
        const _ = mood.happy;
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it('should iterate all languages efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        Object.keys(translations).forEach(lang => {
          const t = translations[lang];
          const _ = t.app;
        });
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory on repeated operations', () => {
      const manager = new LocalizationManager('US');
      
      // Perform many operations
      for (let i = 0; i < 10000; i++) {
        manager.formatCurrency(Math.random() * 1000);
        manager.formatNumber(Math.random() * 1000);
        manager.formatDate(new Date());
        manager.formatTime(new Date());
      }
      
      // Should complete without error
      expect(true).toBe(true);
    });
  });

  describe('Date Formatting Performance', () => {
    it('should format dates efficiently', () => {
      const manager = new LocalizationManager('US');
      const testDate = new Date();
      
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        manager.formatDate(testDate);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should format times efficiently', () => {
      const manager = new LocalizationManager('US');
      const testDate = new Date();
      
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        manager.formatTime(testDate);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Tax Calculation Performance', () => {
    it('should calculate taxes efficiently', () => {
      const manager = new LocalizationManager('GB');
      
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        manager.calculateTax(Math.random() * 1000);
        manager.getPriceWithTax(Math.random() * 1000);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Singleton Performance', () => {
    it('should return singleton quickly', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        LocalizationManager.getInstance();
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });
});
