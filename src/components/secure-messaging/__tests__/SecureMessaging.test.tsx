import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SecureMessaging from '../SecureMessaging';
import { useSecureMessaging } from '../useSecureMessaging';

// Mock the hook
vi.mock('../useSecureMessaging', () => ({
  useSecureMessaging: vi.fn(),
}));

// Mock child components
vi.mock('../EncryptionSetup', () => ({
  default: ({ isLoading, password, setPassword, onSubmit }: any) => (
    <div data-testid="encryption-setup-mock">
      <span>Mock Encryption Setup</span>
      <button onClick={onSubmit}>Submit</button>
    </div>
  ),
}));

vi.mock('../MessageList', () => ({
  default: ({ messages, isLoading, recipientName }: any) => (
    <div data-testid="message-list-mock">
      <span>Mock Message List</span>
      <span>Messages: {messages.length}</span>
    </div>
  ),
}));

vi.mock('../MessageComposer', () => ({
  default: ({ message, setMessage, onSend, isEncryptionReady, isSending, recipientName }: any) => (
    <div data-testid="message-composer-mock">
      <span>Mock Message Composer</span>
      <button onClick={onSend}>Send</button>
    </div>
  ),
}));

describe('SecureMessaging', () => {
  // Default mock state
  const defaultMockHookReturn = {
    messages: [],
    newMessage: '',
    setNewMessage: vi.fn(),
    isLoading: false,
    isSending: false,
    encryptionReady: true,
    needsPassword: false,
    password: '',
    setPassword: vi.fn(),
    sendMessage: vi.fn(),
    handlePasswordSubmit: vi.fn(),
    fetchMessages: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSecureMessaging as any).mockReturnValue(defaultMockHookReturn);
  });

  it('renders encryption setup when password is needed', () => {
    (useSecureMessaging as any).mockReturnValue({
      ...defaultMockHookReturn,
      needsPassword: true,
    });

    render(<SecureMessaging recipientId="recipient123" />);
    
    expect(screen.getByTestId('encryption-setup-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('message-list-mock')).not.toBeInTheDocument();
    expect(screen.queryByTestId('message-composer-mock')).not.toBeInTheDocument();
  });

  it('renders the messaging UI when encryption is ready', () => {
    render(<SecureMessaging recipientId="recipient123" recipientName="Test User" />);
    
    expect(screen.queryByTestId('encryption-setup-mock')).not.toBeInTheDocument();
    expect(screen.getByTestId('message-list-mock')).toBeInTheDocument();
    expect(screen.getByTestId('message-composer-mock')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('End-to-End Encrypted')).toBeInTheDocument();
  });

  it('passes correct props to child components', () => {
    const mockMessages = [{ id: '1', content: 'test', sender: 'user', timestamp: new Date(), isOutgoing: true, isEncrypted: true }];
    
    (useSecureMessaging as any).mockReturnValue({
      ...defaultMockHookReturn,
      messages: mockMessages,
      isLoading: true,
      isSending: true,
    });
    
    render(<SecureMessaging recipientId="recipient123" recipientName="Test User" />);
    
    expect(screen.getByText('Messages: 1')).toBeInTheDocument();
  });
}); 