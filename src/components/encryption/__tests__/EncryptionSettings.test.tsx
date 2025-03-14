import { useEncryptionSetup } from '@/lib/hooks/useEncryptionSetup';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EncryptionSettings from '../../EncryptionSettings';

// Mock the custom hook
vi.mock('@/lib/hooks/useEncryptionSetup', () => ({
  useEncryptionSetup: vi.fn(),
}));

// Mock the child components
vi.mock('../EncryptionIntro', () => ({
  default: () => <div data-testid="encryption-intro-mock">Encryption Intro Mock</div>
}));

vi.mock('../PasswordCreation', () => ({
  default: ({ password, setPassword }: { password: string; setPassword: (p: string) => void }) => (
    <div data-testid="password-creation-mock">
      Password Creation Mock
      <input 
        data-testid="password-input-mock" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />
    </div>
  )
}));

vi.mock('../PasswordConfirmation', () => ({
  default: ({ confirmPassword, setConfirmPassword }: { confirmPassword: string; setConfirmPassword: (p: string) => void }) => (
    <div data-testid="password-confirmation-mock">
      Password Confirmation Mock
      <input 
        data-testid="confirm-password-input-mock" 
        value={confirmPassword} 
        onChange={(e) => setConfirmPassword(e.target.value)} 
      />
    </div>
  )
}));

vi.mock('../EncryptionComplete', () => ({
  default: () => <div data-testid="encryption-complete-mock">Encryption Complete Mock</div>
}));

vi.mock('../ErrorDisplay', () => ({
  default: ({ error }: { error: string | null }) => (
    error ? <div data-testid="error-display-mock">{error}</div> : null
  )
}));

describe('EncryptionSettings', () => {
  const mockOnComplete = vi.fn();
  
  // Mock implementation for the useEncryptionSetup hook
  const mockUseEncryptionSetup = {
    setupStep: 'intro',
    password: '',
    setPassword: vi.fn(),
    confirmPassword: '',
    setConfirmPassword: vi.fn(),
    isLoading: false,
    error: null,
    isEncrypted: false,
    handleNextStep: vi.fn(),
    handlePrevStep: vi.fn(),
    handleSetupEncryption: vi.fn()
  };
  
  beforeEach(() => {
    vi.resetAllMocks();
    (useEncryptionSetup as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockUseEncryptionSetup);
  });

  it('renders the encryption intro component when on intro step', () => {
    // Arrange
    (useEncryptionSetup as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockUseEncryptionSetup,
      setupStep: 'intro'
    });
    
    // Act
    render(<EncryptionSettings onComplete={mockOnComplete} />);
    
    // Assert
    expect(screen.getByTestId('encryption-intro-mock')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });
  
  it('renders the password creation component when on password step', () => {
    // Arrange
    (useEncryptionSetup as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockUseEncryptionSetup,
      setupStep: 'password'
    });
    
    // Act
    render(<EncryptionSettings onComplete={mockOnComplete} />);
    
    // Assert
    expect(screen.getByTestId('password-creation-mock')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
  });
  
  it('renders the password confirmation component when on confirm step', () => {
    // Arrange
    (useEncryptionSetup as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockUseEncryptionSetup,
      setupStep: 'confirm'
    });
    
    // Act
    render(<EncryptionSettings onComplete={mockOnComplete} />);
    
    // Assert
    expect(screen.getByTestId('password-confirmation-mock')).toBeInTheDocument();
    expect(screen.getByText('Set Up Encryption')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
  });
  
  it('renders the encryption complete component when on complete step', () => {
    // Arrange
    (useEncryptionSetup as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockUseEncryptionSetup,
      setupStep: 'complete'
    });
    
    // Act
    render(<EncryptionSettings onComplete={mockOnComplete} />);
    
    // Assert
    expect(screen.getByTestId('encryption-complete-mock')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });
  
  it('displays an error message when there is an error', () => {
    // Arrange
    const errorMessage = 'Test error message';
    (useEncryptionSetup as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockUseEncryptionSetup,
      error: errorMessage
    });
    
    // Act
    render(<EncryptionSettings onComplete={mockOnComplete} />);
    
    // Assert
    expect(screen.getByTestId('error-display-mock')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
  
  it('calls handleNextStep when Next button is clicked', () => {
    // Arrange
    const mockHandleNextStep = vi.fn();
    (useEncryptionSetup as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockUseEncryptionSetup,
      handleNextStep: mockHandleNextStep
    });
    
    // Act
    render(<EncryptionSettings onComplete={mockOnComplete} />);
    fireEvent.click(screen.getByText('Next'));
    
    // Assert
    expect(mockHandleNextStep).toHaveBeenCalledTimes(1);
  });
  
  it('calls handlePrevStep when Back button is clicked', () => {
    // Arrange
    const mockHandlePrevStep = vi.fn();
    (useEncryptionSetup as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockUseEncryptionSetup,
      setupStep: 'password',
      handlePrevStep: mockHandlePrevStep
    });
    
    // Act
    render(<EncryptionSettings onComplete={mockOnComplete} />);
    fireEvent.click(screen.getByText('Back'));
    
    // Assert
    expect(mockHandlePrevStep).toHaveBeenCalledTimes(1);
  });
  
  it('calls onComplete when Done button is clicked on complete step', () => {
    // Arrange
    (useEncryptionSetup as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockUseEncryptionSetup,
      setupStep: 'complete'
    });
    
    // Act
    render(<EncryptionSettings onComplete={mockOnComplete} />);
    fireEvent.click(screen.getByText('Done'));
    
    // Assert
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });
  
  it('shows loading state when isLoading is true', () => {
    // Arrange
    (useEncryptionSetup as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockUseEncryptionSetup,
      setupStep: 'confirm',
      isLoading: true
    });
    
    // Act
    render(<EncryptionSettings onComplete={mockOnComplete} />);
    
    // Assert
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });
  
  it('disables the Next button when on password step with invalid password', () => {
    // Arrange
    (useEncryptionSetup as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockUseEncryptionSetup,
      setupStep: 'password',
      password: 'short' // invalid password (< 8 chars)
    });
    
    // Act
    render(<EncryptionSettings onComplete={mockOnComplete} />);
    
    // Assert
    expect(screen.getByText('Next')).toBeDisabled();
  });
}); 