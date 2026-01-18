/**
 * Localization Tests
 * Tests for multi-language support and currency formatting
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Localization', () => {
  describe('Supported Languages', () => {
    const SUPPORTED_LANGUAGES = [
      { code: 'en', name: 'English', rtl: false },
      { code: 'es', name: 'Español', rtl: false },
      { code: 'fr', name: 'Français', rtl: false },
      { code: 'de', name: 'Deutsch', rtl: false },
      { code: 'pt', name: 'Português', rtl: false },
      { code: 'zh', name: '中文', rtl: false },
      { code: 'ja', name: '日本語', rtl: false },
      { code: 'ar', name: 'العربية', rtl: true },
    ];

    const isLanguageSupported = (code: string): boolean => {
      return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
    };

    const getLanguageInfo = (code: string) => {
      return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || null;
    };

    it('should support 8 languages', () => {
      expect(SUPPORTED_LANGUAGES.length).toBe(8);
    });

    it('should validate supported language codes', () => {
      expect(isLanguageSupported('en')).toBe(true);
      expect(isLanguageSupported('ar')).toBe(true);
      expect(isLanguageSupported('xx')).toBe(false);
    });

    it('should identify RTL languages', () => {
      const arabic = getLanguageInfo('ar');
      const english = getLanguageInfo('en');
      
      expect(arabic?.rtl).toBe(true);
      expect(english?.rtl).toBe(false);
    });
  });

  describe('Currency Formatting', () => {
    const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'BRL', 'RUB', 'SAR', 'AED', 'CAD', 'AUD'];

    const formatCurrency = (amount: number, currency: string, locale: string = 'en-US'): string => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(amount);
    };

    it('should support 12 currencies', () => {
      expect(CURRENCIES.length).toBe(12);
    });

    it('should format USD correctly', () => {
      const formatted = formatCurrency(1000, 'USD', 'en-US');
      expect(formatted).toBe('$1,000.00');
    });

    it('should format JPY without decimals', () => {
      const formatted = formatCurrency(1000, 'JPY', 'ja-JP');
      expect(formatted).toContain('1,000');
      expect(formatted).not.toContain('1,000.00');
    });

    it('should format SAR correctly', () => {
      const formatted = formatCurrency(1000, 'SAR', 'ar-SA');
      // Arabic locale uses Arabic numerals or Western numerals
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted).toMatch(/\d|[٠-٩]/);
    });
  });

  describe('Translation Key Lookup', () => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        'welcome': 'Welcome to MoodMash',
        'login': 'Sign In',
        'logout': 'Sign Out',
        'mood.happy': 'Happy',
        'mood.sad': 'Sad',
      },
      es: {
        'welcome': 'Bienvenido a MoodMash',
        'login': 'Iniciar sesión',
        'logout': 'Cerrar sesión',
        'mood.happy': 'Feliz',
        'mood.sad': 'Triste',
      },
      ar: {
        'welcome': 'مرحباً بك في MoodMash',
        'login': 'تسجيل الدخول',
        'logout': 'تسجيل الخروج',
        'mood.happy': 'سعيد',
        'mood.sad': 'حزين',
      },
    };

    const translate = (key: string, lang: string = 'en'): string => {
      const langTranslations = translations[lang] || translations['en'];
      return langTranslations[key] || translations['en'][key] || key;
    };

    it('should translate keys correctly', () => {
      expect(translate('welcome', 'en')).toBe('Welcome to MoodMash');
      expect(translate('welcome', 'es')).toBe('Bienvenido a MoodMash');
      expect(translate('welcome', 'ar')).toBe('مرحباً بك في MoodMash');
    });

    it('should fallback to English for missing translations', () => {
      expect(translate('welcome', 'xx')).toBe('Welcome to MoodMash');
    });

    it('should return key for missing translation', () => {
      expect(translate('nonexistent.key', 'en')).toBe('nonexistent.key');
    });
  });

  describe('Date Localization', () => {
    const formatLocalizedDate = (date: Date, locale: string): string => {
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    it('should format date in English', () => {
      const date = new Date('2024-01-15');
      const formatted = formatLocalizedDate(date, 'en-US');
      expect(formatted).toContain('January');
      expect(formatted).toContain('2024');
    });

    it('should format date in Spanish', () => {
      const date = new Date('2024-01-15');
      const formatted = formatLocalizedDate(date, 'es-ES');
      expect(formatted.toLowerCase()).toContain('enero');
    });

    it('should format date in Arabic', () => {
      const date = new Date('2024-01-15');
      const formatted = formatLocalizedDate(date, 'ar-SA');
      // Arabic locale uses Arabic numerals (٢٠٢٤) or Western numerals
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted).toMatch(/\d|[٠-٩]/);
    });
  });

  describe('Number Localization', () => {
    const formatNumber = (num: number, locale: string): string => {
      return new Intl.NumberFormat(locale).format(num);
    };

    it('should format numbers with correct thousands separator', () => {
      expect(formatNumber(1000000, 'en-US')).toBe('1,000,000');
      expect(formatNumber(1000000, 'de-DE')).toBe('1.000.000');
    });

    it('should format decimals correctly', () => {
      expect(formatNumber(1234.56, 'en-US')).toBe('1,234.56');
      expect(formatNumber(1234.56, 'de-DE')).toBe('1.234,56');
    });
  });
});
