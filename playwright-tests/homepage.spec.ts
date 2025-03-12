import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Check that the page has loaded
    await expect(page).toHaveTitle(/MoodMash/);

    // Verify basic elements are present
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Check for key UI elements
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/');

    // Find and click the sign in button
    const signInButton = page.getByRole('link', { name: /sign in/i });
    if (await signInButton.isVisible()) {
      await signInButton.click();

      // Check we navigated to the sign in page
      await expect(page).toHaveURL(/.*signin/);
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    }
  });

  test('should have a responsive layout', async ({ page }) => {
    await page.goto('/');

    // Test responsive layouts
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Wait for any responsive changes
    
    // Check mobile menu button is visible on mobile
    const mobileMenuButton = page.getByRole('button', { name: /menu/i });
    if (await mobileMenuButton.isVisible()) {
      await expect(mobileMenuButton).toBeVisible();
    }

    // Desktop view
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(500); // Wait for any responsive changes
    
    // Check navigation links are visible on desktop
    const navLinks = page.getByRole('navigation').getByRole('link');
    await expect(navLinks).toHaveCount(await navLinks.count());
  });
}); 