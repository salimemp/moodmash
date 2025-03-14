import { Lock, User } from 'lucide-react';
import React from 'react';
import EncryptionSetup from './EncryptionSetup';
import MessageComposer from './MessageComposer';
import MessageList from './MessageList';
import { useSecureMessaging } from './useSecureMessaging';

interface SecureMessagingProps {
  recipientId: string;
  recipientName?: string;
  onMessageSent?: () => void;
}

/**
 * Main component for secure messaging functionality
 * Composes smaller components for better maintainability
 */
const SecureMessaging: React.FC<SecureMessagingProps> = ({
  recipientId,
  recipientName = 'Recipient',
  onMessageSent,
}) => {
  const {
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
  } = useSecureMessaging(recipientId, recipientName, onMessageSent);

  // Render password form if needed
  if (needsPassword) {
    return (
      <EncryptionSetup
        isLoading={isLoading}
        password={password}
        setPassword={setPassword}
        onSubmit={handlePasswordSubmit}
      />
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
        <MessageList
          messages={messages}
          isLoading={isLoading}
          recipientName={recipientName}
        />
      </div>

      {/* Composer */}
      <MessageComposer
        message={newMessage}
        setMessage={setNewMessage}
        onSend={sendMessage}
        isEncryptionReady={encryptionReady}
        isSending={isSending}
        recipientName={recipientName}
      />
    </div>
  );
};

export default SecureMessaging; 