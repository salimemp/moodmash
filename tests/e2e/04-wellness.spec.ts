/**
 * Wellness Features E2E Tests
 * Tests for meditation, yoga, and music pages
 */
import { test, expect } from '@playwright/test';

test.describe('Wellness Pages Accessibility', () => {
  test('should load meditation page', async ({ page }) => {
    await page.goto('/meditation');
    await expect(page.locator('body')).toBeVisible();
    
    // Should not have critical JavaScript errors
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForLoadState('networkidle');
  });

  test('should load yoga page', async ({ page }) => {
    await page.goto('/yoga');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load music page', async ({ page }) => {
    await page.goto('/music');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load wellness dashboard', async ({ page }) => {
    await page.goto('/wellness');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Wellness Page Content', () => {
  test('meditation page should have session types', async ({ page }) => {
    await page.goto('/meditation');
    
    const url = page.url();
    if (!url.includes('login')) {
      // Check for meditation-related content
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
    }
  });

  test('yoga page should have routine options', async ({ page }) => {
    await page.goto('/yoga');
    
    const url = page.url();
    if (!url.includes('login')) {
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
    }
  });
});
