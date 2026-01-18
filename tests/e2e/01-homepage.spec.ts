/**
 * Homepage E2E Tests
 * Tests for landing page, navigation, and basic UI elements
 */
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/MoodMash/i);
  });

  test('should display main navigation', async ({ page }) => {
    const nav = page.locator('nav, header, [role="navigation"]').first();
    await expect(nav).toBeVisible();
  });

  test('should have login button or link', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /login|sign in/i }).first();
    await expect(loginLink).toBeVisible();
  });

  test('should have register button or link', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /register|sign up|get started/i }).first();
    await expect(registerLink).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check for mobile menu or navigation
    const mobileNav = page.locator('[data-mobile-nav], .mobile-nav, button[aria-label*="menu"]');
    if (await mobileNav.count() > 0) {
      await expect(mobileNav.first()).toBeVisible();
    }
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(50);
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out minor errors
    const criticalErrors = errors.filter(e => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Navigation', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    const loginLink = page.getByRole('link', { name: /login|sign in/i }).first();
    await loginLink.click();
    await expect(page).toHaveURL(/login/);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');
    const registerLink = page.getByRole('link', { name: /register|sign up|get started/i }).first();
    await registerLink.click();
    await expect(page).toHaveURL(/register/);
  });
});
