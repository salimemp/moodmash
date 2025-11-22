import { Page, expect } from '@playwright/test';

/**
 * Test Helper Functions
 * Common utilities for E2E testing
 */

/**
 * Wait for i18n to load and page to be ready
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => {
    return window.hasOwnProperty('i18n') && 
           window.i18n?.currentLanguage !== undefined;
  }, { timeout: 10000 });
}

/**
 * Clear browser cache and storage
 */
export async function clearBrowserCache(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // Unregister service workers
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  });
  
  // Clear cache storage
  await page.evaluate(async () => {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      await caches.delete(name);
    }
  });
}

/**
 * Change application language
 */
export async function changeLanguage(page: Page, langCode: string) {
  await page.click('#language-selector');
  await page.click(`button[data-lang="${langCode}"]`);
  await page.waitForTimeout(500); // Wait for language change
}

/**
 * Skip onboarding if it appears
 */
export async function skipOnboarding(page: Page) {
  const skipButton = page.locator('button:has-text("Skip"), button:has-text("Get Started")').first();
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Check if element contains translated text (not raw key)
 */
export async function expectTranslated(page: Page, selector: string) {
  const text = await page.locator(selector).textContent();
  expect(text).not.toMatch(/^[a-z_]+$/); // Should not be raw translation key
  expect(text).toBeTruthy();
  expect(text!.length).toBeGreaterThan(0);
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(page: Page, endpoint: string) {
  return page.waitForResponse(response => 
    response.url().includes(endpoint) && response.status() === 200
  );
}

/**
 * Take a screenshot with name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `test-results/screenshots/${name}.png`,
    fullPage: true 
  });
}

/**
 * Mock API endpoint
 */
export async function mockApiEndpoint(page: Page, endpoint: string, response: any) {
  await page.route(`**${endpoint}**`, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
}

/**
 * Check for console errors
 */
export function listenForConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  return errors;
}
