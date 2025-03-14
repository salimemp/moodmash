import { useState } from 'react';
import { toast } from 'sonner';
import { useEncryptedPreferences } from './useEncryptedPreferences';

type EncryptionStep = 'intro' | 'password' | 'confirm' | 'complete';

interface UseEncryptionSetupProps {
  onComplete?: () => void;
}

export function useEncryptionSetup({ onComplete }: UseEncryptionSetupProps = {}) {
  const { isEncrypted, setupEncryption } = useEncryptedPreferences();
  
  const [setupStep, setSetupStep] = useState<EncryptionStep>(
    isEncrypted ? 'complete' : 'intro'
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return {
    setupStep,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    error,
    isEncrypted,
    handleNextStep,
    handlePrevStep,
    handleSetupEncryption
  };
} 