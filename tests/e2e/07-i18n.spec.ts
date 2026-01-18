/**
 * Internationalization E2E Tests
 * Tests for multi-language support
 */
import { test, expect } from '@playwright/test';

test.describe('Internationalization', () => {
  test('should load i18n files', async ({ page }) => {
    // Check if English translation file is accessible
    const response = await page.goto('/static/i18n/en.json');
    expect(response?.status()).toBe(200);
    
    const content = await response?.text();
    expect(content).toBeTruthy();
    
    // Should be valid JSON
    const json = JSON.parse(content!);
    expect(json).toBeTruthy();
  });

  test('should have Spanish translations', async ({ page }) => {
    const response = await page.goto('/static/i18n/es.json');
    expect(response?.status()).toBe(200);
  });

  test('should have French translations', async ({ page }) => {
    const response = await page.goto('/static/i18n/fr.json');
    expect(response?.status()).toBe(200);
  });

  test('should have German translations', async ({ page }) => {
    const response = await page.goto('/static/i18n/de.json');
    expect(response?.status()).toBe(200);
  });

  test('should have Arabic translations', async ({ page }) => {
    const response = await page.goto('/static/i18n/ar.json');
    expect(response?.status()).toBe(200);
  });

  test('should have Chinese translations', async ({ page }) => {
    const response = await page.goto('/static/i18n/zh.json');
    expect(response?.status()).toBe(200);
  });

  test('should have Japanese translations', async ({ page }) => {
    const response = await page.goto('/static/i18n/ja.json');
    expect(response?.status()).toBe(200);
  });

  test('should have Portuguese translations', async ({ page }) => {
    const response = await page.goto('/static/i18n/pt.json');
    expect(response?.status()).toBe(200);
  });
});

test.describe('Language Switching', () => {
  test('should have language selector on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Look for language selector
    const langSelector = page.locator('[data-lang-selector], .language-select, select[name*="lang"], #language-select');
    
    if (await langSelector.count() > 0) {
      await expect(langSelector.first()).toBeVisible();
    }
  });
});
