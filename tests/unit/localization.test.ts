/**
 * Unit Tests for Localization Module
 * Tests currency formatting, tax calculations, and regional settings
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  LocalizationManager,
  formatCurrency,
  formatDate,
  formatTime,
  formatNumber,
  calculateTax,
  getPriceWithTax,
  currencies,
  taxConfigs,
  regions,
  type CurrencyCode,
  type CountryCode,
} from '../../src/lib/localization';

describe('LocalizationManager', () => {
  let manager: LocalizationManager;

  beforeEach(() => {
    manager = new LocalizationManager('US');
  });

  describe('Currency Formatting', () => {
    it('should format USD correctly', () => {
      manager.setRegion('US');
      expect(manager.formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format EUR correctly with symbol after', () => {
      manager.setRegion('DE');
      expect(manager.formatCurrency(1234.56)).toBe('1.234,56 €');
    });

    it('should format GBP correctly', () => {
      manager.setRegion('GB');
      expect(manager.formatCurrency(1234.56)).toBe('£1,234.56');
    });

    it('should format JPY with no decimals', () => {
      manager.setRegion('JP');
      expect(manager.formatCurrency(1234)).toBe('¥1,234');
    });

    it('should format INR correctly', () => {
      manager.setRegion('IN');
      expect(manager.formatCurrency(1234.56)).toBe('₹1,234.56');
    });

    it('should format BRL with space and comma decimal', () => {
      manager.setRegion('BR');
      expect(manager.formatCurrency(1234.56)).toBe('R$ 1.234,56');
    });

    it('should format RUB with symbol after', () => {
      manager.setRegion('RU');
      expect(manager.formatCurrency(1234.56)).toBe('1 234,56 ₽');
    });

    it('should handle zero amounts', () => {
      manager.setRegion('US');
      expect(manager.formatCurrency(0)).toBe('$0.00');
    });

    it('should handle negative amounts', () => {
      manager.setRegion('US');
      expect(manager.formatCurrency(-1234.56)).toBe('$-1,234.56');
    });

    it('should handle large amounts', () => {
      manager.setRegion('US');
      expect(manager.formatCurrency(1234567890.12)).toBe('$1,234,567,890.12');
    });

    it('should allow explicit currency override', () => {
      manager.setRegion('US');
      expect(manager.formatCurrency(100, 'EUR')).toBe('100,00 €');
    });
  });

  describe('Tax Calculations', () => {
    it('should calculate US tax at 0% federal', () => {
      manager.setRegion('US');
      expect(manager.calculateTax(100)).toBe(0);
    });

    it('should calculate UK VAT at 20%', () => {
      manager.setRegion('GB');
      expect(manager.calculateTax(100)).toBe(20);
    });

    it('should calculate German MwSt at 19%', () => {
      manager.setRegion('DE');
      expect(manager.calculateTax(100)).toBe(19);
    });

    it('should calculate Indian GST at 18%', () => {
      manager.setRegion('IN');
      expect(manager.calculateTax(100)).toBe(18);
    });

    it('should calculate digital services tax rate', () => {
      manager.setRegion('CN');
      expect(manager.calculateTax(100, 'digital')).toBe(6);
    });

    it('should calculate subscription tax rate', () => {
      manager.setRegion('CN');
      expect(manager.calculateTax(100, 'subscription')).toBe(6);
    });

    it('should return complete tax breakdown', () => {
      manager.setRegion('GB');
      const result = manager.getPriceWithTax(100);
      
      expect(result.basePrice).toBe(100);
      expect(result.taxAmount).toBe(20);
      expect(result.totalPrice).toBe(100); // Tax included
      expect(result.taxRate).toBe(20);
      expect(result.taxName).toBe('VAT');
      expect(result.taxIncluded).toBe(true);
    });

    it('should calculate tax-exclusive pricing', () => {
      manager.setRegion('US');
      const result = manager.getPriceWithTax(100);
      
      expect(result.totalPrice).toBe(100); // US has 0% federal
      expect(result.taxIncluded).toBe(false);
    });

    it('should calculate Indian GST (not included)', () => {
      manager.setRegion('IN');
      const result = manager.getPriceWithTax(100);
      
      expect(result.totalPrice).toBe(118); // 100 + 18% GST
      expect(result.taxIncluded).toBe(false);
    });
  });

  describe('Date Formatting', () => {
    const testDate = new Date('2025-12-25T14:30:00');

    it('should format US date as MM/DD/YYYY', () => {
      manager.setRegion('US');
      expect(manager.formatDate(testDate)).toBe('12/25/2025');
    });

    it('should format UK date as DD/MM/YYYY', () => {
      manager.setRegion('GB');
      expect(manager.formatDate(testDate)).toBe('25/12/2025');
    });

    it('should format German date as DD.MM.YYYY', () => {
      manager.setRegion('DE');
      expect(manager.formatDate(testDate)).toBe('25.12.2025');
    });

    it('should format Japanese date as YYYY/MM/DD', () => {
      manager.setRegion('JP');
      expect(manager.formatDate(testDate)).toBe('2025/12/25');
    });

    it('should format Chinese date as YYYY-MM-DD', () => {
      manager.setRegion('CN');
      expect(manager.formatDate(testDate)).toBe('2025-12-25');
    });

    it('should accept string dates', () => {
      manager.setRegion('US');
      expect(manager.formatDate('2025-12-25')).toBe('12/25/2025');
    });
  });

  describe('Time Formatting', () => {
    const testDate = new Date('2025-12-25T14:30:00');

    it('should format US time as 12h', () => {
      manager.setRegion('US');
      expect(manager.formatTime(testDate)).toBe('2:30 PM');
    });

    it('should format UK time as 24h', () => {
      manager.setRegion('GB');
      expect(manager.formatTime(testDate)).toBe('14:30');
    });

    it('should handle midnight correctly', () => {
      manager.setRegion('US');
      const midnight = new Date('2025-12-25T00:00:00');
      expect(manager.formatTime(midnight)).toBe('12:00 AM');
    });

    it('should handle noon correctly', () => {
      manager.setRegion('US');
      const noon = new Date('2025-12-25T12:00:00');
      expect(manager.formatTime(noon)).toBe('12:00 PM');
    });
  });

  describe('Number Formatting', () => {
    it('should format with US separators', () => {
      manager.setRegion('US');
      expect(manager.formatNumber(1234567.89)).toBe('1,234,567.89');
    });

    it('should format with German separators', () => {
      manager.setRegion('DE');
      expect(manager.formatNumber(1234567.89)).toBe('1.234.567,89');
    });

    it('should respect decimal places', () => {
      manager.setRegion('US');
      expect(manager.formatNumber(123.456789, 4)).toBe('123.4568');
    });

    it('should handle integers', () => {
      manager.setRegion('US');
      expect(manager.formatNumber(1234, 0)).toBe('1,234');
    });
  });

  describe('Region Detection', () => {
    it('should detect from CF-IPCountry header', () => {
      expect(LocalizationManager.detectRegion({
        'cf-ipcountry': 'GB'
      })).toBe('GB');
    });

    it('should detect from Accept-Language header', () => {
      expect(LocalizationManager.detectRegion({
        'accept-language': 'de-DE,de;q=0.9'
      })).toBe('DE');
    });

    it('should default to US when unknown', () => {
      expect(LocalizationManager.detectRegion({
        'cf-ipcountry': 'XX'
      })).toBe('US');
    });

    it('should handle missing headers', () => {
      expect(LocalizationManager.detectRegion()).toBe('US');
    });
  });

  describe('Static Methods', () => {
    it('should return all supported regions', () => {
      const supported = LocalizationManager.getSupportedRegions();
      expect(supported).toContain('US');
      expect(supported).toContain('GB');
      expect(supported).toContain('DE');
      expect(supported.length).toBeGreaterThan(10);
    });

    it('should return all supported currencies', () => {
      const supported = LocalizationManager.getSupportedCurrencies();
      expect(supported).toContain('USD');
      expect(supported).toContain('EUR');
      expect(supported).toContain('GBP');
    });
  });
});

describe('Utility Functions', () => {
  it('formatCurrency should work as standalone', () => {
    expect(formatCurrency(100)).toMatch(/\$|€|£/);
  });

  it('formatDate should work as standalone', () => {
    expect(formatDate(new Date())).toMatch(/\d{2,4}/);
  });

  it('formatTime should work as standalone', () => {
    expect(formatTime(new Date())).toMatch(/\d{1,2}:\d{2}/);
  });

  it('formatNumber should work as standalone', () => {
    expect(formatNumber(1234.56)).toMatch(/1[,.]234/);
  });

  it('calculateTax should work as standalone', () => {
    expect(typeof calculateTax(100)).toBe('number');
  });

  it('getPriceWithTax should return complete object', () => {
    const result = getPriceWithTax(100);
    expect(result).toHaveProperty('basePrice');
    expect(result).toHaveProperty('taxAmount');
    expect(result).toHaveProperty('totalPrice');
  });
});

describe('Currency Configurations', () => {
  it('should have valid configurations for all currencies', () => {
    Object.values(currencies).forEach(currency => {
      expect(currency.code).toBeDefined();
      expect(currency.symbol).toBeDefined();
      expect(currency.name).toBeDefined();
      expect(typeof currency.decimalPlaces).toBe('number');
      expect(['before', 'after']).toContain(currency.symbolPosition);
    });
  });
});

describe('Tax Configurations', () => {
  it('should have valid configurations for all countries', () => {
    Object.values(taxConfigs).forEach(tax => {
      expect(typeof tax.rate).toBe('number');
      expect(tax.name).toBeDefined();
      expect(typeof tax.included).toBe('boolean');
    });
  });

  it('should have reasonable tax rates', () => {
    Object.values(taxConfigs).forEach(tax => {
      expect(tax.rate).toBeGreaterThanOrEqual(0);
      expect(tax.rate).toBeLessThanOrEqual(30);
    });
  });
});

describe('Regional Configurations', () => {
  it('should have complete configurations for all regions', () => {
    Object.values(regions).forEach(region => {
      expect(region.country).toBeDefined();
      expect(region.language).toBeDefined();
      expect(region.timezone).toBeDefined();
      expect(region.currency).toBeDefined();
      expect(region.tax).toBeDefined();
      expect(region.dateFormat).toBeDefined();
      expect(['12h', '24h']).toContain(region.timeFormat);
      expect([0, 1]).toContain(region.firstDayOfWeek);
      expect(['metric', 'imperial']).toContain(region.measurementSystem);
    });
  });
});
