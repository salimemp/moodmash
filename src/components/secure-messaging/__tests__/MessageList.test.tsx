import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MessageList from '../MessageList';
import { MessageDisplay } from '../useSecureMessaging';

describe('MessageList', () => {
  const mockMessages: MessageDisplay[] = [
    {
      id: 'msg1',
      content: 'Hello there!',
      sender: 'user1',
      senderName: 'User One',
      timestamp: new Date('2023-01-01T10:00:00'),
      isOutgoing: true,
      isEncrypted: true,
    },
    {
      id: 'msg2',
      content: 'Hi, how are you?',
      sender: 'user2',
      senderName: 'User Two',
      timestamp: new Date('2023-01-01T10:01:00'),
      isOutgoing: false,
      isEncrypted: true,
    },
    {
      id: 'msg3',
      content: null,
      sender: 'user2',
      senderName: 'User Two',
      timestamp: new Date('2023-01-01T10:02:00'),
      isOutgoing: false,
      isEncrypted: true,
      isFailed: true,
    },
  ];

  it('renders loading spinner when loading', () => {
    render(<MessageList messages={[]} isLoading={true} recipientName="Test User" />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders empty state when no messages', () => {
    render(<MessageList messages={[]} isLoading={false} recipientName="Test User" />);
    
    expect(screen.getByText('No messages yet. Start a secure conversation!')).toBeInTheDocument();
    expect(screen.getByText(/Messages are encrypted end-to-end/)).toBeInTheDocument();
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
  });

  it('renders messages correctly', () => {
    render(<MessageList messages={mockMessages} isLoading={false} recipientName="Test User" />);
    
    // Check that all messages are rendered
    expect(screen.getByTestId('message-msg1')).toBeInTheDocument();
    expect(screen.getByTestId('message-msg2')).toBeInTheDocument();
    expect(screen.getByTestId('message-msg3')).toBeInTheDocument();
    
    // Check message content
    expect(screen.getByText('Hello there!')).toBeInTheDocument();
    expect(screen.getByText('Hi, how are you?')).toBeInTheDocument();
    
    // Check failed message
    expect(screen.getByText('Failed to decrypt message')).toBeInTheDocument();
  });
}); 