import { Button } from '@/components/ui/button/button';
import { AlertCircle, Loader2, Send } from 'lucide-react';
import React from 'react';

interface MessageComposerProps {
  message: string;
  setMessage: (message: string) => void;
  onSend: () => Promise<void>;
  isEncryptionReady: boolean;
  isSending: boolean;
  recipientName: string;
}

/**
 * Component for composing and sending encrypted messages
 */
const MessageComposer: React.FC<MessageComposerProps> = ({
  message,
  setMessage,
  onSend,
  isEncryptionReady,
  isSending,
  recipientName,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && isEncryptionReady && !isSending) {
      onSend();
    }
  };

  return (
    <div className="p-3 border-t">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type a secure message..."
          className="flex-1 p-2 border rounded-lg"
          disabled={!isEncryptionReady || isSending}
          data-testid="message-input"
        />

        <Button
          type="submit"
          disabled={!message.trim() || !isEncryptionReady || isSending}
          data-testid="send-message-button"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {!isEncryptionReady && (
        <div 
          className="text-xs text-amber-600 mt-2 flex items-center gap-1"
          data-testid="encryption-warning"
        >
          <AlertCircle className="h-3 w-3" />
          <span>Cannot send encrypted messages. {recipientName} has not set up encryption.</span>
        </div>
      )}
    </div>
  );
};

export default MessageComposer; 