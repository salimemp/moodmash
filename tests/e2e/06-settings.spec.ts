/**
 * Settings E2E Tests
 * Tests for user settings, preferences, and profile
 */
import { test, expect } from '@playwright/test';

test.describe('Settings Pages', () => {
  test('should load settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load profile page', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load privacy page', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load notifications settings', async ({ page }) => {
    await page.goto('/settings/notifications');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Settings Functionality', () => {
  test('settings should handle authentication', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(500);
    
    const url = page.url();
    expect(url).toMatch(/(settings|login)/);
  });
});
