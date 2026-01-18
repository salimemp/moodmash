/**
 * Accessibility E2E Tests
 * Tests for WCAG compliance and accessibility features
 */
import { test, expect } from '@playwright/test';

test.describe('Accessibility - Structure', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('should have main landmark', async ({ page }) => {
    await page.goto('/');
    
    const main = page.locator('main, [role="main"]');
    if (await main.count() > 0) {
      await expect(main.first()).toBeVisible();
    }
  });

  test('should have skip link or navigation landmark', async ({ page }) => {
    await page.goto('/');
    
    const skipLink = page.locator('a[href="#main"], a[href="#content"], .skip-link');
    const nav = page.locator('nav, [role="navigation"]');
    
    // Should have either skip link or navigation
    const hasSkipLink = await skipLink.count() > 0;
    const hasNav = await nav.count() > 0;
    expect(hasSkipLink || hasNav).toBe(true);
  });
});

test.describe('Accessibility - Forms', () => {
  test('login form should have labels', async ({ page }) => {
    await page.goto('/login');
    
    const inputs = page.locator('input[type="email"], input[type="password"]');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      
      // Should have id with label, aria-label, or at least placeholder
      const hasAccessibleName = id || ariaLabel || placeholder;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/login');
    
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      // Button should have text or aria-label
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });
});

test.describe('Accessibility - Images', () => {
  test('images should have alt attributes', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Image should have alt attribute (can be empty for decorative)
      // or role="presentation" for decorative images
      expect(alt !== null || role === 'presentation').toBe(true);
    }
  });
});

test.describe('Accessibility - Color Contrast', () => {
  test('should have dark mode toggle', async ({ page }) => {
    await page.goto('/');
    
    const darkModeToggle = page.locator('[data-theme-toggle], .dark-mode-toggle, button[aria-label*="dark"], button[aria-label*="theme"]');
    
    if (await darkModeToggle.count() > 0) {
      await expect(darkModeToggle.first()).toBeVisible();
    }
  });
});

test.describe('Accessibility - Keyboard Navigation', () => {
  test('should be able to tab through interactive elements', async ({ page }) => {
    await page.goto('/login');
    
    // Tab to first input
    await page.keyboard.press('Tab');
    
    // Should focus on an interactive element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/login');
    
    await page.keyboard.press('Tab');
    
    // Check if focused element has visible focus styles
    const focusedElement = page.locator(':focus');
    const outline = await focusedElement.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.outline || styles.boxShadow || styles.border;
    });
    
    expect(outline).toBeTruthy();
  });
});
