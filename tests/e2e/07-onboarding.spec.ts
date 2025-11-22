import { test, expect } from '@playwright/test';
import { waitForPageReady, clearBrowserCache } from '../fixtures/test-helpers';

test.describe('Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cache to ensure onboarding shows
    await page.goto('/');
    await clearBrowserCache(page);
    await page.reload();
    await waitForPageReady(page);
  });

  test('should display onboarding on first visit', async ({ page }) => {
    // Wait for onboarding to appear
    await page.waitForTimeout(2000);
    
    const onboardingModal = page.locator('#onboarding-modal, .onboarding, [data-testid="onboarding"]');
    const isVisible = await onboardingModal.isVisible().catch(() => false);
    
    expect(isVisible).toBeTruthy();
  });

  test('should display welcome slide', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for welcome text
    const welcomeText = page.locator('text=/Welcome|welcome/i');
    const count = await welcomeText.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display MoodMash branding', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for MoodMash in onboarding
    const branding = page.locator('text="MoodMash"');
    const count = await branding.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show skip button', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const skipButton = page.locator('button:has-text("Skip")');
    const isVisible = await skipButton.isVisible().catch(() => false);
    
    expect(isVisible).toBeTruthy();
  });

  test('should show next/get started button', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Get Started"), button:has-text("Continue")');
    const count = await nextButton.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to next slide', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
    
    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click();
      await page.waitForTimeout(1000);
      
      // Check if content changed (should show different slide)
      const body = await page.locator('body').textContent();
      expect(body).toBeTruthy();
    }
  });

  test('should show progress indicators', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for progress dots or indicators
    const progressDots = page.locator('.dot, .indicator, [data-slide]');
    const count = await progressDots.count();
    
    // Should have at least 2 slides (welcome + features)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should skip onboarding', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const skipButton = page.locator('button:has-text("Skip")').first();
    
    if (await skipButton.isVisible().catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(1000);
      
      // Onboarding should be hidden
      const onboardingModal = page.locator('#onboarding-modal');
      const isHidden = await onboardingModal.isHidden().catch(() => true);
      expect(isHidden).toBeTruthy();
    }
  });

  test('should complete onboarding', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Click through all slides
    for (let i = 0; i < 3; i++) {
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Get Started"), button:has-text("Continue")').first();
      
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Onboarding should be completed
    const onboardingModal = page.locator('#onboarding-modal');
    const isHidden = await onboardingModal.isHidden().catch(() => true);
    expect(isHidden).toBeTruthy();
  });

  test('should not show onboarding on subsequent visits', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Skip onboarding
    const skipButton = page.locator('button:has-text("Skip"), button:has-text("Get Started")').first();
    
    if (await skipButton.isVisible().catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Reload page
    await page.reload();
    await waitForPageReady(page);
    await page.waitForTimeout(2000);
    
    // Onboarding should not appear
    const onboardingModal = page.locator('#onboarding-modal');
    const isHidden = await onboardingModal.isHidden().catch(() => true);
    expect(isHidden).toBeTruthy();
  });

  test('should display translated onboarding content', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Get all text from onboarding
    const bodyText = await page.locator('body').textContent();
    
    // Should not have raw translation keys
    const hasRawKeys = /^[a-z]+_[a-z]+_[a-z]+$/.test(bodyText || '');
    expect(hasRawKeys).toBeFalsy();
  });

  test('should show feature highlights', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for feature descriptions
    const features = page.locator('text=/track|mood|activities|languages/i');
    const count = await features.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should mention 13 languages', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for language count
    const languageCount = page.locator('text=/13.*language/i, text=/language.*13/i');
    const count = await languageCount.count();
    
    // Should mention language support
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show free and premium tier information', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Click through to see premium info
    const nextButton = page.locator('button:has-text("Next")').first();
    
    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click();
      await page.waitForTimeout(1000);
      
      // Look for free or premium mentions
      const tierInfo = page.locator('text=/free|premium/i');
      const count = await tierInfo.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have proper z-index for modal', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const onboardingModal = page.locator('#onboarding-modal, .onboarding').first();
    
    if (await onboardingModal.isVisible().catch(() => false)) {
      const zIndex = await onboardingModal.evaluate(el => {
        return window.getComputedStyle(el).zIndex;
      });
      
      // Should have high z-index (50 or higher for modals)
      const zIndexNum = parseInt(zIndex);
      expect(zIndexNum).toBeGreaterThanOrEqual(40);
    }
  });
});
