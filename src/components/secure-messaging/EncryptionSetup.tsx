import { Button } from '@/components/ui/button/button';
import { Loader2, Lock } from 'lucide-react';
import React from 'react';

interface EncryptionSetupProps {
  isLoading: boolean;
  password: string;
  setPassword: (password: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * Component for handling encryption setup and password entry
 */
const EncryptionSetup: React.FC<EncryptionSetupProps> = ({
  isLoading,
  password,
  setPassword,
  onSubmit,
}) => {
  return (
    <div className="p-4 border rounded-lg">
      <div className="mb-4 flex items-center text-amber-600 gap-2">
        <Lock className="h-5 w-5" />
        <h3 className="font-semibold">Encryption Setup Required</h3>
      </div>

      <p className="text-sm mb-4">
        Please enter your password to enable end-to-end encrypted messaging.
      </p>

      <form onSubmit={onSubmit} className="space-y-4" role="form">
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
            data-testid="encryption-password-input"
          />
        </div>

        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full"
          data-testid="encryption-unlock-button"
        >
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
};

export default EncryptionSetup; 