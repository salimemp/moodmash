import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEncryptedPreferences } from '../useEncryptedPreferences';
import { useEncryptionSetup } from '../useEncryptionSetup';

// Mock dependencies
vi.mock('../useEncryptedPreferences', () => ({
  useEncryptedPreferences: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe('useEncryptionSetup', () => {
  const mockSetupEncryption = vi.fn();
  const onCompleteMock = vi.fn();
  
  // Helper function to create a renderHook wrapper with reset state
  const renderEncryptionSetupHook = (initialProps = {}) => {
    return renderHook(() => useEncryptionSetup(initialProps));
  };
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default mock implementation
    (useEncryptedPreferences as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isEncrypted: false,
      setupEncryption: mockSetupEncryption
    });
  });
  
  it('should initialize with intro step when not encrypted', () => {
    // Arrange
    (useEncryptedPreferences as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isEncrypted: false,
      setupEncryption: mockSetupEncryption
    });
    
    // Act
    const { result } = renderEncryptionSetupHook();
    
    // Assert
    expect(result.current.setupStep).toBe('intro');
    expect(result.current.isEncrypted).toBe(false);
  });
  
  it('should initialize with complete step when already encrypted', () => {
    // Arrange
    (useEncryptedPreferences as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isEncrypted: true,
      setupEncryption: mockSetupEncryption
    });
    
    // Act
    const { result } = renderEncryptionSetupHook();
    
    // Assert
    expect(result.current.setupStep).toBe('complete');
    expect(result.current.isEncrypted).toBe(true);
  });
  
  it('should move to password step when handleNextStep is called from intro', () => {
    // Arrange
    const { result } = renderEncryptionSetupHook();
    
    // Act
    act(() => {
      result.current.handleNextStep();
    });
    
    // Assert
    expect(result.current.setupStep).toBe('password');
  });
  
  it('should show error when password is too short', () => {
    // Arrange
    const { result } = renderEncryptionSetupHook();
    
    // Act - move to password step and set short password
    act(() => {
      result.current.handleNextStep();
    });
    
    act(() => {
      result.current.setPassword('short');
    });
    
    act(() => {
      result.current.handleNextStep();
    });
    
    // Assert
    expect(result.current.error).toBe('Password must be at least 8 characters long');
    expect(result.current.setupStep).toBe('password'); // Should remain on password step
  });
  
  it('should move to confirm step when password is valid', () => {
    // Arrange
    const { result } = renderEncryptionSetupHook();
    
    // Act - move to password step and set valid password
    act(() => {
      result.current.handleNextStep();
    });
    
    act(() => {
      result.current.setPassword('validpassword');
    });
    
    act(() => {
      result.current.handleNextStep();
    });
    
    // Assert
    expect(result.current.error).toBeNull();
    expect(result.current.setupStep).toBe('confirm');
  });
  
  it('should show error when passwords do not match', () => {
    // Arrange - prepare a fresh hook
    const { result } = renderEncryptionSetupHook();
    
    // Act - move through steps with non-matching passwords
    act(() => {
      result.current.handleNextStep(); // Move to password
    });
    
    act(() => {
      result.current.setPassword('validpassword');
    });
    
    act(() => {
      result.current.handleNextStep(); // Move to confirm
    });
    
    act(() => {
      result.current.setConfirmPassword('differentpassword');
    });
    
    act(() => {
      result.current.handleNextStep(); // Try to complete
    });
    
    // Assert
    expect(result.current.error).toBe('Passwords do not match');
    expect(result.current.setupStep).toBe('confirm'); // Should remain on confirm
  });
  
  it('should call setupEncryption when passwords match', async () => {
    // Arrange
    mockSetupEncryption.mockResolvedValue(true);
    const { result } = renderEncryptionSetupHook({ onComplete: onCompleteMock });
    
    // Act - move through steps with matching passwords
    act(() => {
      result.current.handleNextStep(); // Move to password
    });
    
    act(() => {
      result.current.setPassword('validpassword');
    });
    
    act(() => {
      result.current.handleNextStep(); // Move to confirm
    });
    
    act(() => {
      result.current.setConfirmPassword('validpassword');
    });
    
    // Complete the setup
    await act(async () => {
      await result.current.handleNextStep();
    });
    
    // Assert
    expect(mockSetupEncryption).toHaveBeenCalledWith('validpassword');
    expect(result.current.setupStep).toBe('complete');
    expect(toast.success).toHaveBeenCalledWith('End-to-end encryption set up successfully');
    expect(onCompleteMock).toHaveBeenCalled();
  });
  
  it('should show error when encryption setup fails', async () => {
    // Arrange
    mockSetupEncryption.mockResolvedValue(false);
    const { result } = renderEncryptionSetupHook();
    
    // Act - move through steps with matching passwords
    act(() => {
      result.current.handleNextStep(); // Move to password
    });
    
    act(() => {
      result.current.setPassword('validpassword');
    });
    
    act(() => {
      result.current.handleNextStep(); // Move to confirm
    });
    
    act(() => {
      result.current.setConfirmPassword('validpassword');
    });
    
    // Try to complete the setup
    await act(async () => {
      await result.current.handleNextStep();
    });
    
    // Assert
    expect(mockSetupEncryption).toHaveBeenCalledWith('validpassword');
    expect(result.current.error).toBe('Failed to set up encryption. Please try again.');
    expect(result.current.setupStep).toBe('confirm'); // Should remain on confirm
  });
  
  it('should allow going back from confirm to password step', () => {
    // Arrange
    const { result } = renderEncryptionSetupHook();
    
    // Act - move to confirm and then back
    act(() => {
      result.current.handleNextStep(); // Move to password
    });
    
    act(() => {
      result.current.setPassword('validpassword');
    });
    
    act(() => {
      result.current.handleNextStep(); // Move to confirm
    });
    
    act(() => {
      result.current.handlePrevStep(); // Go back to password
    });
    
    // Assert
    expect(result.current.setupStep).toBe('password');
  });
  
  it('should allow going back from password to intro step', () => {
    // Arrange
    const { result } = renderEncryptionSetupHook();
    
    // Act - move to password and then back
    act(() => {
      result.current.handleNextStep(); // Move to password
    });
    
    act(() => {
      result.current.handlePrevStep(); // Go back to intro
    });
    
    // Assert
    expect(result.current.setupStep).toBe('intro');
  });
}); 