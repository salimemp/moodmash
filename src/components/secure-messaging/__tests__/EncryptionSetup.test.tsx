import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EncryptionSetup from '../EncryptionSetup';

describe('EncryptionSetup', () => {
  const mockSetPassword = vi.fn();
  const mockOnSubmit = vi.fn(e => e.preventDefault());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders encryption setup form', () => {
    render(
      <EncryptionSetup
        isLoading={false}
        password=""
        setPassword={mockSetPassword}
        onSubmit={mockOnSubmit}
      />
    );

    // Check that the form elements are rendered
    expect(screen.getByText('Encryption Setup Required')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByTestId('encryption-unlock-button')).toBeInTheDocument();
    expect(screen.getByText('Unlock Encryption')).toBeInTheDocument();
  });

  it('updates password when typing', () => {
    render(
      <EncryptionSetup
        isLoading={false}
        password=""
        setPassword={mockSetPassword}
        onSubmit={mockOnSubmit}
      />
    );

    const input = screen.getByTestId('encryption-password-input');
    fireEvent.change(input, { target: { value: 'test-password' } });

    expect(mockSetPassword).toHaveBeenCalledWith('test-password');
  });

  it('calls onSubmit when form is submitted', () => {
    render(
      <EncryptionSetup
        isLoading={false}
        password="test-password"
        setPassword={mockSetPassword}
        onSubmit={mockOnSubmit}
      />
    );

    // Find the form element and simulate a submit event
    const form = screen.getByRole('form');
    fireEvent.submit(form);

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('disables button when loading', () => {
    render(
      <EncryptionSetup
        isLoading={true}
        password="test-password"
        setPassword={mockSetPassword}
        onSubmit={mockOnSubmit}
      />
    );

    const button = screen.getByTestId('encryption-unlock-button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });
}); 