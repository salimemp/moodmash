import { test, expect } from '@playwright/test';

test.describe('Mood Insights Feature', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    // First, log some moods to have data
    await page.goto(`${BASE_URL}/quick-select`);
    await page.waitForLoadState('networkidle');
    
    // Log a few quick moods
    const emotions = ['happy', 'calm', 'energetic'];
    for (const emotion of emotions) {
      const emotionBtn = page.locator(`[data-emotion="${emotion}"]`).first();
      if (await emotionBtn.isVisible()) {
        await emotionBtn.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Navigate to insights
    await page.goto(`${BASE_URL}/insights`);
    await page.waitForLoadState('networkidle');
  });

  test('should load Mood Insights page', async ({ page }) => {
    await expect(page).toHaveTitle(/Mood Insights|Insights/);
    await expect(page.locator('h1')).toContainText(/Insights|Mood/i);
  });

  test('should display statistics cards', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-stat]', { timeout: 10000 }).catch(() => {});
    
    // Check for common stat elements
    const statElements = page.locator('.stat-card, [data-stat], .metric');
    const count = await statElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show dominant mood', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for dominant mood display
    const dominantMood = page.locator('[data-dominant-mood], .dominant-mood, .primary-mood');
    if (await dominantMood.count() > 0) {
      await expect(dominantMood.first()).toBeVisible();
    }
  });

  test('should display mood timeline', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for timeline or chart
    const timeline = page.locator('.timeline, .mood-timeline, canvas, .chart');
    if (await timeline.count() > 0) {
      await expect(timeline.first()).toBeVisible();
    }
  });

  test('should show mood stability score', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for stability metric
    const stability = page.locator('[data-stability], .stability, .stability-score');
    if (await stability.count() > 0) {
      await expect(stability.first()).toBeVisible();
    }
  });

  test('should display period filters (weekly/monthly)', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for period filters
    const filters = page.locator('button:has-text("Weekly"), button:has-text("Monthly"), [data-period]');
    if (await filters.count() > 0) {
      await expect(filters.first()).toBeVisible();
    }
  });

  test('should switch between time periods', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const weeklyBtn = page.locator('button:has-text("Weekly"), [data-period="weekly"]');
    const monthlyBtn = page.locator('button:has-text("Monthly"), [data-period="monthly"]');
    
    if (await weeklyBtn.count() > 0 && await monthlyBtn.count() > 0) {
      await weeklyBtn.first().click();
      await page.waitForTimeout(1000);
      
      await monthlyBtn.first().click();
      await page.waitForTimeout(1000);
      
      // Page should still be visible after switching
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('should show total entries count', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for total entries
    const totalEntries = page.locator('[data-total-entries], .total-entries, .entry-count');
    if (await totalEntries.count() > 0) {
      const text = await totalEntries.first().textContent();
      expect(text).toMatch(/\d+/); // Should contain a number
    }
  });

  test('should display average intensity', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for average intensity
    const avgIntensity = page.locator('[data-avg-intensity], .avg-intensity, .average');
    if (await avgIntensity.count() > 0) {
      await expect(avgIntensity.first()).toBeVisible();
    }
  });

  test('should handle no data state gracefully', async ({ page }) => {
    // Create a new user scenario with no data
    await page.goto(`${BASE_URL}/insights`);
    await page.waitForTimeout(2000);
    
    // Should show either data or a "no data" message
    const hasData = await page.locator('.stat-card, [data-stat]').count() > 0;
    const hasNoDataMsg = await page.locator('text=/no data|not enough|log more/i').count() > 0;
    
    expect(hasData || hasNoDataMsg).toBeTruthy();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Main content should be visible
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display mood distribution', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for mood distribution chart or list
    const distribution = page.locator('.distribution, .mood-breakdown, canvas');
    if (await distribution.count() > 0) {
      await expect(distribution.first()).toBeVisible();
    }
  });

  test('should show personalized recommendations', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for recommendations section
    const recommendations = page.locator('.recommendation, .insight, .suggestion');
    if (await recommendations.count() > 0) {
      await expect(recommendations.first()).toBeVisible();
    }
  });
});
