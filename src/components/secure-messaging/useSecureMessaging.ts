import { api } from '@/lib/api/client';
import { createEncryptedMessage, decryptMessage, EncryptedMessage } from '@/lib/encryption/crypto';
import { keyManager } from '@/lib/encryption/keyManager';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface MessageDisplay {
  id: string;
  content: string | null;
  sender: string;
  senderName?: string | null;
  timestamp: Date;
  isOutgoing: boolean;
  isEncrypted: boolean;
  isFailed?: boolean;
}

interface ExtendedEncryptedMessage extends EncryptedMessage {
  id?: string; // Optional ID from database
  senderProfile?: {
    name?: string | null;
    image?: string | null;
  };
}

export interface UseSecureMessagingReturn {
  messages: MessageDisplay[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  isLoading: boolean;
  isSending: boolean;
  encryptionReady: boolean;
  needsPassword: boolean;
  password: string;
  setPassword: (password: string) => void;
  sendMessage: () => Promise<void>;
  handlePasswordSubmit: (e: React.FormEvent) => Promise<void>;
  fetchMessages: () => Promise<void>;
}

export function useSecureMessaging(
  recipientId: string,
  recipientName = 'Recipient',
  onMessageSent?: () => void
): UseSecureMessagingReturn {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<MessageDisplay[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(null);
  const [encryptionReady, setEncryptionReady] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');

  // Fetch recipient's public key
  const fetchRecipientKey = useCallback(async () => {
    try {
      const response = await api.get<{ publicKey: string }>(`/users/${recipientId}/public-key`);
      if (response.publicKey) {
        setRecipientPublicKey(response.publicKey);

        // Store it locally for future use
        keyManager?.storePublicKeyForUser(recipientId, response.publicKey);
        return response.publicKey;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch recipient public key:', error);
      toast.error('Could not fetch encryption key for recipient');
      return null;
    }
  }, [recipientId]);

  // Check encryption readiness
  const checkEncryptionStatus = useCallback(async () => {
    if (!session?.user?.id) return false;

    // Initialize key manager if needed
    keyManager?.initialize(session.user.id as string);

    // Check if we have keys
    if (!keyManager?.hasKeys()) {
      setNeedsPassword(true);
      setEncryptionReady(false);
      return false;
    }

    // Check if we have encryption key in memory or session storage
    if (!keyManager.getEncryptionKey()) {
      setNeedsPassword(true);
      setEncryptionReady(false);
      return false;
    }

    // Check if we have recipient's public key
    let pubKey = keyManager.getPublicKeyForUser(recipientId);
    if (!pubKey) {
      // Try to fetch it
      pubKey = await fetchRecipientKey();
      if (!pubKey) {
        toast.error('Encryption not available', {
          description: 'Recipient has not set up encryption',
        });
        return false;
      }
    }

    setRecipientPublicKey(pubKey);
    setEncryptionReady(true);
    setNeedsPassword(false);
    return true;
  }, [session, recipientId, fetchRecipientKey]);

  // Decrypt incoming messages
  const decryptMessages = useCallback(
    (encryptedMessages: ExtendedEncryptedMessage[]) => {
      if (!keyManager?.hasKeys() || !keyManager.getSecretKey()) {
        return encryptedMessages.map(msg => ({
          id: msg.id || `temp-${Date.now()}`,
          content: null, // Can't decrypt without keys
          sender: msg.sender,
          timestamp: new Date(msg.timestamp),
          isOutgoing: msg.sender === session?.user?.id,
          isEncrypted: true,
          isFailed: false,
        }));
      }

      const secretKey = keyManager.getSecretKey()!;

      return encryptedMessages.map(msg => {
        let decrypted = null;
        let failed = false;

        try {
          decrypted = decryptMessage(msg, secretKey);
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          failed = true;
        }

        return {
          id: msg.id || `temp-${Date.now()}`,
          content: decrypted,
          sender: msg.sender,
          senderName: msg.senderProfile?.name,
          timestamp: new Date(msg.timestamp),
          isOutgoing: msg.sender === session?.user?.id,
          isEncrypted: true,
          isFailed: failed,
        };
      });
    },
    [session]
  );

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const response = await api.get<{ messages: ExtendedEncryptedMessage[] }>('/api/messages/secure', {
        cache: 'no-store',
      });

      // Filter messages to/from current recipient
      const relevantMessages = response.messages.filter(
        msg => msg.sender === recipientId || msg.recipient === recipientId
      );

      // Decrypt and format messages
      const displayMessages = decryptMessages(relevantMessages);
      setMessages(displayMessages as MessageDisplay[]);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [session, recipientId, decryptMessages]);

  // Initialize encryption and fetch messages
  useEffect(() => {
    if (session?.user?.id) {
      checkEncryptionStatus().then(ready => {
        if (ready) {
          fetchMessages();
        }
      });
    }
  }, [session, checkEncryptionStatus, fetchMessages]);

  // Handle password submission for key derivation
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !session?.user?.id) return;

    try {
      setIsLoading(true);

      // Set encryption key from password
      await keyManager?.setEncryptionKeyFromPassword(password);

      // Check encryption status again
      const ready = await checkEncryptionStatus();
      if (ready) {
        fetchMessages();
      }
    } catch (error) {
      console.error('Failed to derive key from password:', error);
      toast.error('Failed to set up encryption with password');
    } finally {
      setIsLoading(false);
      setPassword('');
    }
  };

  // Send encrypted message
  const sendMessage = async () => {
    if (!newMessage.trim() || !recipientPublicKey || !session?.user?.id) return;

    try {
      setIsSending(true);

      // Get sender keys
      const keys = keyManager?.getKeys();
      if (!keys || !keys.secretKey || !keys.publicKey) {
        throw new Error('Encryption keys not available');
      }

      // Create encrypted message
      const encMsg = createEncryptedMessage(
        newMessage,
        keys,
        recipientPublicKey,
        session.user.id as string,
        recipientId,
        { type: 'text' }
      );

      // Add optimistic message to UI
      const optimisticMsg: MessageDisplay = {
        id: `temp-${Date.now()}`,
        content: newMessage,
        sender: session.user.id as string,
        timestamp: new Date(),
        isOutgoing: true,
        isEncrypted: true,
      };

      setMessages(prev => [optimisticMsg, ...prev]);
      setNewMessage('');

      // Send to server
      await api.post('/api/messages/secure', {
        recipient: recipientId,
        encryptedMessage: encMsg,
      });

      // Notify parent component
      if (onMessageSent) onMessageSent();
    } catch (error) {
      console.error('Failed to send encrypted message:', error);
      toast.error('Failed to send encrypted message');

      // Update the optimistic message to show failure
      setMessages(prevMsgs =>
        prevMsgs.map(msg => (msg.id.startsWith('temp-') ? { ...msg, isFailed: true } : msg))
      );
    } finally {
      setIsSending(false);
    }
  };

  return {
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    isSending,
    encryptionReady,
    needsPassword,
    password,
    setPassword,
    sendMessage,
    handlePasswordSubmit,
    fetchMessages,
  };
} 