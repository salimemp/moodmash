import { AlertCircle, Loader2, Lock } from 'lucide-react';
import React from 'react';
import { MessageDisplay } from './useSecureMessaging';

interface MessageListProps {
  messages: MessageDisplay[];
  isLoading: boolean;
  recipientName: string;
}

/**
 * Component for displaying a list of secure messages
 */
const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, recipientName }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" role="status" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-8">
        <Lock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p>No messages yet. Start a secure conversation!</p>
        <p className="text-sm mt-1">
          Messages are encrypted end-to-end and can only be read by you and {recipientName}.
        </p>
      </div>
    );
  }

  return (
    <>
      {messages.map(message => (
        <div
          key={message.id}
          className={`mb-3 max-w-[80%] ${message.isOutgoing ? 'ml-auto' : 'mr-auto'}`}
          data-testid={`message-${message.id}`}
        >
          <div
            className={`p-3 rounded-lg ${
              message.isOutgoing ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
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

          <div
            className={`text-xs mt-1 flex gap-2 ${message.isOutgoing ? 'text-right' : 'text-left'}`}
          >
            <time>{message.timestamp.toLocaleTimeString()}</time>
            {message.isEncrypted && <Lock className="h-3 w-3 text-green-600" />}
          </div>
        </div>
      ))}
    </>
  );
};

export default MessageList; 