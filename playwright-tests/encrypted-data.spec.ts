import { expect, test } from './fixtures/encryption-fixtures';

test.describe('Encrypted Data Access', () => {
  test('should request password when accessing encrypted data with a new session', async ({ page }) => {
    // Sign in with a user that has encryption enabled
    await page.goto('/signin');
    await page.getByLabel('Email').fill('encrypted@example.com');
    await page.getByLabel('Password').fill('SecurePassword456!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Navigate to a page that requires encrypted data
    await page.goto('/dashboard');
    
    // Check that we're prompted for encryption password
    await expect(page.getByText('Enter your encryption password')).toBeVisible();
    
    // Enter the encryption password
    await page.getByLabel('Encryption Password').fill('SecurePassword123!');
    await page.getByRole('button', { name: 'Unlock' }).click();
    
    // Verify we can now access the encrypted data
    await expect(page.getByText('Your encrypted data')).toBeVisible();
  });
  
  test('should retain encryption unlock status during the session', async ({ page }) => {
    // Sign in and unlock encryption
    await page.goto('/signin');
    await page.getByLabel('Email').fill('encrypted@example.com');
    await page.getByLabel('Password').fill('SecurePassword456!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Handle encryption password prompt
    await expect(page.getByText('Enter your encryption password')).toBeVisible();
    await page.getByLabel('Encryption Password').fill('SecurePassword123!');
    await page.getByRole('button', { name: 'Unlock' }).click();
    
    // Navigate to different pages and verify we don't need to re-enter password
    await page.goto('/settings');
    await page.goto('/dashboard');
    
    // Should not see the encryption password prompt again
    await expect(page.getByText('Enter your encryption password')).not.toBeVisible();
    
    // Should see encrypted data
    await expect(page.getByText('Your encrypted data')).toBeVisible();
  });
  
  test('using encryptedUserPage fixture should have encryption already set up', async ({ encryptedUserPage }) => {
    // The fixture has logged us in with an encrypted user and navigated to encryption settings
    
    // We should see that encryption is already enabled
    await expect(encryptedUserPage.getByText('Encryption is active')).toBeVisible();
    
    // We should see options to manage encryption
    await expect(encryptedUserPage.getByRole('button', { name: 'Change Password' })).toBeVisible();
  });
  
  test('encrypting and decrypting data should work correctly', async ({ encryptionReadyPage }) => {
    // The fixture has logged us in and navigated to encryption settings
    // where encryption is not yet set up
    
    // Complete the encryption setup flow
    await encryptionReadyPage.getByRole('button', { name: 'Next' }).click();
    await encryptionReadyPage.getByLabel('Encryption Password').fill('TestEncryption123!');
    await encryptionReadyPage.getByRole('button', { name: 'Next' }).click();
    await encryptionReadyPage.getByLabel('Confirm Password').fill('TestEncryption123!');
    await encryptionReadyPage.getByRole('button', { name: 'Enable Encryption' }).click();
    
    // Verify encryption is now active
    await expect(encryptionReadyPage.getByText('Encryption is active')).toBeVisible();
    
    // Navigate to a page where we can test encrypted data
    await encryptionReadyPage.goto('/dashboard');
    
    // Create a new encrypted note
    await encryptionReadyPage.getByRole('button', { name: 'New Encrypted Note' }).click();
    await encryptionReadyPage.getByLabel('Note Title').fill('Secret Test Note');
    await encryptionReadyPage.getByLabel('Note Content').fill('This is encrypted content that should be secure.');
    await encryptionReadyPage.getByRole('button', { name: 'Save' }).click();
    
    // Verify note was saved
    await expect(encryptionReadyPage.getByText('Note saved successfully')).toBeVisible();
    
    // Verify the note appears in the list
    await expect(encryptionReadyPage.getByText('Secret Test Note')).toBeVisible();
  });
}); 