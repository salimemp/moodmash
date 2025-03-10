import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page has loaded
    await expect(page).toHaveTitle(/MoodMash/);
    
    // Verify basic elements are present
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/');
    
    // Find and click the sign in button (adjust the selector as needed)
    const signInButton = page.getByRole('link', { name: /sign in/i });
    if (await signInButton.isVisible()) {
      await signInButton.click();
      
      // Check we navigated to the sign in page
      await expect(page).toHaveURL(/.*sign-in/);
    }
  });

  test('should have a responsive layout', async ({ page }) => {
    await page.goto('/');
    
    // Test responsive layouts
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveScreenshot('homepage-mobile.png', { 
      maxDiffPixelRatio: 0.1,
    });
    
    // Desktop view
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      maxDiffPixelRatio: 0.1,
    });
  });
}); 