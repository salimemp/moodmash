import { api } from '@/lib/api/client';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  decryptPreferences,
  EncryptedData,
  encryptPreferences,
  generateUserKeys,
  UserPreferences,
} from '../encryption/crypto';
import { keyManager } from '../encryption/keyManager';
import { Preferences } from './usePreferences';

export interface UseEncryptedPreferencesResult {
  preferences: Preferences;
  isLoading: boolean;
  isSaving: boolean;
  isEncrypted: boolean;
  error: Error | null;
  updatePreferences: (newPrefs: Partial<Preferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
  refetch: () => Promise<void>;
  setupEncryption: (password: string) => Promise<boolean>;
  clearEncryptionKeys: () => void;
}

// Default preferences
const defaultPreferences: Preferences = {
  theme: 'system',
  emailNotifications: true,
  pushNotifications: true,
  weeklyDigest: true,
  language: 'en',
  timezone: 'UTC',
};

/**
 * Hook for managing end-to-end encrypted user preferences
 */
export function useEncryptedPreferences(): UseEncryptedPreferencesResult {
  const { data: session, status } = useSession();
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [previousPrefs, setPreviousPrefs] = useState<Preferences | null>(null);

  // Initialize key manager with user ID when session is available
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      keyManager?.initialize(session.user.id as string);
    }
  }, [status, session]);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (status !== 'authenticated' || !session) {
      setPreferences(defaultPreferences);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch encrypted or plaintext preferences based on API response
      interface EncryptedResponse {
        encrypted: true;
        data: EncryptedData;
      }
      
      interface PlainResponse {
        encrypted?: false;
        data: Preferences;
      }
      
      const response = await api.get<EncryptedResponse | PlainResponse>(
        '/profile/encrypted-preferences'
      );

      if (response.encrypted) {
        setIsEncrypted(true);

        // If we have encryption keys, try to decrypt
        const encryptionKey = keyManager?.getEncryptionKey();
        if (encryptionKey) {
          const decrypted = decryptPreferences(response.data, encryptionKey);
          if (decrypted) {
            setPreferences(toAppPreferences(decrypted));
          } else {
            // Decryption failed - might need to re-enter password
            toast.error('Could not decrypt preferences', {
              description: 'Please re-enter your password to access your encrypted data',
            });
            setPreferences(defaultPreferences);
          }
        } else {
          // No encryption key available - using defaults
          setPreferences(defaultPreferences);
          toast.info('Encryption key needed', {
            description: 'Please enter your password to decrypt your preferences',
          });
        }
      } else {
        // Not encrypted, use plaintext preferences
        setIsEncrypted(false);
        setPreferences(response.data as Preferences);
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
      setError(err instanceof Error ? err : new Error('Failed to load preferences'));

      // Show error toast
      toast.error('Failed to load your preferences', {
        description: 'Default settings will be used meanwhile. Please try again later.',
        id: 'preferences-fetch-error',
        dismissible: true,
      });

      // Use defaults on error
      setPreferences(defaultPreferences);
    } finally {
      setIsLoading(false);
    }
  }, [status, session]);

  // Function to convert from app Preferences to UserPreferences for encryption
  const toUserPreferences = (prefs: Preferences): UserPreferences => {
    return {
      ...prefs,
      // Ensure theme is properly typed when converting
      theme: prefs.theme as string | undefined,
    };
  };

  // Function to convert from UserPreferences to app Preferences
  const toAppPreferences = (prefs: UserPreferences): Preferences => {
    const { theme, ...rest } = prefs;
    return {
      ...rest,
      // Ensure theme is properly typed when converting back
      theme: theme as 'light' | 'dark' | 'system' | undefined,
    } as Preferences;
  };

  // Update preferences with encryption if available
  const updatePreferences = async (newPrefs: Partial<Preferences>) => {
    if (status !== 'authenticated' || !session) {
      toast.error('Authentication required', {
        description: 'You must be logged in to update preferences',
      });
      throw new Error('You must be logged in to update preferences');
    }

    try {
      // Store current preferences for rollback if needed
      setPreviousPrefs({ ...preferences });

      // Start saving state
      setIsSaving(true);
      setError(null);

      // Optimistic update - immediately update UI
      const updatedPrefs = { ...preferences, ...newPrefs };
      setPreferences(updatedPrefs);

      // Show unobtrusive saving toast
      const toastId = toast.loading('Saving preferences...');

      try {
        if (isEncrypted && keyManager?.getEncryptionKey()) {
          // Encrypt preferences before sending
          const encryptionKey = keyManager.getEncryptionKey()!;
          const userPrefs = toUserPreferences(updatedPrefs);
          const encryptedData = encryptPreferences(userPrefs, encryptionKey);
          
          // Send encrypted preferences
          await api.patch<{ success: boolean; preferences: Preferences }>(
            '/profile/encrypted-preferences',
            { encryptedData, encrypted: true }
          );
        } else {
          // Send plaintext preferences if not using encryption
          await api.patch<{ preferences: Preferences }>(
            '/profile/preferences',
            newPrefs
          );
        }

        // Success toast
        toast.success('Preferences saved', { id: toastId });

        // Clear previous state since update was successful
        setPreviousPrefs(null);
      } catch (err) {
        // Error handling for the API call
        console.error('Failed to update preferences:', err);
        setError(err instanceof Error ? err : new Error('Failed to update preferences'));

        // Rollback to previous state
        if (previousPrefs) {
          setPreferences(previousPrefs);
        }

        // Error toast
        toast.error('Failed to save preferences', {
          id: toastId,
          description: 'Your changes will be restored when you refresh the page.',
        });

        // Rethrow to let calling component handle the error
        throw err;
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Reset preferences to defaults
  const resetPreferences = async () => {
    toast.info('Resetting preferences to defaults...');
    try {
      await updatePreferences(defaultPreferences);
      toast.success('Preferences reset to defaults');
    } catch {
      // Error is already handled in updatePreferences
    }
  };

  // Set up encryption for preferences
  const setupEncryption = async (password: string): Promise<boolean> => {
    if (!session?.user?.id || !password) {
      toast.error('Cannot set up encryption', {
        description: 'User ID and password are required',
      });
      return false;
    }

    try {
      setIsLoading(true);

      // Generate user keys from password
      const userId = session.user.id as string;
      const keys = await generateUserKeys(password);

      // Store the keys in key manager
      keyManager?.initialize(userId);
      keyManager?.setKeys(keys);

      // Set the encryption key from password
      await keyManager?.setEncryptionKeyFromPassword(password);

      // Get the encryption key
      const encryptionKey = keyManager?.getEncryptionKey();
      if (!encryptionKey) {
        throw new Error('Failed to set encryption key');
      }

      // Encrypt current preferences
      const userPrefs = toUserPreferences(preferences);
      const encryptedData = encryptPreferences(userPrefs, encryptionKey);

      // Upload public key and encrypted preferences
      await api.post('/profile/setup-encryption', {
        publicKey: keys.publicKey,
        salt: keys.salt,
        encryptedPreferences: encryptedData,
      });

      setIsEncrypted(true);

      toast.success('End-to-end encryption set up successfully', {
        description: 'Your preferences are now encrypted',
      });

      // Refetch to confirm
      await fetchPreferences();

      return true;
    } catch (error) {
      console.error('Failed to set up encryption:', error);
      toast.error('Failed to set up encryption', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear encryption keys (e.g., on logout)
  const clearEncryptionKeys = useCallback(() => {
    keyManager?.clearKeys();
    setIsEncrypted(false);
  }, []);

  // Load preferences on mount and when session changes
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    isLoading,
    isSaving,
    isEncrypted,
    error,
    updatePreferences,
    resetPreferences,
    refetch: fetchPreferences,
    setupEncryption,
    clearEncryptionKeys,
  };
}
