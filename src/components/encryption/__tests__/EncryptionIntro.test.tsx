import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EncryptionIntro from '../EncryptionIntro';

describe('EncryptionIntro', () => {
  it('renders the main explanation text', () => {
    // Arrange & Act
    render(<EncryptionIntro />);
    
    // Assert
    expect(screen.getByText(/End-to-end encryption ensures that your sensitive data can only be read by you/i)).toBeInTheDocument();
    expect(screen.getByText(/Even we cannot access your encrypted data/i)).toBeInTheDocument();
  });
  
  it('displays the Important section with warning icon', () => {
    // Arrange & Act
    render(<EncryptionIntro />);
    
    // Assert
    expect(screen.getByText(/Important/i)).toBeInTheDocument();
  });
  
  it('shows key security information points', () => {
    // Arrange & Act
    render(<EncryptionIntro />);
    
    // Assert
    expect(screen.getByText(/Your password is used to generate encryption keys/i)).toBeInTheDocument();
    expect(screen.getByText(/We cannot recover your data if you forget your password/i)).toBeInTheDocument();
    expect(screen.getByText(/You'll need to enter your password on new devices/i)).toBeInTheDocument();
  });
  
  it('applies the correct styling to the warning box', () => {
    // Arrange & Act
    const { container } = render(<EncryptionIntro />);
    
    // Assert
    const warningBox = container.querySelector('.rounded-lg');
    expect(warningBox).toBeInTheDocument();
    expect(warningBox).toHaveClass('bg-amber-50');
    expect(warningBox).toHaveClass('border-amber-200');
  });
}); 