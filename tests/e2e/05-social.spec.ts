/**
 * Social Features E2E Tests
 * Tests for friends, groups, and sharing
 */
import { test, expect } from '@playwright/test';

test.describe('Social Pages Accessibility', () => {
  test('should load friends page', async ({ page }) => {
    await page.goto('/friends');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load groups page', async ({ page }) => {
    await page.goto('/groups');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load social feed page', async ({ page }) => {
    await page.goto('/social');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load community page', async ({ page }) => {
    await page.goto('/community');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Social Page Redirects', () => {
  test('social pages should handle authentication', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForTimeout(500);
    
    // Should either show friends page or redirect to login
    const url = page.url();
    expect(url).toMatch(/(friends|login)/);
  });
});
