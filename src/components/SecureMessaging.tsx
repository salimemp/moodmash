import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { keyManager } from '@/lib/encryption/keyManager';
import { 
  createEncryptedMessage, 
  decryptMessage,
  EncryptedMessage
} from '@/lib/encryption/crypto';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button/button';
import { Loader2, Send, Lock, AlertCircle, User } from 'lucide-react';
import { toast } from 'sonner';

interface SecureMessagingProps {
  recipientId: string;
  recipientName?: string;
  onMessageSent?: () => void;
}

interface MessageDisplay {
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

const SecureMessaging: React.FC<SecureMessagingProps> = ({ 
  recipientId, 
  recipientName = 'Recipient',
  onMessageSent 
}) => {
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
          description: 'Recipient has not set up encryption'
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
  const decryptMessages = useCallback((encryptedMessages: ExtendedEncryptedMessage[]) => {
    if (!keyManager?.hasKeys() || !keyManager.getSecretKey()) {
      return encryptedMessages.map(msg => ({
        id: msg.id || `temp-${Date.now()}`,
        content: null, // Can't decrypt without keys
        sender: msg.sender,
        timestamp: new Date(msg.timestamp),
        isOutgoing: msg.sender === session?.user?.id,
        isEncrypted: true,
        isFailed: false
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
        isFailed: failed
      };
    });
  }, [session]);
  
  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      setIsLoading(true);
      const response = await api.get<{ messages: any[] }>('/api/messages/secure', {
        cache: 'no-store'
      });
      
      // Filter messages to/from current recipient
      const relevantMessages = response.messages.filter(
        msg => msg.sender === recipientId || msg.recipient === recipientId
      );
      
      // Decrypt and format messages
      const displayMessages = decryptMessages(relevantMessages);
      setMessages(displayMessages);
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
        isEncrypted: true
      };
      
      setMessages(prev => [optimisticMsg, ...prev]);
      setNewMessage('');
      
      // Send to server
      await api.post('/api/messages/secure', {
        recipient: recipientId,
        encryptedMessage: encMsg
      });
      
      // Notify parent component
      if (onMessageSent) onMessageSent();
      
    } catch (error) {
      console.error('Failed to send encrypted message:', error);
      toast.error('Failed to send encrypted message');
      
      // Update the optimistic message to show failure
      setMessages(prevMsgs => 
        prevMsgs.map(msg => 
          msg.id.startsWith('temp-') 
            ? { ...msg, isFailed: true } 
            : msg
        )
      );
    } finally {
      setIsSending(false);
    }
  };
  
  // Render password form if needed
  if (needsPassword) {
    return (
      <div className="p-4 border rounded-lg">
        <div className="mb-4 flex items-center text-amber-600 gap-2">
          <Lock className="h-5 w-5" />
          <h3 className="font-semibold">Encryption Setup Required</h3>
        </div>
        
        <p className="text-sm mb-4">
          Please enter your password to enable end-to-end encrypted messaging.
        </p>
        
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="text-sm font-medium block mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Unlock Encryption</>
            )}
          </Button>
        </form>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-500" />
          <span className="font-medium">{recipientName}</span>
        </div>
        
        <div className="flex items-center text-sm text-green-600 gap-1">
          <Lock className="h-4 w-4" />
          <span>End-to-End Encrypted</span>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col-reverse">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : messages.length > 0 ? (
          messages.map(message => (
            <div 
              key={message.id}
              className={`mb-3 max-w-[80%] ${message.isOutgoing ? 'ml-auto' : 'mr-auto'}`}
            >
              <div 
                className={`p-3 rounded-lg ${
                  message.isOutgoing 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                {message.content ? (
                  <p>{message.content}</p>
                ) : (
                  <div className="flex items-center gap-2 text-amber-500">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      {message.isFailed ? 'Failed to decrypt message' : 'Encrypted message'}
                    </span>
                  </div>
                )}
              </div>
              
              <div className={`text-xs mt-1 flex gap-2 ${message.isOutgoing ? 'text-right' : 'text-left'}`}>
                <time>{message.timestamp.toLocaleTimeString()}</time>
                {message.isEncrypted && (
                  <Lock className="h-3 w-3 text-green-600" />
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 mt-8">
            <Lock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No messages yet. Start a secure conversation!</p>
            <p className="text-sm mt-1">
              Messages are encrypted end-to-end and can only be read by you and {recipientName}.
            </p>
          </div>
        )}
      </div>
      
      {/* Composer */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a secure message..."
            className="flex-1 p-2 border rounded-lg"
            disabled={!encryptionReady || isSending}
          />
          
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || !encryptionReady || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {!encryptionReady && !needsPassword && (
          <div className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>
              Cannot send encrypted messages. {recipientName} has not set up encryption.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecureMessaging; 