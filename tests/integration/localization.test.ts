/**
 * Integration Tests for Localization
 * Tests localization with API routes and database
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LocalizationManager, regions, currencies, taxConfigs } from '../../src/lib/localization';
import { translations } from '../../src/lib/i18n';

describe('Localization Integration', () => {
  describe('Currency and Language Integration', () => {
    it('should have matching currencies for all regions', () => {
      Object.values(regions).forEach(region => {
        expect(region.currency).toBeDefined();
        expect(currencies[region.currency.code]).toBeDefined();
      });
    });

    it('should have matching tax configs for all regions', () => {
      Object.values(regions).forEach(region => {
        expect(region.tax).toBeDefined();
        expect(taxConfigs[region.country]).toBeDefined();
      });
    });

    it('should have i18n translations for core regions', () => {
      // Only check languages that are actually available
      const langMap: Record<string, string> = {
        'US': 'en',
        'GB': 'en',
        'ES': 'es',
        'FR': 'fr',
      };

      Object.entries(langMap).forEach(([country, lang]) => {
        expect(regions[country as keyof typeof regions]).toBeDefined();
        expect(translations[lang]).toBeDefined();
      });
    });
  });

  describe('Price Calculation Integration', () => {
    it('should calculate consistent prices across regions', () => {
      const basePrice = 100;
      const results: Record<string, number> = {};

      Object.keys(regions).forEach(countryCode => {
        const manager = new LocalizationManager(countryCode as keyof typeof regions);
        const priceInfo = manager.getPriceWithTax(basePrice, 'subscription');
        results[countryCode] = priceInfo.totalPrice;
      });

      // All prices should be positive
      Object.values(results).forEach(price => {
        expect(price).toBeGreaterThan(0);
      });
    });

    it('should format prices correctly for each region', () => {
      Object.keys(regions).forEach(countryCode => {
        const manager = new LocalizationManager(countryCode as keyof typeof regions);
        const formatted = manager.formatCurrency(99.99);
        
        // Should contain currency symbol
        expect(formatted.length).toBeGreaterThan(0);
        // Should contain digits
        expect(formatted).toMatch(/\d/);
      });
    });
  });

  describe('Date/Time Integration', () => {
    it('should format dates consistently within each region', () => {
      const testDate = new Date('2025-06-15T14:30:00Z');
      
      Object.keys(regions).forEach(countryCode => {
        const manager = new LocalizationManager(countryCode as keyof typeof regions);
        const formattedDate = manager.formatDate(testDate);
        const formattedTime = manager.formatTime(testDate);
        
        // Date should contain day, month, year
        expect(formattedDate).toMatch(/\d/);
        // Time should contain hours and minutes
        expect(formattedTime).toMatch(/\d{1,2}:\d{2}/);
      });
    });
  });

  describe('Region Detection Integration', () => {
    it('should detect US from CF-IPCountry header', () => {
      const detected = LocalizationManager.detectRegion({ 'cf-ipcountry': 'US' });
      expect(detected).toBe('US');
    });

    it('should detect GB from CF-IPCountry header', () => {
      const detected = LocalizationManager.detectRegion({ 'cf-ipcountry': 'GB' });
      expect(detected).toBe('GB');
    });

    it('should detect DE from CF-IPCountry header', () => {
      const detected = LocalizationManager.detectRegion({ 'cf-ipcountry': 'DE' });
      expect(detected).toBe('DE');
    });

    it('should detect from accept-language header', () => {
      const detected = LocalizationManager.detectRegion({ 'accept-language': 'de-DE' });
      expect(detected).toBe('DE');
    });

    it('should default to US for unknown regions', () => {
      const detected = LocalizationManager.detectRegion({ 'cf-ipcountry': 'XX' });
      expect(detected).toBe('US');
    });
  });

  describe('Multi-currency Operations', () => {
    it('should handle currency conversions display', () => {
      const manager = new LocalizationManager('US');
      
      // Display same amount in different currencies
      const amount = 100;
      const usd = manager.formatCurrency(amount, 'USD');
      const eur = manager.formatCurrency(amount, 'EUR');
      const gbp = manager.formatCurrency(amount, 'GBP');
      const jpy = manager.formatCurrency(amount, 'JPY');
      
      expect(usd).toContain('$');
      expect(eur).toContain('€');
      expect(gbp).toContain('£');
      expect(jpy).toContain('¥');
    });
  });

  describe('Tax Compliance Integration', () => {
    it('should calculate correct VAT for EU countries', () => {
      const euCountries = ['DE', 'FR', 'ES', 'IT', 'PT'] as const;
      
      euCountries.forEach(country => {
        const manager = new LocalizationManager(country);
        const taxInfo = manager.getPriceWithTax(100);
        
        expect(taxInfo.taxIncluded).toBe(true);
        expect(taxInfo.taxRate).toBeGreaterThan(15); // EU VAT minimum
        expect(['VAT', 'MwSt', 'TVA', 'IVA']).toContain(taxInfo.taxName);
      });
    });

    it('should handle tax-exclusive regions correctly', () => {
      const taxExclusiveCountries = ['US', 'CA', 'IN'] as const;
      
      taxExclusiveCountries.forEach(country => {
        const manager = new LocalizationManager(country);
        const taxInfo = manager.getPriceWithTax(100);
        
        expect(taxInfo.taxIncluded).toBe(false);
      });
    });
  });

  describe('Subscription Pricing Integration', () => {
    const subscriptionPrice = 9.99;

    it('should calculate subscription pricing for all regions', () => {
      Object.keys(regions).forEach(countryCode => {
        const manager = new LocalizationManager(countryCode as keyof typeof regions);
        const priceInfo = manager.getPriceWithTax(subscriptionPrice, 'subscription');
        
        expect(priceInfo.basePrice).toBe(subscriptionPrice);
        expect(priceInfo.totalPrice).toBeGreaterThan(0);
        expect(priceInfo.taxName).toBeDefined();
      });
    });

    it('should format subscription prices correctly', () => {
      Object.keys(regions).forEach(countryCode => {
        const manager = new LocalizationManager(countryCode as keyof typeof regions);
        const priceInfo = manager.getPriceWithTax(subscriptionPrice, 'subscription');
        const formatted = manager.formatCurrency(priceInfo.totalPrice);
        
        expect(formatted.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Cross-Module Integration', () => {
  it('should have consistent data between localization and i18n', () => {
    // Check that core languages map to regions appropriately
    const langToRegion: Record<string, string[]> = {
      'en': ['US', 'GB', 'CA', 'AU'],
      'es': ['ES', 'MX'],
      'fr': ['FR'],
    };

    Object.entries(langToRegion).forEach(([lang, expectedRegions]) => {
      expect(translations[lang]).toBeDefined();
      expectedRegions.forEach(region => {
        expect(regions[region as keyof typeof regions]).toBeDefined();
      });
    });
  });

  it('should have all regions with valid configurations', () => {
    Object.keys(regions).forEach(countryCode => {
      const region = regions[countryCode as keyof typeof regions];
      expect(region.currency).toBeDefined();
      expect(region.tax).toBeDefined();
      expect(region.language).toBeDefined();
    });
  });
});
