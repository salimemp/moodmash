import {
    dateLocales,
    formatCurrency,
    formatDate,
    formatDatePattern,
    formatFileSize,
    formatNumber,
    formatPercent,
    formatRelativeDate,
    formatTimeAgo,
    getCurrencySymbol,
    getDateLocale
} from '@/utils/intlFormatters';
import { describe, expect, it } from 'vitest';

describe('International Formatters', () => {
  describe('Date formatting', () => {
    const testDate = new Date('2023-01-15T12:30:45');
    
    it('should format dates correctly for English locale', () => {
      const formatted = formatDate(testDate, 'en');
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('2023');
    });
    
    it('should format dates correctly for French locale', () => {
      const formatted = formatDate(testDate, 'fr');
      expect(formatted).toBeDefined();
      // French date format should use slashes or dots
      expect(formatted.includes('/') || formatted.includes('.')).toBe(true);
    });
    
    it('should format dates with specific patterns', () => {
      const pattern = 'yyyy-MM-dd';
      const formatted = formatDatePattern(testDate, 'en', pattern);
      expect(formatted).toBe('2023-01-15');
      
      const timePattern = 'HH:mm';
      const formattedTime = formatDatePattern(testDate, 'en', timePattern);
      expect(formattedTime).toBe('12:30');
    });
    
    it('should format relative dates', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const formatted = formatRelativeDate(yesterday, 'en', today);
      expect(formatted).toContain('yesterday');
      
      // Test with different locales
      const frFormatted = formatRelativeDate(yesterday, 'fr', today);
      expect(typeof frFormatted).toBe('string');
      expect(frFormatted.length).toBeGreaterThan(0);
    });
    
    it('should format time ago', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      const formatted = formatTimeAgo(fiveMinutesAgo, 'en');
      expect(formatted).toContain('minute');
    });
    
    it('should handle different date input formats', () => {
      // Test with timestamp
      const timestamp = testDate.getTime();
      const formatted1 = formatDate(timestamp, 'en');
      expect(formatted1).toBeDefined();
      
      // Test with ISO string
      const isoString = testDate.toISOString();
      const formatted2 = formatDate(isoString, 'en');
      expect(formatted2).toBeDefined();
      
      // Both should produce the same output
      expect(formatted1).toBe(formatted2);
    });
    
    it('should apply formatting options', () => {
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      } as Intl.DateTimeFormatOptions;
      
      const formatted = formatDate(testDate, 'en', options);
      expect(formatted).toContain('January');
      expect(formatted).toContain('2023');
      expect(formatted).toContain('15');
    });
  });
  
  describe('Number formatting', () => {
    it('should format numbers correctly', () => {
      const formatted = formatNumber(1234.56, 'en');
      expect(formatted).toBe('1,234.56');
      
      const frFormatted = formatNumber(1234.56, 'fr');
      // French uses spaces or dots as thousand separators and comma as decimal
      expect(frFormatted).toMatch(/1[\s.]234,56/);
    });
    
    it('should format currency correctly', () => {
      const formatted = formatCurrency(1234.56, 'en', 'USD');
      expect(formatted).toContain('$');
      expect(formatted).toContain('1,234.56');
      
      const eurFormatted = formatCurrency(1234.56, 'de', 'EUR');
      expect(eurFormatted).toContain('€');
    });
    
    it('should format percentages correctly', () => {
      const formatted = formatPercent(0.1234, 'en');
      expect(formatted).toBe('12.34%');
      
      const frFormatted = formatPercent(0.1234, 'fr');
      expect(frFormatted).toContain('12');
      expect(frFormatted).toContain('%');
    });
    
    it('should format file sizes correctly', () => {
      const bytes = formatFileSize(1024, 'en');
      expect(bytes).toContain('1');
      expect(bytes).toContain('KB');
      
      const megabytes = formatFileSize(1024 * 1024 * 5, 'en');
      expect(megabytes).toContain('5');
      expect(megabytes).toContain('MB');
      
      // Test binary format
      const binary = formatFileSize(1024, 'en', { binary: true });
      expect(binary).toContain('1');
      expect(binary).toContain('KiB');
    });
    
    it('should get currency symbols', () => {
      const usd = getCurrencySymbol('en', 'USD');
      expect(usd).toBe('$');
      
      const eur = getCurrencySymbol('de', 'EUR');
      expect(eur).toBe('€');
    });
  });
  
  describe('dateLocales', () => {
    it('should provide correct locale for English', () => {
      const locale = dateLocales.en;
      expect(locale).toBeDefined();
      expect(locale.code).toBe('en-US');
    });
    
    it('should provide correct locale for French', () => {
      const locale = dateLocales.fr;
      expect(locale).toBeDefined();
      expect(locale.code).toBe('fr');
    });
    
    it('should provide multiple locales for different regions', () => {
      // Check various locales are available
      expect(Object.keys(dateLocales).length).toBeGreaterThanOrEqual(5);
      expect(dateLocales).toHaveProperty('en');
      expect(dateLocales).toHaveProperty('fr');
      expect(dateLocales).toHaveProperty('de');
    });
  });
  
  describe('getDateLocale', () => {
    it('should return the correct locale for a given code', () => {
      const enLocale = getDateLocale('en');
      expect(enLocale).toBe(dateLocales.en);
      
      const frLocale = getDateLocale('fr');
      expect(frLocale).toBe(dateLocales.fr);
    });
    
    it('should handle locale codes with regions', () => {
      const locale = getDateLocale('en-US');
      expect(locale).toBe(dateLocales.en);
      
      const frLocale = getDateLocale('fr-FR');
      expect(frLocale).toBe(dateLocales.fr);
    });
    
    it('should fallback to English for unsupported locales', () => {
      const locale = getDateLocale('xx');
      expect(locale).toBe(dateLocales.en);
    });
  });
}); 