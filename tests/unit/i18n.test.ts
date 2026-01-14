/**
 * Unit Tests for i18n Module
 * Tests translation system, language switching, and formatting
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { translations, type Language } from '../../src/lib/i18n';

describe('i18n Translations', () => {
  describe('Translation Structure', () => {
    it('should have core languages', () => {
      // Core languages that are always available
      const coreLanguages = ['en', 'es', 'fr'];
      coreLanguages.forEach(lang => {
        expect(translations[lang]).toBeDefined();
      });
    });

    it('should have app metadata in all languages', () => {
      Object.keys(translations).forEach(lang => {
        const t = translations[lang];
        expect(t.app).toBeDefined();
        expect((t.app as Record<string, unknown>).name).toBeDefined();
      });
    });

    it('should have common translations in all languages', () => {
      Object.keys(translations).forEach(lang => {
        const t = translations[lang];
        expect(t.common).toBeDefined();
      });
    });

    it('should have mood translations in all languages', () => {
      Object.keys(translations).forEach(lang => {
        const t = translations[lang];
        expect(t.mood).toBeDefined();
      });
    });
  });

  describe('English Translations', () => {
    const en = translations.en;

    it('should have complete app section', () => {
      const app = en.app as Record<string, string>;
      expect(app.name).toBe('MoodMash');
      expect(app.tagline).toBeDefined();
      expect(app.description).toBeDefined();
    });

    it('should have complete common section', () => {
      const common = en.common as Record<string, string>;
      expect(common.loading).toBe('Loading...');
      expect(common.save).toBe('Save');
      expect(common.cancel).toBe('Cancel');
      expect(common.delete).toBe('Delete');
    });

    it('should have complete mood section', () => {
      const mood = en.mood as Record<string, string>;
      expect(mood.log).toBeDefined();
      expect(mood.happy).toBe('Happy');
      expect(mood.sad).toBe('Sad');
      expect(mood.angry).toBe('Angry');
    });

    it('should have reminders section', () => {
      expect(en.reminders).toBeDefined();
    });
  });

  describe('Spanish Translations', () => {
    const es = translations.es;

    it('should have Spanish app translations', () => {
      const app = es.app as Record<string, string>;
      expect(app.name).toBeDefined();
    });

    it('should have Spanish common translations', () => {
      const common = es.common as Record<string, string>;
      expect(common).toBeDefined();
    });
  });

  describe('Available Languages', () => {
    it('should have at least 3 languages', () => {
      const availableLanguages = Object.keys(translations);
      expect(availableLanguages.length).toBeGreaterThanOrEqual(3);
    });

    it('should include English as base language', () => {
      expect(translations.en).toBeDefined();
    });

    it('should include Spanish', () => {
      expect(translations.es).toBeDefined();
    });

    it('should include French', () => {
      expect(translations.fr).toBeDefined();
    });
  });

  describe('Translation Key Consistency', () => {
    const enKeys = Object.keys(translations.en);

    it('should have same top-level keys across all languages', () => {
      Object.keys(translations).forEach(lang => {
        if (lang === 'en') return;
        const langKeys = Object.keys(translations[lang]);
        enKeys.forEach(key => {
          expect(langKeys).toContain(key);
        });
      });
    });
  });
});

describe('Translation Utilities', () => {
  it('should be able to access nested translations', () => {
    const mood = translations.en.mood as Record<string, string>;
    expect(mood.happy).toBe('Happy');
  });

  it('should handle missing keys gracefully', () => {
    const nonExistent = (translations.en as Record<string, unknown>).nonExistent;
    expect(nonExistent).toBeUndefined();
  });
});
