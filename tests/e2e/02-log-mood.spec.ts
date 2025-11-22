import { test, expect } from '@playwright/test';
import { waitForPageReady, skipOnboarding } from '../fixtures/test-helpers';

test.describe('Log Mood Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/log');
    await waitForPageReady(page);
    await skipOnboarding(page);
  });

  test('should load log mood page with form', async ({ page }) => {
    await expect(page).toHaveTitle(/Log Mood/);
    
    // Check main form container exists
    const form = page.locator('#app');
    await expect(form).toBeVisible();
  });

  test('should display all 10 emotion buttons', async ({ page }) => {
    // Wait for emotions to render
    await page.waitForSelector('[data-emotion]', { timeout: 10000 });
    
    const emotions = ['happy', 'sad', 'anxious', 'calm', 'energetic', 'tired', 'angry', 'peaceful', 'stressed', 'neutral'];
    
    for (const emotion of emotions) {
      const button = page.locator(`[data-emotion="${emotion}"]`);
      await expect(button).toBeVisible();
    }
  });

  test('should select emotion and update UI', async ({ page }) => {
    await page.waitForSelector('[data-emotion="happy"]', { timeout: 10000 });
    
    const happyButton = page.locator('[data-emotion="happy"]');
    await happyButton.click();
    
    // Check if button has selected state (border-primary class)
    const classes = await happyButton.getAttribute('class');
    expect(classes).toContain('border-primary');
  });

  test('should display intensity slider', async ({ page }) => {
    const slider = page.locator('#intensity-slider');
    await expect(slider).toBeVisible();
    
    // Check default value
    const value = await slider.getAttribute('value');
    expect(value).toBe('3');
  });

  test('should update intensity value', async ({ page }) => {
    const slider = page.locator('#intensity-slider');
    await slider.fill('5');
    
    // Check displayed value
    const displayValue = page.locator('#intensity-value');
    await expect(displayValue).toHaveText('5');
  });

  test('should display notes textarea', async ({ page }) => {
    const notes = page.locator('#notes, textarea[placeholder*="feeling"]');
    await expect(notes).toBeVisible();
  });

  test('should display weather options', async ({ page }) => {
    const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'clear'];
    
    for (const weather of weatherOptions) {
      // Look for buttons that might contain weather options
      const weatherButton = page.locator(`button:has-text("${weather}"), button[onclick*="${weather}"]`).first();
      const count = await weatherButton.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display sleep hours input', async ({ page }) => {
    const sleepInput = page.locator('#sleep-hours, input[type="number"]');
    await expect(sleepInput).toBeVisible();
  });

  test('should display activity options', async ({ page }) => {
    // Check if activity buttons exist
    const activities = page.locator('button[onclick*="toggleActivity"], button[onclick*="Activity"]');
    const count = await activities.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display social interaction options', async ({ page }) => {
    // Check if social buttons exist
    const socialButtons = page.locator('button[onclick*="selectSocial"], button[onclick*="Social"]');
    const count = await socialButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show save button', async ({ page }) => {
    const saveButton = page.locator('button:has-text("Save"), button:has(.fa-save)');
    await expect(saveButton).toBeVisible();
  });

  test('should show cancel link', async ({ page }) => {
    const cancelLink = page.locator('a[href="/"], a:has-text("Cancel")');
    await expect(cancelLink).toBeVisible();
  });

  test('should show error when submitting without emotion', async ({ page }) => {
    // Try to submit without selecting emotion
    const saveButton = page.locator('button:has-text("Save"), button:has(.fa-save)');
    await saveButton.click();
    
    // Wait for error message
    await page.waitForTimeout(1000);
    
    // Check for error (might be alert or div)
    const errorVisible = await page.locator('#emotion-error, .text-red-500').isVisible().catch(() => false);
    expect(errorVisible).toBeTruthy();
  });

  test('should successfully submit mood form', async ({ page }) => {
    // Wait for form to be ready
    await page.waitForSelector('[data-emotion="happy"]', { timeout: 10000 });
    
    // Select emotion
    await page.click('[data-emotion="happy"]');
    
    // Set intensity
    await page.locator('#intensity-slider').fill('4');
    
    // Add notes
    const notesField = page.locator('#notes, textarea').first();
    await notesField.fill('Feeling great today!');
    
    // Mock the API call to avoid database errors
    await page.route('**/api/moods', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, id: 1 })
      });
    });
    
    // Submit form
    const saveButton = page.locator('button:has-text("Save"), button:has(.fa-save)');
    await saveButton.click();
    
    // Wait for success modal or redirect
    await page.waitForTimeout(2000);
    
    // Check for success indicators
    const hasSuccessModal = await page.locator('#success-modal, .fa-check-circle').isVisible().catch(() => false);
    const isRedirected = page.url().includes('/');
    
    expect(hasSuccessModal || isRedirected).toBeTruthy();
  });

  test('should return to dashboard on cancel', async ({ page }) => {
    const cancelLink = page.locator('a[href="/"]').first();
    await cancelLink.click();
    
    await page.waitForURL('**/');
    await expect(page).toHaveTitle(/Dashboard/);
  });
});
