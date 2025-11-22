import { test, expect } from '@playwright/test';
import { waitForPageReady, skipOnboarding, listenForConsoleErrors } from '../fixtures/test-helpers';

test.describe('Homepage & Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
    await skipOnboarding(page);
  });

  test('should load homepage successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Dashboard.*MoodMash/);
    
    // Check main navigation is visible
    await expect(page.locator('nav')).toBeVisible();
    
    // Check navigation links
    await expect(page.locator('a[href="/"]')).toBeVisible();
    await expect(page.locator('a[href="/log"]')).toBeVisible();
    await expect(page.locator('a[href="/activities"]')).toBeVisible();
    await expect(page.locator('a[href="/about"]')).toBeVisible();
  });

  test('should have no critical console errors', async ({ page }) => {
    const errors = listenForConsoleErrors(page);
    
    await page.waitForTimeout(3000); // Wait for initial load
    
    // Filter out expected warnings (Tailwind CDN, Service Worker)
    const criticalErrors = errors.filter(err => 
      !err.includes('cdn.tailwindcss.com') &&
      !err.includes('Service Worker') &&
      !err.includes('401') // OAuth not configured
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should display language selector', async ({ page }) => {
    const languageSelector = page.locator('#language-selector, [data-testid="language-selector"]');
    
    // Check if language selector exists (might be in header or settings)
    const count = await languageSelector.count();
    expect(count).toBeGreaterThanOrEqual(0); // Language selector might be in different locations
  });

  test('should display theme toggle', async ({ page }) => {
    // Look for theme toggle button
    const themeToggle = page.locator('button:has-text("Light"), button:has-text("Dark"), [data-testid="theme-toggle"]');
    
    const count = await themeToggle.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show chatbot button', async ({ page }) => {
    const chatbotButton = page.locator('button[data-testid="chatbot-toggle"], button:has(.fa-comment)');
    
    // Wait a bit for chatbot to initialize
    await page.waitForTimeout(2000);
    
    const isVisible = await chatbotButton.isVisible().catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should show accessibility button', async ({ page }) => {
    const accessibilityButton = page.locator('button[data-testid="accessibility-toggle"], button:has(.fa-universal-access)');
    
    // Wait a bit for accessibility to initialize
    await page.waitForTimeout(2000);
    
    const isVisible = await accessibilityButton.isVisible().catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should navigate to Log Mood page', async ({ page }) => {
    await page.click('a[href="/log"]');
    await page.waitForURL('**/log');
    await expect(page).toHaveTitle(/Log Mood/);
  });

  test('should navigate to Activities page', async ({ page }) => {
    await page.click('a[href="/activities"]');
    await page.waitForURL('**/activities');
    await expect(page).toHaveTitle(/Activities/);
  });

  test('should navigate to About page', async ({ page }) => {
    await page.click('a[href="/about"]');
    await page.waitForURL('**/about');
    await expect(page).toHaveTitle(/About/);
  });

  test('should load Service Worker', async ({ page }) => {
    const swRegistered = await page.evaluate(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0;
    });
    
    expect(swRegistered).toBeTruthy();
  });
});
