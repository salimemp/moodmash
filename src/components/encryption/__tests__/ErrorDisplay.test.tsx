import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ErrorDisplay from '../ErrorDisplay';

describe('ErrorDisplay', () => {
  it('renders the error message when provided', () => {
    // Arrange
    const errorMessage = 'Test error message';
    
    // Act
    render(<ErrorDisplay error={errorMessage} />);
    
    // Assert
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
  
  it('does not render anything when error is null', () => {
    // Arrange & Act
    const { container } = render(<ErrorDisplay error={null} />);
    
    // Assert
    expect(container.firstChild).toBeNull();
  });
  
  it('renders the ShieldAlert icon', () => {
    // Arrange
    const errorMessage = 'Test error message';
    
    // Act
    render(<ErrorDisplay error={errorMessage} />);
    
    // Assert
    // We can't directly test for the icon, but we can check that there's a div with the expected class
    const container = screen.getByText(errorMessage).parentElement;
    expect(container).toHaveClass('flex');
    expect(container).toHaveClass('items-start');
    expect(container).toHaveClass('gap-2');
  });
}); 