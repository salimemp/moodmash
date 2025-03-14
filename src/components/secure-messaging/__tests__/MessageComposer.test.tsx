import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MessageComposer from '../MessageComposer';

describe('MessageComposer', () => {
  const mockSetMessage = vi.fn();
  const mockOnSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the message input and send button', () => {
    render(
      <MessageComposer
        message=""
        setMessage={mockSetMessage}
        onSend={mockOnSend}
        isEncryptionReady={true}
        isSending={false}
        recipientName="Test User"
      />
    );

    expect(screen.getByTestId('message-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-message-button')).toBeInTheDocument();
  });

  it('updates message when typing', () => {
    render(
      <MessageComposer
        message=""
        setMessage={mockSetMessage}
        onSend={mockOnSend}
        isEncryptionReady={true}
        isSending={false}
        recipientName="Test User"
      />
    );

    const input = screen.getByTestId('message-input');
    fireEvent.change(input, { target: { value: 'Hello world' } });

    expect(mockSetMessage).toHaveBeenCalledWith('Hello world');
  });

  it('calls onSend when button is clicked with non-empty message', () => {
    render(
      <MessageComposer
        message="Hello world"
        setMessage={mockSetMessage}
        onSend={mockOnSend}
        isEncryptionReady={true}
        isSending={false}
        recipientName="Test User"
      />
    );

    const button = screen.getByTestId('send-message-button');
    fireEvent.click(button);

    expect(mockOnSend).toHaveBeenCalled();
  });

  it('disables input and button when encryption is not ready', () => {
    render(
      <MessageComposer
        message="Hello world"
        setMessage={mockSetMessage}
        onSend={mockOnSend}
        isEncryptionReady={false}
        isSending={false}
        recipientName="Test User"
      />
    );

    const input = screen.getByTestId('message-input');
    const button = screen.getByTestId('send-message-button');

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
    expect(screen.getByTestId('encryption-warning')).toBeInTheDocument();
  });

  it('disables input and button when sending', () => {
    render(
      <MessageComposer
        message="Hello world"
        setMessage={mockSetMessage}
        onSend={mockOnSend}
        isEncryptionReady={true}
        isSending={true}
        recipientName="Test User"
      />
    );

    const input = screen.getByTestId('message-input');
    const button = screen.getByTestId('send-message-button');

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });
}); 