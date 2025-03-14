import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PasswordCreation from '../PasswordCreation';

describe('PasswordCreation', () => {
  const setPasswordMock = vi.fn();
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('renders the password input field', () => {
    // Arrange & Act
    render(<PasswordCreation password="" setPassword={setPasswordMock} />);
    
    // Assert
    expect(screen.getByLabelText(/Encryption Password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter a strong password/i)).toBeInTheDocument();
  });
  
  it('shows the current password value', () => {
    // Arrange
    const testPassword = 'testpassword123';
    
    // Act
    render(<PasswordCreation password={testPassword} setPassword={setPasswordMock} />);
    
    // Assert
    expect(screen.getByLabelText(/Encryption Password/i)).toHaveValue(testPassword);
  });
  
  it('calls setPassword when input value changes', () => {
    // Arrange
    render(<PasswordCreation password="" setPassword={setPasswordMock} />);
    const input = screen.getByLabelText(/Encryption Password/i);
    const newPassword = 'newpassword123';
    
    // Act
    fireEvent.change(input, { target: { value: newPassword } });
    
    // Assert
    expect(setPasswordMock).toHaveBeenCalledWith(newPassword);
  });
  
  it('shows a warning when password is too short', () => {
    // Arrange
    const shortPassword = 'short';
    
    // Act
    render(<PasswordCreation password={shortPassword} setPassword={setPasswordMock} />);
    
    // Assert
    expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
  });
  
  it('does not show a warning when password is valid', () => {
    // Arrange
    const validPassword = 'validPassword123';
    
    // Act
    render(<PasswordCreation password={validPassword} setPassword={setPasswordMock} />);
    
    // Assert
    expect(screen.queryByText(/Password must be at least 8 characters/i)).not.toBeInTheDocument();
  });
  
  it('does not show a warning when password is empty', () => {
    // Arrange & Act
    render(<PasswordCreation password="" setPassword={setPasswordMock} />);
    
    // Assert
    expect(screen.queryByText(/Password must be at least 8 characters/i)).not.toBeInTheDocument();
  });
}); 