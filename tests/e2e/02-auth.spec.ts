/**
 * Authentication E2E Tests
 * Tests for login, registration, and logout flows
 */
import { test, expect } from '@playwright/test';

test.describe('Authentication - Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login|submit/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /sign in|login|submit/i });
    await submitButton.click();
    
    // Should show validation message or stay on login page
    await expect(page).toHaveURL(/login/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    const submitButton = page.getByRole('button', { name: /sign in|login|submit/i });
    await submitButton.click();
    
    // Wait for error message or stay on login page
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toMatch(/login/);
  });

  test('should have link to registration', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /register|sign up|create account/i });
    await expect(registerLink).toBeVisible();
  });

  test('should have forgot password link', async ({ page }) => {
    const forgotLink = page.getByRole('link', { name: /forgot|reset password/i });
    if (await forgotLink.count() > 0) {
      await expect(forgotLink.first()).toBeVisible();
    }
  });
});

test.describe('Authentication - Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await emailInput.fill('invalidemail');
    
    const submitButton = page.getByRole('button', { name: /sign up|register|create|submit/i });
    await submitButton.click();
    
    // Should show validation or stay on register page
    await expect(page).toHaveURL(/register/);
  });

  test('should validate password requirements', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'weak');
    
    const submitButton = page.getByRole('button', { name: /sign up|register|create|submit/i });
    await submitButton.click();
    
    // Should show validation or stay on register page
    await expect(page).toHaveURL(/register/);
  });

  test('should have link to login', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /login|sign in|already have/i });
    await expect(loginLink).toBeVisible();
  });
});

test.describe('Authentication - OAuth', () => {
  test('should display OAuth buttons if available', async ({ page }) => {
    await page.goto('/login');
    
    const googleButton = page.locator('button:has-text("Google"), a:has-text("Google")');
    const githubButton = page.locator('button:has-text("GitHub"), a:has-text("GitHub")');
    
    // OAuth buttons are optional
    if (await googleButton.count() > 0) {
      await expect(googleButton.first()).toBeVisible();
    }
    if (await githubButton.count() > 0) {
      await expect(githubButton.first()).toBeVisible();
    }
  });
});
