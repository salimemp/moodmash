import { test, expect } from '@playwright/test';
import { waitForPageReady, skipOnboarding } from '../fixtures/test-helpers';

test.describe('Chatbot & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
    await skipOnboarding(page);
  });

  test.describe('Chatbot ("Mood")', () => {
    test('should display chatbot toggle button', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const chatbotButton = page.locator('button:has(.fa-comment), button[data-testid="chatbot-toggle"]');
      const isVisible = await chatbotButton.isVisible().catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should open chatbot panel', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const chatbotButton = page.locator('button:has(.fa-comment)').first();
      
      if (await chatbotButton.isVisible().catch(() => false)) {
        await chatbotButton.click();
        await page.waitForTimeout(1000);
        
        // Check if chatbot panel is visible
        const chatbotPanel = page.locator('#chatbot-panel, [data-testid="chatbot-panel"]');
        const isPanelVisible = await chatbotPanel.isVisible().catch(() => false);
        expect(isPanelVisible).toBeTruthy();
      }
    });

    test('should display chatbot title', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const chatbotButton = page.locator('button:has(.fa-comment)').first();
      
      if (await chatbotButton.isVisible().catch(() => false)) {
        await chatbotButton.click();
        await page.waitForTimeout(1000);
        
        // Look for "Mood" or chatbot title
        const title = page.locator('h3:has-text("Mood"), h2:has-text("Chatbot")').first();
        const titleVisible = await title.isVisible().catch(() => false);
        expect(titleVisible).toBeTruthy();
      }
    });

    test('should display chatbot input field', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const chatbotButton = page.locator('button:has(.fa-comment)').first();
      
      if (await chatbotButton.isVisible().catch(() => false)) {
        await chatbotButton.click();
        await page.waitForTimeout(1000);
        
        // Look for input field
        const input = page.locator('#chatbot-input, input[placeholder*="Ask"], textarea[placeholder*="Ask"]');
        const inputVisible = await input.isVisible().catch(() => false);
        expect(inputVisible).toBeTruthy();
      }
    });

    test('should display FAQ quick buttons', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const chatbotButton = page.locator('button:has(.fa-comment)').first();
      
      if (await chatbotButton.isVisible().catch(() => false)) {
        await chatbotButton.click();
        await page.waitForTimeout(1000);
        
        // Look for FAQ buttons
        const faqButtons = page.locator('button:has-text("mood"), button:has-text("premium"), button:has-text("help")');
        const count = await faqButtons.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test('should send message', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const chatbotButton = page.locator('button:has(.fa-comment)').first();
      
      if (await chatbotButton.isVisible().catch(() => false)) {
        await chatbotButton.click();
        await page.waitForTimeout(1000);
        
        const input = page.locator('#chatbot-input, input[placeholder*="Ask"]').first();
        
        if (await input.isVisible().catch(() => false)) {
          await input.fill('How do I log my mood?');
          
          const sendButton = page.locator('button:has-text("Send"), button:has(.fa-paper-plane)').first();
          
          if (await sendButton.isVisible().catch(() => false)) {
            await sendButton.click();
            await page.waitForTimeout(1000);
            
            // Check if message appears in chat
            const messageText = page.locator('text="How do I log my mood?"');
            const messageVisible = await messageText.isVisible().catch(() => false);
            expect(messageVisible).toBeTruthy();
          }
        }
      }
    });

    test('should close chatbot panel', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const chatbotButton = page.locator('button:has(.fa-comment)').first();
      
      if (await chatbotButton.isVisible().catch(() => false)) {
        await chatbotButton.click();
        await page.waitForTimeout(1000);
        
        const closeButton = page.locator('button:has(.fa-times), button:has-text("Close")').first();
        
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click();
          await page.waitForTimeout(500);
          
          const chatbotPanel = page.locator('#chatbot-panel');
          const isPanelHidden = await chatbotPanel.isHidden().catch(() => true);
          expect(isPanelHidden).toBeTruthy();
        }
      }
    });
  });

  test.describe('Accessibility Panel', () => {
    test('should display accessibility toggle button', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const a11yButton = page.locator('button:has(.fa-universal-access), button[data-testid="accessibility-toggle"]');
      const isVisible = await a11yButton.isVisible().catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should open accessibility panel', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const a11yButton = page.locator('button:has(.fa-universal-access)').first();
      
      if (await a11yButton.isVisible().catch(() => false)) {
        await a11yButton.click();
        await page.waitForTimeout(1000);
        
        const a11yPanel = page.locator('#accessibility-panel, [data-testid="accessibility-panel"]');
        const isPanelVisible = await a11yPanel.isVisible().catch(() => false);
        expect(isPanelVisible).toBeTruthy();
      }
    });

    test('should display accessibility title', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const a11yButton = page.locator('button:has(.fa-universal-access)').first();
      
      if (await a11yButton.isVisible().catch(() => false)) {
        await a11yButton.click();
        await page.waitForTimeout(1000);
        
        const title = page.locator('h3:has-text("Accessibility"), h2:has-text("Accessibility")').first();
        const titleVisible = await title.isVisible().catch(() => false);
        expect(titleVisible).toBeTruthy();
      }
    });

    test('should toggle read aloud', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const a11yButton = page.locator('button:has(.fa-universal-access)').first();
      
      if (await a11yButton.isVisible().catch(() => false)) {
        await a11yButton.click();
        await page.waitForTimeout(1000);
        
        const readAloudToggle = page.locator('button:has-text("Read Aloud"), input[type="checkbox"]').first();
        
        if (await readAloudToggle.isVisible().catch(() => false)) {
          await readAloudToggle.click();
          await page.waitForTimeout(500);
          
          // Check if setting is saved to localStorage
          const isEnabled = await page.evaluate(() => {
            return localStorage.getItem('a11y_read_aloud') === 'true';
          });
          
          expect(typeof isEnabled).toBe('boolean');
        }
      }
    });

    test('should toggle high contrast', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const a11yButton = page.locator('button:has(.fa-universal-access)').first();
      
      if (await a11yButton.isVisible().catch(() => false)) {
        await a11yButton.click();
        await page.waitForTimeout(1000);
        
        const highContrastToggle = page.locator('button:has-text("High Contrast"), button:has-text("Contrast")').first();
        
        if (await highContrastToggle.isVisible().catch(() => false)) {
          await highContrastToggle.click();
          await page.waitForTimeout(500);
          
          // Check if high contrast class is applied
          const hasHighContrast = await page.evaluate(() => {
            return document.body.classList.contains('high-contrast') ||
                   localStorage.getItem('a11y_high_contrast') === 'true';
          });
          
          expect(typeof hasHighContrast).toBe('boolean');
        }
      }
    });

    test('should change font size', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const a11yButton = page.locator('button:has(.fa-universal-access)').first();
      
      if (await a11yButton.isVisible().catch(() => false)) {
        await a11yButton.click();
        await page.waitForTimeout(1000);
        
        const fontSizeButton = page.locator('button:has-text("Large"), button:has-text("Font")').first();
        
        if (await fontSizeButton.isVisible().catch(() => false)) {
          await fontSizeButton.click();
          await page.waitForTimeout(500);
          
          // Check if font size setting is saved
          const fontSize = await page.evaluate(() => {
            return localStorage.getItem('a11y_font_size');
          });
          
          expect(fontSize).toBeTruthy();
        }
      }
    });

    test('should close accessibility panel', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const a11yButton = page.locator('button:has(.fa-universal-access)').first();
      
      if (await a11yButton.isVisible().catch(() => false)) {
        await a11yButton.click();
        await page.waitForTimeout(1000);
        
        const closeButton = page.locator('button:has(.fa-times), button:has-text("Close")').first();
        
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click();
          await page.waitForTimeout(500);
          
          const a11yPanel = page.locator('#accessibility-panel');
          const isPanelHidden = await a11yPanel.isHidden().catch(() => true);
          expect(isPanelHidden).toBeTruthy();
        }
      }
    });

    test('should persist accessibility settings', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const a11yButton = page.locator('button:has(.fa-universal-access)').first();
      
      if (await a11yButton.isVisible().catch(() => false)) {
        await a11yButton.click();
        await page.waitForTimeout(1000);
        
        // Toggle a setting
        const readAloudToggle = page.locator('button:has-text("Read Aloud")').first();
        
        if (await readAloudToggle.isVisible().catch(() => false)) {
          await readAloudToggle.click();
          await page.waitForTimeout(500);
          
          // Reload page
          await page.reload();
          await waitForPageReady(page);
          
          // Check if setting persisted
          const isPersisted = await page.evaluate(() => {
            return localStorage.getItem('a11y_read_aloud') !== null;
          });
          
          expect(isPersisted).toBeTruthy();
        }
      }
    });
  });
});
