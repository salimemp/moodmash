import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PasswordConfirmation from '../PasswordConfirmation';

describe('PasswordConfirmation', () => {
  const setConfirmPasswordMock = vi.fn();
  const password = 'validPassword123';
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('renders the password confirmation input field', () => {
    // Arrange & Act
    render(
      <PasswordConfirmation 
        password={password} 
        confirmPassword="" 
        setConfirmPassword={setConfirmPasswordMock} 
      />
    );
    
    // Assert
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Confirm your password/i)).toBeInTheDocument();
  });
  
  it('shows the current confirmPassword value', () => {
    // Arrange
    const confirmPassword = 'validPassword123';
    
    // Act
    render(
      <PasswordConfirmation 
        password={password} 
        confirmPassword={confirmPassword} 
        setConfirmPassword={setConfirmPasswordMock} 
      />
    );
    
    // Assert
    expect(screen.getByLabelText(/Confirm Password/i)).toHaveValue(confirmPassword);
  });
  
  it('calls setConfirmPassword when input value changes', () => {
    // Arrange
    render(
      <PasswordConfirmation 
        password={password} 
        confirmPassword="" 
        setConfirmPassword={setConfirmPasswordMock} 
      />
    );
    const input = screen.getByLabelText(/Confirm Password/i);
    const newConfirmPassword = 'newConfirmPassword123';
    
    // Act
    fireEvent.change(input, { target: { value: newConfirmPassword } });
    
    // Assert
    expect(setConfirmPasswordMock).toHaveBeenCalledWith(newConfirmPassword);
  });
  
  it('shows a warning when passwords do not match', () => {
    // Arrange
    const confirmPassword = 'differentPassword123';
    
    // Act
    render(
      <PasswordConfirmation 
        password={password} 
        confirmPassword={confirmPassword} 
        setConfirmPassword={setConfirmPasswordMock} 
      />
    );
    
    // Assert
    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
  });
  
  it('does not show a warning when passwords match', () => {
    // Arrange
    const confirmPassword = password; // Same as original password
    
    // Act
    render(
      <PasswordConfirmation 
        password={password} 
        confirmPassword={confirmPassword} 
        setConfirmPassword={setConfirmPasswordMock} 
      />
    );
    
    // Assert
    expect(screen.queryByText(/Passwords do not match/i)).not.toBeInTheDocument();
  });
  
  it('does not show a warning when confirmPassword is empty', () => {
    // Arrange & Act
    render(
      <PasswordConfirmation 
        password={password} 
        confirmPassword="" 
        setConfirmPassword={setConfirmPasswordMock} 
      />
    );
    
    // Assert
    expect(screen.queryByText(/Passwords do not match/i)).not.toBeInTheDocument();
  });
}); 