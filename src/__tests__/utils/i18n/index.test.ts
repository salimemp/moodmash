import {
    DEFAULT_NAMESPACES,
    SUPPORTED_LANGUAGES,
    getEnabledLanguages,
    getLanguageByCode,
    getTextDirection,
    i18nConfig,
} from '@/utils/i18n/index';
import { describe, expect, it } from 'vitest';

describe('i18n Configuration', () => {
  describe('SUPPORTED_LANGUAGES', () => {
    it('should contain the expected language entries', () => {
      expect(SUPPORTED_LANGUAGES).toBeInstanceOf(Array);
      expect(SUPPORTED_LANGUAGES.length).toBeGreaterThan(0);
      
      // Check that English is included and enabled
      const english = SUPPORTED_LANGUAGES.find(lang => lang.code === 'en');
      expect(english).toBeDefined();
      expect(english?.name).toBe('English');
      expect(english?.enabled).toBe(true);
      
      // Verify structure of each language entry
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('dir');
        expect(['ltr', 'rtl']).toContain(lang.dir);
      });
    });
  });
  
  describe('getEnabledLanguages', () => {
    it('should return only enabled languages', () => {
      const enabledLangs = getEnabledLanguages();
      expect(enabledLangs).toBeInstanceOf(Array);
      expect(enabledLangs.length).toBeGreaterThan(0);
      expect(enabledLangs.length).toBeLessThanOrEqual(SUPPORTED_LANGUAGES.length);
      
      // All returned languages should be enabled
      enabledLangs.forEach(lang => {
        expect(lang.enabled !== false).toBe(true);
      });
      
      // No disabled languages should be included
      const disabledLangs = SUPPORTED_LANGUAGES.filter(lang => lang.enabled === false);
      disabledLangs.forEach(disabledLang => {
        expect(enabledLangs).not.toContainEqual(disabledLang);
      });
    });
  });
  
  describe('getLanguageByCode', () => {
    it('should return the correct language for a valid code', () => {
      const french = getLanguageByCode('fr');
      expect(french).toBeDefined();
      expect(french?.code).toBe('fr');
      expect(french?.name).toBe('Français');
      
      const english = getLanguageByCode('en');
      expect(english).toBeDefined();
      expect(english?.code).toBe('en');
      expect(english?.name).toBe('English');
    });
    
    it('should return null for an invalid language code', () => {
      const invalid = getLanguageByCode('invalid');
      expect(invalid).toBeNull();
    });
  });
  
  describe('getTextDirection', () => {
    it('should return ltr for LTR languages', () => {
      expect(getTextDirection('en')).toBe('ltr');
      expect(getTextDirection('fr')).toBe('ltr');
      expect(getTextDirection('de')).toBe('ltr');
    });
    
    it('should return rtl for RTL languages', () => {
      expect(getTextDirection('ar')).toBe('rtl');
      expect(getTextDirection('he')).toBe('rtl');
    });
    
    it('should default to ltr for unknown languages', () => {
      expect(getTextDirection('unknown')).toBe('ltr');
    });
  });
  
  describe('DEFAULT_NAMESPACES', () => {
    it('should contain at least common namespace', () => {
      expect(DEFAULT_NAMESPACES).toBeInstanceOf(Array);
      expect(DEFAULT_NAMESPACES).toContain('common');
    });
  });
  
  describe('i18nConfig', () => {
    it('should have the expected structure', () => {
      expect(i18nConfig).toHaveProperty('i18n');
      expect(i18nConfig.i18n).toHaveProperty('defaultLocale');
      expect(i18nConfig.i18n).toHaveProperty('locales');
      expect(i18nConfig.i18n.defaultLocale).toBe('en');
      expect(i18nConfig.i18n.locales).toBeInstanceOf(Array);
      expect(i18nConfig.i18n.locales.length).toBe(SUPPORTED_LANGUAGES.length);
    });
    
    it('should have appropriate React configuration', () => {
      expect(i18nConfig).toHaveProperty('react');
      // React Suspense should be disabled to avoid SSR issues
      expect(i18nConfig.react?.useSuspense).toBe(false);
    });
    
    it('should have language detection options', () => {
      expect(i18nConfig).toHaveProperty('detection');
      
      // Type assertion for the detection object
      const detection = i18nConfig.detection as { 
        order?: string[],
        caches?: string[] 
      };
      
      // Now test with the properly typed detection object
      expect(detection.order).toBeInstanceOf(Array);
      expect(detection.caches).toBeInstanceOf(Array);
    });
  });
}); 