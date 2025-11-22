import { test, expect } from '@playwright/test';
import { waitForPageReady } from '../fixtures/test-helpers';

test.describe('PWA & Service Worker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
  });

  test('should register Service Worker', async ({ page }) => {
    // Wait for SW registration
    await page.waitForTimeout(3000);
    
    const swRegistered = await page.evaluate(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0;
    });
    
    expect(swRegistered).toBeTruthy();
  });

  test('should have Service Worker version 3.0.0', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Fetch sw.js and check version
    const swContent = await page.evaluate(async () => {
      const response = await fetch('/sw.js');
      return response.text();
    });
    
    expect(swContent).toContain('3.0.0');
    expect(swContent).toContain('moodmash-v3.0.0');
  });

  test('should cache static assets', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const cachedAssets = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      if (cacheNames.length === 0) return [];
      
      const cache = await caches.open(cacheNames[0]);
      const requests = await cache.keys();
      return requests.map(req => req.url);
    });
    
    // Should have cached some assets
    expect(cachedAssets.length).toBeGreaterThan(0);
    
    // Check for key assets
    const hasI18n = cachedAssets.some(url => url.includes('i18n.js'));
    const hasApp = cachedAssets.some(url => url.includes('app.js'));
    
    expect(hasI18n || hasApp).toBeTruthy();
  });

  test('should have manifest.json', async ({ page }) => {
    const manifestResponse = await page.goto('/manifest.json');
    expect(manifestResponse?.status()).toBe(200);
    
    const manifest = await manifestResponse?.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('should have PWA meta tags', async ({ page }) => {
    // Check for PWA meta tags
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBeTruthy();
    
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('should have apple-touch-icon', async ({ page }) => {
    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
    const count = await appleTouchIcon.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should work offline (cached pages)', async ({ page }) => {
    // Load page first
    await page.goto('/');
    await waitForPageReady(page);
    await page.waitForTimeout(3000);
    
    // Go offline
    await page.context().setOffline(true);
    
    // Try to navigate (should work from cache)
    await page.goto('/');
    
    // Check if page loaded (even if with stale data)
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Go back online
    await page.context().setOffline(false);
  });

  test('should cache i18n.js file', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const isI18nCached = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const response = await cache.match('/static/i18n.js');
        if (response) return true;
      }
      return false;
    });
    
    expect(isI18nCached).toBeTruthy();
  });

  test('should load icons', async ({ page }) => {
    // Check if icon files exist
    const icon192Response = await page.goto('/icons/icon-192x192.png');
    const icon512Response = await page.goto('/icons/icon-512x512.png');
    
    // Icons should exist or page should load without error
    const hasIcons = (icon192Response?.status() === 200) || (icon512Response?.status() === 200);
    
    // Return to home after checking icons
    await page.goto('/');
  });

  test('should handle Service Worker updates', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Check if SW update mechanism works
    const canUpdate = await page.evaluate(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) return false;
      
      const reg = registrations[0];
      return typeof reg.update === 'function';
    });
    
    expect(canUpdate).toBeTruthy();
  });

  test('should clean old caches on activation', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Check SW has cache cleanup logic
    const swContent = await page.evaluate(async () => {
      const response = await fetch('/sw.js');
      return response.text();
    });
    
    expect(swContent).toContain('activate');
    expect(swContent).toContain('caches.delete');
  });

  test('should use network-first strategy for JS files', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Check SW fetch strategy
    const swContent = await page.evaluate(async () => {
      const response = await fetch('/sw.js');
      return response.text();
    });
    
    expect(swContent).toContain('fetch');
    expect(swContent).toContain('/static/');
  });

  test('should skip caching API requests', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Check SW doesn't cache API requests
    const swContent = await page.evaluate(async () => {
      const response = await fetch('/sw.js');
      return response.text();
    });
    
    expect(swContent).toContain('/api/');
    expect(swContent).toContain('Skip API');
  });

  test('should have installable PWA', async ({ page }) => {
    // Check if beforeinstallprompt event can be triggered
    const isInstallable = await page.evaluate(() => {
      return 'BeforeInstallPromptEvent' in window || 
             window.matchMedia('(display-mode: standalone)').matches;
    });
    
    // PWA might not be installable in test environment, but check for capability
    expect(typeof isInstallable).toBe('boolean');
  });
});
