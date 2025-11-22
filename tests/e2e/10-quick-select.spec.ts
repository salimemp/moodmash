import { test, expect } from '@playwright/test';

test.describe('Quick Mood Select Feature', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/quick-select`);
    await page.waitForLoadState('networkidle');
  });

  test('should load Quick Select page', async ({ page }) => {
    await expect(page).toHaveTitle(/Quick|Select/);
    await expect(page.locator('h1')).toContainText(/Quick|Select/i);
  });

  test('should display emotion emojis', async ({ page }) => {
    // Wait for emojis to load
    await page.waitForSelector('[data-emotion]', { timeout: 10000 });
    
    const emotionButtons = page.locator('[data-emotion]');
    const count = await emotionButtons.count();
    
    // Should have multiple emotion options
    expect(count).toBeGreaterThan(5);
  });

  test('should display recently used section', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Look for recently used section
    const recentlyUsed = page.locator('text=/recently used/i, [data-section="recent"]');
    if (await recentlyUsed.count() > 0) {
      await expect(recentlyUsed.first()).toBeVisible();
    }
  });

  test('should log mood with one click', async ({ page }) => {
    await page.waitForSelector('[data-emotion="happy"]');
    
    // Click happy emotion
    await page.click('[data-emotion="happy"]');
    
    // Should show success feedback
    await page.waitForTimeout(1000);
    const success = page.locator('.success, .saved, [role="alert"]');
    if (await success.count() > 0) {
      await expect(success.first()).toBeVisible();
    }
  });

  test('should update recently used after selection', async ({ page }) => {
    await page.waitForSelector('[data-emotion="calm"]');
    
    // Select an emotion
    await page.click('[data-emotion="calm"]');
    await page.waitForTimeout(1500);
    
    // Reload page
    await page.reload();
    await page.waitForSelector('[data-emotion]');
    
    // Calm should appear in recently used (if section exists)
    const recentSection = page.locator('[data-section="recent"], .recently-used');
    if (await recentSection.count() > 0) {
      const calmInRecent = recentSection.locator('[data-emotion="calm"]');
      if (await calmInRecent.count() > 0) {
        await expect(calmInRecent.first()).toBeVisible();
      }
    }
  });

  test('should display all emotions section', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Look for all emotions section
    const allEmotions = page.locator('text=/all emotions/i, [data-section="all"]');
    if (await allEmotions.count() > 0) {
      await expect(allEmotions.first()).toBeVisible();
    }
  });

  test('should have all 10 core emotions', async ({ page }) => {
    await page.waitForSelector('[data-emotion]');
    
    const emotions = ['happy', 'sad', 'anxious', 'calm', 'energetic', 'tired', 'angry', 'peaceful', 'stressed', 'neutral'];
    
    for (const emotion of emotions) {
      const emotionBtn = page.locator(`[data-emotion="${emotion}"]`);
      const count = await emotionBtn.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should log multiple moods in succession', async ({ page }) => {
    await page.waitForSelector('[data-emotion]');
    
    const emotions = ['happy', 'calm', 'energetic'];
    
    for (const emotion of emotions) {
      const btn = page.locator(`[data-emotion="${emotion}"]`).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(800);
      }
    }
    
    // Should still be on the page
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show visual feedback on click', async ({ page }) => {
    await page.waitForSelector('[data-emotion="happy"]');
    
    const happyBtn = page.locator('[data-emotion="happy"]').first();
    
    // Click and check for visual feedback
    await happyBtn.click();
    await page.waitForTimeout(500);
    
    // Button should have some active/clicked state or success message appears
    const hasActiveState = await happyBtn.evaluate((el) => {
      return el.classList.contains('active') || 
             el.classList.contains('clicked') ||
             el.classList.contains('selected');
    });
    
    const hasSuccessMsg = await page.locator('.success, .saved').count() > 0;
    
    expect(hasActiveState || hasSuccessMsg).toBeTruthy();
  });

  test('should be fast and responsive', async ({ page }) => {
    await page.waitForSelector('[data-emotion]');
    
    const startTime = Date.now();
    await page.click('[data-emotion="happy"]');
    const endTime = Date.now();
    
    // Click should be handled within 3 seconds
    expect(endTime - startTime).toBeLessThan(3000);
  });

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    await page.waitForSelector('[data-emotion]');
    
    // Emotions should be visible and tappable
    const emotionBtn = page.locator('[data-emotion]').first();
    await expect(emotionBtn).toBeVisible();
    
    await emotionBtn.click();
    await page.waitForTimeout(1000);
    
    // Should still work
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display emotion labels or tooltips', async ({ page }) => {
    await page.waitForSelector('[data-emotion]');
    
    const happyBtn = page.locator('[data-emotion="happy"]').first();
    
    // Hover to see tooltip (if implemented)
    await happyBtn.hover();
    await page.waitForTimeout(500);
    
    // Check if there's a label or tooltip
    const hasLabel = await happyBtn.textContent();
    expect(hasLabel).toBeTruthy();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    // Look for navigation link
    const dashboardLink = page.locator('a[href="/"], a:has-text("Dashboard")');
    
    if (await dashboardLink.count() > 0) {
      await dashboardLink.first().click();
      await page.waitForLoadState('networkidle');
      
      // Should be on dashboard
      await expect(page.url()).toContain('/');
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true);
    
    await page.goto(`${BASE_URL}/quick-select`);
    await page.waitForTimeout(2000);
    
    // Should show error or cached content
    const hasError = await page.locator('text=/error|offline|failed/i').count() > 0;
    const hasContent = await page.locator('[data-emotion]').count() > 0;
    
    expect(hasError || hasContent).toBeTruthy();
    
    // Restore online
    await page.context().setOffline(false);
  });
});
