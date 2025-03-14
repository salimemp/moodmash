import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock the modules - must be before imports
vi.mock('@/lib/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/lib/encryption/crypto', () => ({
  createEncryptedMessage: vi.fn(),
  decryptMessage: vi.fn(),
}));

vi.mock('@/lib/encryption/keyManager', () => ({
  keyManager: {
    initialize: vi.fn(),
    hasKeys: vi.fn(),
    getEncryptionKey: vi.fn(),
    setEncryptionKeyFromPassword: vi.fn(),
    getPublicKeyForUser: vi.fn(),
    storePublicKeyForUser: vi.fn(),
    getKeys: vi.fn(),
    getSecretKey: vi.fn(),
  },
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Import the hook after mocking dependencies
import { useSecureMessaging } from '../useSecureMessaging';

describe('useSecureMessaging', () => {
  it('initializes with default values when not authenticated', () => {
    const { result } = renderHook(() => useSecureMessaging('recipient123', 'Recipient Name'));
    
    // Check basic properties
    expect(result.current).toHaveProperty('messages');
    expect(result.current).toHaveProperty('newMessage');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isSending');
    expect(result.current).toHaveProperty('encryptionReady');
    expect(result.current).toHaveProperty('needsPassword');
    
    // Check initial values
    expect(result.current.messages).toEqual([]);
    expect(result.current.newMessage).toBe('');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSending).toBe(false);
    expect(result.current.encryptionReady).toBe(false);
    expect(result.current.needsPassword).toBe(false);
  });
}); 