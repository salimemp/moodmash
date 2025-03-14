import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EncryptionComplete from '../EncryptionComplete';
import EncryptionIntro from '../EncryptionIntro';
import ErrorDisplay from '../ErrorDisplay';
import PasswordConfirmation from '../PasswordConfirmation';
import PasswordCreation from '../PasswordCreation';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('Encryption Setup Integration Flow', () => {
  // Test the individual steps and transitions in isolation
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Step 1: Introduction', () => {
    it('renders the introduction screen with important information', () => {
      // Render the intro component
      render(<EncryptionIntro />);
      
      // Verify key elements are present
      expect(screen.getByText(/End-to-end encryption ensures/i)).toBeInTheDocument();
      expect(screen.getByText(/Important/i)).toBeInTheDocument();
      expect(screen.getByText(/We cannot recover your data if you forget your password/i)).toBeInTheDocument();
    });
  });

  describe('Step 2: Password Creation', () => {
    const setPasswordMock = vi.fn();
    
    it('allows creating a valid password', () => {
      // Render the password creation component
      render(
        <PasswordCreation 
          password="" 
          setPassword={setPasswordMock} 
        />
      );
      
      // Enter a valid password
      const passwordInput = screen.getByLabelText(/Password/i);
      fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
      
      // Verify the password was set
      expect(setPasswordMock).toHaveBeenCalledWith('StrongPassword123!');
    });
    
    it('displays validation errors for weak passwords', () => {
      // Render with short password
      render(
        <PasswordCreation 
          password="weak" 
          setPassword={setPasswordMock} 
        />
      );
      
      // Check for validation error
      expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  describe('Step 3: Password Confirmation', () => {
    const setConfirmPasswordMock = vi.fn();
    
    it('shows a match error when passwords do not match', () => {
      // Render with mismatched passwords
      render(
        <PasswordConfirmation 
          password="StrongPassword123!" 
          confirmPassword="DifferentPassword123!" 
          setConfirmPassword={setConfirmPasswordMock} 
        />
      );
      
      // Check for mismatch error
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
    
    it('allows setting a matching password', () => {
      // Render with matching passwords
      render(
        <PasswordConfirmation 
          password="StrongPassword123!" 
          confirmPassword="StrongPassword123!" 
          setConfirmPassword={setConfirmPasswordMock} 
        />
      );
      
      // Verify no error is shown
      expect(screen.queryByText(/Passwords do not match/i)).not.toBeInTheDocument();
    });
  });

  describe('Step 4: Error Handling', () => {
    it('displays error messages', () => {
      const errorMessage = 'Failed to set up encryption';
      
      // Render error component
      render(
        <ErrorDisplay 
          error={errorMessage} 
        />
      );
      
      // Verify error display
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Step 5: Completion', () => {
    it('shows the completion screen with success message', () => {
      // Render completion component
      render(<EncryptionComplete />);
      
      // Verify success messages
      expect(screen.getByText(/Encryption is active/i)).toBeInTheDocument();
      expect(screen.getByText(/Your data is now protected/i)).toBeInTheDocument();
      expect(screen.getByText(/Encrypted Data/i)).toBeInTheDocument();
    });
  });

  // Test user flow simulation (without actual state management)
  describe('User Flow Simulation', () => {
    it('simulates a complete encryption setup flow', () => {
      // Step 1: Start with intro
      const { unmount } = render(<EncryptionIntro />);
      expect(screen.getByText(/End-to-end encryption ensures/i)).toBeInTheDocument();
      unmount();
      
      // Step 2: Create password
      const setPasswordMock = vi.fn();
      const { unmount: unmountStep2 } = render(
        <PasswordCreation 
          password="StrongPassword123!" 
          setPassword={setPasswordMock} 
        />
      );
      expect(screen.getByText(/Create a strong password to protect your encryption keys/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Encryption Password/i)).toBeInTheDocument();
      unmountStep2();
      
      // Step 3: Confirm password
      const setConfirmPasswordMock = vi.fn();
      const { unmount: unmountStep3 } = render(
        <PasswordConfirmation 
          password="StrongPassword123!" 
          confirmPassword="StrongPassword123!" 
          setConfirmPassword={setConfirmPasswordMock} 
        />
      );
      expect(screen.getByText(/Confirm Password/i)).toBeInTheDocument();
      unmountStep3();
      
      // Step 4: Show completion
      render(<EncryptionComplete />);
      expect(screen.getByText(/Encryption is active/i)).toBeInTheDocument();
      expect(screen.getByText(/Your data is now protected/i)).toBeInTheDocument();
    });
  });
}); 