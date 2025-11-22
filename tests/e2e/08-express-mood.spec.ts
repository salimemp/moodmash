import { test, expect } from '@playwright/test';

test.describe('Express Your Mood Feature', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/express`);
    await page.waitForLoadState('networkidle');
  });

  test('should load Express Your Mood page', async ({ page }) => {
    await expect(page).toHaveTitle(/Express Your Mood/);
    await expect(page.locator('h1')).toContainText(/Express Your Mood/i);
  });

  test('should display all 5 input modes', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-mode="emoji"]', { timeout: 10000 });
    
    // Check all mode buttons exist
    await expect(page.locator('[data-mode="emoji"]')).toBeVisible();
    await expect(page.locator('[data-mode="color"]')).toBeVisible();
    await expect(page.locator('[data-mode="intensity"]')).toBeVisible();
    await expect(page.locator('[data-mode="text"]')).toBeVisible();
    await expect(page.locator('[data-mode="voice"]')).toBeVisible();
  });

  test('should switch between modes', async ({ page }) => {
    await page.waitForSelector('[data-mode="emoji"]');
    
    // Click emoji mode
    await page.click('[data-mode="emoji"]');
    await expect(page.locator('.emoji-selector')).toBeVisible();
    
    // Switch to color mode
    await page.click('[data-mode="color"]');
    await expect(page.locator('.color-picker')).toBeVisible();
    
    // Switch to intensity mode
    await page.click('[data-mode="intensity"]');
    await expect(page.locator('input[type="range"]')).toBeVisible();
    
    // Switch to text mode
    await page.click('[data-mode="text"]');
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('should select emoji and display it', async ({ page }) => {
    await page.waitForSelector('[data-mode="emoji"]');
    await page.click('[data-mode="emoji"]');
    
    // Click an emoji
    const emojiButton = page.locator('[data-emotion="happy"]').first();
    await emojiButton.click();
    
    // Verify emoji is selected
    await expect(emojiButton).toHaveClass(/selected|active/);
  });

  test('should adjust intensity slider', async ({ page }) => {
    await page.waitForSelector('[data-mode="intensity"]');
    await page.click('[data-mode="intensity"]');
    
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
    
    // Set slider value
    await slider.fill('80');
    await expect(slider).toHaveValue('80');
  });

  test('should enter text in text mode', async ({ page }) => {
    await page.waitForSelector('[data-mode="text"]');
    await page.click('[data-mode="text"]');
    
    const textarea = page.locator('textarea');
    await textarea.fill('Feeling great today! Had a wonderful morning.');
    await expect(textarea).toHaveValue(/Feeling great/);
  });

  test('should change privacy settings', async ({ page }) => {
    await page.waitForSelector('[data-privacy]', { timeout: 10000 });
    
    // Click privacy selector
    const privacySelect = page.locator('[data-privacy="private"]');
    if (await privacySelect.isVisible()) {
      await privacySelect.click();
    }
    
    // Should have privacy options
    const friendsOption = page.locator('[data-privacy="friends"]');
    if (await friendsOption.isVisible()) {
      await friendsOption.click();
    }
  });

  test('should save mood successfully', async ({ page }) => {
    await page.waitForSelector('[data-mode="emoji"]');
    
    // Select emoji
    await page.click('[data-mode="emoji"]');
    await page.click('[data-emotion="happy"]');
    
    // Click save button
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Express")');
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Wait for success message
      await expect(page.locator('.success, .alert-success, [role="alert"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display color picker in color mode', async ({ page }) => {
    await page.waitForSelector('[data-mode="color"]');
    await page.click('[data-mode="color"]');
    
    // Color picker should be visible
    const colorPicker = page.locator('.color-picker, input[type="color"], .color-option');
    await expect(colorPicker.first()).toBeVisible();
  });

  test('should handle mobile responsive design', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    await page.waitForSelector('h1');
    
    // Should still display main elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-mode]').first()).toBeVisible();
  });
});
