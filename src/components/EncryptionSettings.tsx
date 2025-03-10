import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { keyManager } from '@/lib/encryption/keyManager';
import { useEncryptedPreferences } from '@/lib/hooks/useEncryptedPreferences';
import { Button } from '@/components/ui/button/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card/card';
import { Loader2, Lock, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface EncryptionSettingsProps {
  onComplete?: () => void;
}

const EncryptionSettings: React.FC<EncryptionSettingsProps> = ({ onComplete }) => {
  const { data: session } = useSession();
  const { isEncrypted, setupEncryption } = useEncryptedPreferences();
  
  const [setupStep, setSetupStep] = useState<'intro' | 'password' | 'confirm' | 'complete'>('intro');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if encryption is already set up
  useEffect(() => {
    if (isEncrypted) {
      setSetupStep('complete');
    }
  }, [isEncrypted]);
  
  const handleNextStep = () => {
    if (setupStep === 'intro') {
      setSetupStep('password');
    } else if (setupStep === 'password') {
      if (!password || password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      setError(null);
      setSetupStep('confirm');
    } else if (setupStep === 'confirm') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      handleSetupEncryption();
    }
  };
  
  const handlePrevStep = () => {
    if (setupStep === 'confirm') {
      setSetupStep('password');
    } else if (setupStep === 'password') {
      setSetupStep('intro');
    }
  };
  
  const handleSetupEncryption = async () => {
    if (!password) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await setupEncryption(password);
      
      if (success) {
        setSetupStep('complete');
        toast.success('End-to-end encryption set up successfully');
        
        if (onComplete) {
          onComplete();
        }
      } else {
        setError('Failed to set up encryption. Please try again.');
      }
    } catch (error) {
      console.error('Error setting up encryption:', error);
      setError('Failed to set up encryption');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          End-to-End Encryption
        </CardTitle>
        <CardDescription>
          {setupStep === 'complete' 
            ? 'Your data is protected with end-to-end encryption' 
            : 'Set up end-to-end encryption to protect your data'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {setupStep === 'intro' && (
          <div className="space-y-4">
            <p>
              End-to-end encryption ensures that your sensitive data can only be read by you.
              Even we cannot access your encrypted data.
            </p>
            
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-200 dark:border-amber-800">
              <h4 className="font-medium flex items-center gap-2 text-amber-800 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Important
              </h4>
              <ul className="mt-2 text-sm space-y-1 text-amber-700 dark:text-amber-300">
                <li>• Your password is used to generate encryption keys</li>
                <li>• We cannot recover your data if you forget your password</li>
                <li>• You'll need to enter your password on new devices</li>
              </ul>
            </div>
          </div>
        )}
        
        {setupStep === 'password' && (
          <div className="space-y-4">
            <p className="text-sm">
              Create a strong password to protect your encryption keys.
              This password will be used to encrypt and decrypt your data.
            </p>
            
            <div>
              <label htmlFor="password" className="text-sm font-medium block mb-1">
                Encryption Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter a strong password"
                autoComplete="new-password"
              />
              {password && password.length < 8 && (
                <p className="text-xs text-red-500 mt-1">
                  Password must be at least 8 characters
                </p>
              )}
            </div>
          </div>
        )}
        
        {setupStep === 'confirm' && (
          <div className="space-y-4">
            <p className="text-sm">
              Confirm your encryption password to proceed.
            </p>
            
            <div>
              <label htmlFor="confirm-password" className="text-sm font-medium block mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  Passwords do not match
                </p>
              )}
            </div>
          </div>
        )}
        
        {setupStep === 'complete' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Encryption is active</span>
            </div>
            
            <p className="text-sm">
              Your data is now protected with end-to-end encryption. To access your encrypted
              data on a new device, you'll need to enter your encryption password.
            </p>
            
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-400">Encrypted Data</h4>
              <ul className="mt-2 text-sm space-y-1 text-blue-700 dark:text-blue-300">
                <li>• User preferences</li>
                <li>• Private messages</li>
                <li>• Security settings</li>
              </ul>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {setupStep !== 'complete' && setupStep !== 'intro' && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevStep}
            disabled={isLoading}
          >
            Back
          </Button>
        )}
        
        {setupStep !== 'complete' ? (
          <Button
            type="button"
            onClick={handleNextStep}
            disabled={isLoading || (setupStep === 'password' && (!password || password.length < 8))}
            className={setupStep === 'intro' || setupStep === 'password' ? 'ml-auto' : ''}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : setupStep === 'confirm' ? (
              'Set Up Encryption'
            ) : (
              'Next'
            )}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onComplete}
            className="ml-auto"
          >
            Close
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default EncryptionSettings; 