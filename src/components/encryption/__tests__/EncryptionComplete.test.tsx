import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EncryptionComplete from '../EncryptionComplete';

describe('EncryptionComplete', () => {
  it('renders the success message with checkmark icon', () => {
    // Arrange & Act
    render(<EncryptionComplete />);
    
    // Assert
    expect(screen.getByText(/Encryption is active/i)).toBeInTheDocument();
  });
  
  it('displays the completion explanation text', () => {
    // Arrange & Act
    render(<EncryptionComplete />);
    
    // Assert
    expect(screen.getByText(/Your data is now protected with end-to-end encryption/i)).toBeInTheDocument();
    expect(screen.getByText(/When you sign in on a new device, you'll need to enter your encryption password/i)).toBeInTheDocument();
  });
  
  it('shows an encrypted data section', () => {
    // Arrange & Act
    render(<EncryptionComplete />);
    
    // Assert
    expect(screen.getByText(/Encrypted Data/i)).toBeInTheDocument();
  });
  
  it('lists the types of encrypted data', () => {
    // Arrange & Act
    render(<EncryptionComplete />);
    
    // Assert
    expect(screen.getByText(/User preferences/i)).toBeInTheDocument();
    expect(screen.getByText(/Private messages/i)).toBeInTheDocument();
    expect(screen.getByText(/Security settings/i)).toBeInTheDocument();
  });
  
  it('applies the correct styling to the info box', () => {
    // Arrange & Act
    const { container } = render(<EncryptionComplete />);
    
    // Assert
    const infoBox = container.querySelector('.rounded-lg');
    expect(infoBox).toBeInTheDocument();
    expect(infoBox).toHaveClass('bg-blue-50');
    expect(infoBox).toHaveClass('border-blue-200');
  });
  
  it('uses the correct color for the success text', () => {
    // Arrange & Act
    render(<EncryptionComplete />);
    
    // Assert
    const successElement = screen.getByText(/Encryption is active/i).parentElement;
    expect(successElement).toHaveClass('text-green-600');
  });
}); 