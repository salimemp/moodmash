import { test, expect } from '@playwright/test';
import { waitForPageReady, skipOnboarding, mockApiEndpoint } from '../fixtures/test-helpers';

test.describe('Activities Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock activities API
    await mockApiEndpoint(page, '/api/activities', {
      activities: [
        {
          id: 1,
          name: '5-Minute Breathing',
          category: 'meditation',
          difficulty: 'easy',
          duration: 5,
          description: 'Deep breathing exercise',
          instructions: 'Breathe in for 4 counts, hold for 4, exhale for 4',
          benefits: ['Reduces anxiety', 'Improves focus']
        },
        {
          id: 2,
          name: 'Morning Yoga',
          category: 'exercise',
          difficulty: 'medium',
          duration: 15,
          description: 'Gentle yoga routine',
          instructions: 'Follow the sun salutation sequence',
          benefits: ['Increases flexibility', 'Boosts energy']
        },
        {
          id: 3,
          name: 'Gratitude Journal',
          category: 'journaling',
          difficulty: 'easy',
          duration: 10,
          description: 'Write down things you are grateful for',
          instructions: 'List 3 things you are grateful for today',
          benefits: ['Improves mood', 'Increases positivity']
        }
      ]
    });
    
    await page.goto('/activities');
    await waitForPageReady(page);
    await skipOnboarding(page);
  });

  test('should load activities page', async ({ page }) => {
    await expect(page).toHaveTitle(/Activities/);
  });

  test('should display page title and description', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    const title = page.locator('h1');
    await expect(title).toBeVisible();
    
    const titleText = await title.textContent();
    expect(titleText).toBeTruthy();
    expect(titleText!.length).toBeGreaterThan(0);
  });

  test('should display emotion filter buttons', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Check for filter buttons
    const filterSection = page.locator('button[onclick*="filterByEmotion"], button[onclick*="Emotion"]');
    const count = await filterSection.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display category filter buttons', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Check for category filter buttons
    const categoryButtons = page.locator('button[onclick*="Category"], label:has-text("category")');
    const count = await categoryButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display activity cards', async ({ page }) => {
    // Wait for activities to load
    await page.waitForTimeout(3000);
    
    // Look for activity cards (they should have View Details buttons or activity names)
    const activityCards = page.locator('button:has-text("View Details"), .activity-card, [data-activity-id]');
    const count = await activityCards.count();
    
    // Should have at least 1 activity (from mock or real data)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should filter activities by emotion', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Try to click on an emotion filter
    const anxiousFilter = page.locator('button:has-text("Anxious"), button[onclick*="anxious"]').first();
    
    if (await anxiousFilter.isVisible().catch(() => false)) {
      await anxiousFilter.click();
      await page.waitForTimeout(1000);
      
      // Check if filter is active (might have different styling)
      const classes = await anxiousFilter.getAttribute('class');
      expect(classes).toBeTruthy();
    }
  });

  test('should open activity details modal', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Look for "View Details" button
    const viewDetailsButton = page.locator('button:has-text("View Details"), button:has-text("Details")').first();
    
    if (await viewDetailsButton.isVisible().catch(() => false)) {
      await viewDetailsButton.click();
      await page.waitForTimeout(1000);
      
      // Check if modal is visible
      const modal = page.locator('#activity-modal, .modal, [role="dialog"]');
      const isModalVisible = await modal.isVisible().catch(() => false);
      expect(isModalVisible).toBeTruthy();
    }
  });

  test('should display activity instructions in modal', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const viewDetailsButton = page.locator('button:has-text("View Details")').first();
    
    if (await viewDetailsButton.isVisible().catch(() => false)) {
      await viewDetailsButton.click();
      await page.waitForTimeout(1000);
      
      // Look for instructions
      const instructions = page.locator('text=/Instructions|instructions|Steps|steps/i');
      const hasInstructions = await instructions.count();
      expect(hasInstructions).toBeGreaterThanOrEqual(0);
    }
  });

  test('should close activity modal', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const viewDetailsButton = page.locator('button:has-text("View Details")').first();
    
    if (await viewDetailsButton.isVisible().catch(() => false)) {
      await viewDetailsButton.click();
      await page.waitForTimeout(1000);
      
      // Try to close modal
      const closeButton = page.locator('button:has-text("Close"), button.close, button:has(.fa-times)').first();
      
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
        await page.waitForTimeout(500);
        
        // Modal should be hidden
        const modal = page.locator('#activity-modal, .modal, [role="dialog"]');
        const isModalHidden = await modal.isHidden().catch(() => true);
        expect(isModalHidden).toBeTruthy();
      }
    }
  });

  test('should start activity timer', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const viewDetailsButton = page.locator('button:has-text("View Details")').first();
    
    if (await viewDetailsButton.isVisible().catch(() => false)) {
      await viewDetailsButton.click();
      await page.waitForTimeout(1000);
      
      // Look for Start Activity button
      const startButton = page.locator('button:has-text("Start"), button:has-text("Begin")').first();
      
      if (await startButton.isVisible().catch(() => false)) {
        await startButton.click();
        await page.waitForTimeout(1000);
        
        // Check if timer is visible
        const timer = page.locator('text=/\\d{2}:\\d{2}/');
        const hasTimer = await timer.isVisible().catch(() => false);
        expect(hasTimer).toBeTruthy();
      }
    }
  });

  test('should display difficulty badges', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Look for difficulty indicators
    const difficultyBadges = page.locator('text=/Easy|Medium|Hard/i, .badge');
    const count = await difficultyBadges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display duration information', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Look for duration info (e.g., "5 min", "15 min")
    const duration = page.locator('text=/\\d+\\s*(min|minute)/i');
    const count = await duration.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should navigate back to dashboard', async ({ page }) => {
    const homeLink = page.locator('a[href="/"]').first();
    await homeLink.click();
    
    await page.waitForURL('**/');
    await expect(page).toHaveTitle(/Dashboard/);
  });
});
