/**
 * PWA E2E Tests
 * Tests for Progressive Web App features
 */
import { test, expect } from '@playwright/test';

test.describe('PWA Manifest', () => {
  test('should have valid manifest.json', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    
    const manifest = await response?.json();
    expect(manifest).toBeTruthy();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.icons).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('should have required manifest fields', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    const manifest = await response?.json();
    
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBeDefined();
    expect(manifest.background_color).toBeDefined();
    expect(manifest.theme_color).toBeDefined();
  });

  test('should have proper icon sizes', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    const manifest = await response?.json();
    
    const iconSizes = manifest.icons.map((icon: any) => icon.sizes);
    
    // Should have at least 192x192 and 512x512 icons
    expect(iconSizes.some((s: string) => s.includes('192'))).toBe(true);
    expect(iconSizes.some((s: string) => s.includes('512'))).toBe(true);
  });
});

test.describe('Service Worker', () => {
  test('should have service worker file', async ({ page }) => {
    const response = await page.goto('/sw.js');
    expect(response?.status()).toBe(200);
    
    const content = await response?.text();
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(100);
  });

  test('service worker should have install event', async ({ page }) => {
    const response = await page.goto('/sw.js');
    const content = await response?.text();
    
    expect(content).toContain('install');
  });

  test('service worker should have fetch handler', async ({ page }) => {
    const response = await page.goto('/sw.js');
    const content = await response?.text();
    
    expect(content).toContain('fetch');
  });

  test('service worker should have caching strategy', async ({ page }) => {
    const response = await page.goto('/sw.js');
    const content = await response?.text();
    
    expect(content).toContain('cache');
  });
});

test.describe('PWA Meta Tags', () => {
  test('should have apple-touch-icon', async ({ page }) => {
    await page.goto('/');
    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleTouchIcon).toHaveCount(1);
  });

  test('should have theme-color meta', async ({ page }) => {
    await page.goto('/');
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveCount(1);
  });

  test('should have viewport meta', async ({ page }) => {
    await page.goto('/');
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
  });
});
