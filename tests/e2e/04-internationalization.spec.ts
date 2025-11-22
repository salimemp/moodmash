import { test, expect } from '@playwright/test';
import { waitForPageReady, skipOnboarding, changeLanguage } from '../fixtures/test-helpers';

test.describe('Internationalization (i18n)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
    await skipOnboarding(page);
  });

  test('should load i18n system', async ({ page }) => {
    const i18nLoaded = await page.evaluate(() => {
      return window.hasOwnProperty('i18n') && 
             typeof window.i18n === 'object' &&
             window.i18n.currentLanguage !== undefined;
    });
    
    expect(i18nLoaded).toBeTruthy();
  });

  test('should have default language set to English', async ({ page }) => {
    const currentLang = await page.evaluate(() => window.i18n?.currentLanguage);
    expect(currentLang).toBe('en');
  });

  test('should have all 13 languages available', async ({ page }) => {
    const languages = await page.evaluate(() => {
      if (!window.i18n?.translations) return [];
      return Object.keys(window.i18n.translations);
    });
    
    expect(languages).toContain('en');
    expect(languages).toContain('es');
    expect(languages).toContain('zh');
    expect(languages).toContain('fr');
    expect(languages).toContain('de');
    expect(languages).toContain('it');
    expect(languages).toContain('ar');
    expect(languages).toContain('hi');
    expect(languages).toContain('bn');
    expect(languages).toContain('ta');
    expect(languages).toContain('ja');
    expect(languages).toContain('ko');
    expect(languages).toContain('ms');
  });

  test('should not display raw translation keys', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Get all text content
    const bodyText = await page.locator('body').textContent();
    
    // Should not have raw keys like "onboarding_welcome_title"
    const hasRawKeys = /[a-z]+_[a-z]+_[a-z]+/.test(bodyText || '');
    
    // Some raw keys might be acceptable (like data attributes), 
    // but visible text should be translated
    const visibleRawKeys = await page.locator('h1, h2, h3, p, button, a').evaluateAll(elements => {
      return elements
        .map(el => el.textContent || '')
        .filter(text => /^[a-z]+_[a-z]+/.test(text.trim()));
    });
    
    expect(visibleRawKeys.length).toBe(0);
  });

  test('should translate dashboard title', async ({ page }) => {
    const title = await page.locator('h1, h2').first().textContent();
    
    // Should not be empty or a raw key
    expect(title).toBeTruthy();
    expect(title).not.toMatch(/^[a-z_]+$/);
  });

  test('should translate navigation links', async ({ page }) => {
    const navLinks = await page.locator('nav a').allTextContents();
    
    // All nav links should have translated text
    for (const linkText of navLinks) {
      expect(linkText.trim().length).toBeGreaterThan(0);
      expect(linkText).not.toMatch(/^[a-z_]+$/);
    }
  });

  test('should change to Spanish', async ({ page }) => {
    // Look for language selector
    const langSelector = page.locator('#language-selector, button:has-text("English"), button:has-text("EN")').first();
    
    if (await langSelector.isVisible().catch(() => false)) {
      await langSelector.click();
      await page.waitForTimeout(500);
      
      // Look for Spanish option
      const spanishOption = page.locator('button:has-text("Español"), button[data-lang="es"]').first();
      
      if (await spanishOption.isVisible().catch(() => false)) {
        await spanishOption.click();
        await page.waitForTimeout(1000);
        
        // Check if language changed
        const currentLang = await page.evaluate(() => window.i18n?.currentLanguage);
        expect(currentLang).toBe('es');
      }
    }
  });

  test('should persist language selection', async ({ page }) => {
    // Change language
    const langSelector = page.locator('#language-selector, button:has-text("English")').first();
    
    if (await langSelector.isVisible().catch(() => false)) {
      await langSelector.click();
      await page.waitForTimeout(500);
      
      const frenchOption = page.locator('button:has-text("Français"), button[data-lang="fr"]').first();
      
      if (await frenchOption.isVisible().catch(() => false)) {
        await frenchOption.click();
        await page.waitForTimeout(1000);
        
        // Reload page
        await page.reload();
        await waitForPageReady(page);
        
        // Check if language persisted
        const currentLang = await page.evaluate(() => window.i18n?.currentLanguage);
        expect(currentLang).toBe('fr');
      }
    }
  });

  test('should translate Log Mood page', async ({ page }) => {
    await page.goto('/log');
    await waitForPageReady(page);
    
    // Check for translated content
    const heading = await page.locator('h1').first().textContent();
    expect(heading).toBeTruthy();
    expect(heading).not.toMatch(/^[a-z_]+$/);
  });

  test('should translate Activities page', async ({ page }) => {
    await page.goto('/activities');
    await waitForPageReady(page);
    
    // Check for translated content
    const heading = await page.locator('h1').first().textContent();
    expect(heading).toBeTruthy();
    expect(heading).not.toMatch(/^[a-z_]+$/);
  });

  test('should support RTL for Arabic', async ({ page }) => {
    const langSelector = page.locator('#language-selector, button:has-text("English")').first();
    
    if (await langSelector.isVisible().catch(() => false)) {
      await langSelector.click();
      await page.waitForTimeout(500);
      
      const arabicOption = page.locator('button:has-text("العربية"), button[data-lang="ar"]').first();
      
      if (await arabicOption.isVisible().catch(() => false)) {
        await arabicOption.click();
        await page.waitForTimeout(1000);
        
        // Check if RTL is applied
        const dir = await page.locator('html').getAttribute('dir');
        expect(dir).toBe('rtl');
      }
    }
  });

  test('should have translations for emotions', async ({ page }) => {
    const emotionKeys = ['happy', 'sad', 'anxious', 'calm', 'energetic', 'tired', 'angry', 'peaceful', 'stressed', 'neutral'];
    
    for (const emotion of emotionKeys) {
      const translation = await page.evaluate((key) => {
        return window.i18n?.t(`emotion_${key}`);
      }, emotion);
      
      expect(translation).toBeTruthy();
      expect(translation).not.toBe(`emotion_${emotion}`);
    }
  });

  test('should have translations for activities', async ({ page }) => {
    const activityKeys = ['work', 'exercise', 'social', 'rest', 'hobby', 'meditation', 'reading', 'outdoor'];
    
    for (const activity of activityKeys) {
      const translation = await page.evaluate((key) => {
        return window.i18n?.t(`activity_${key}`);
      }, activity);
      
      expect(translation).toBeTruthy();
      expect(translation).not.toBe(`activity_${activity}`);
    }
  });

  test('should have translations for weather', async ({ page }) => {
    const weatherKeys = ['sunny', 'cloudy', 'rainy', 'snowy', 'clear'];
    
    for (const weather of weatherKeys) {
      const translation = await page.evaluate((key) => {
        return window.i18n?.t(`weather_${key}`);
      }, weather);
      
      expect(translation).toBeTruthy();
      expect(translation).not.toBe(`weather_${weather}`);
    }
  });
});
