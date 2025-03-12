import { api } from '@/lib/api/client';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export interface Preferences {
  theme?: 'light' | 'dark' | 'system';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  weeklyDigest?: boolean;
  language?: string;
  timezone?: string;
}

interface UsePreferencesResult {
  preferences: Preferences;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  updatePreferences: (newPrefs: Partial<Preferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Enhanced hook for managing user preferences with optimistic updates and error handling
 */
export function usePreferences(): UsePreferencesResult {
  const { data: session, status } = useSession();
  const [preferences, setPreferences] = useState<Preferences>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [previousPrefs, setPreviousPrefs] = useState<Preferences | null>(null);

  // Default preferences - use useMemo to prevent unnecessary re-renders
  const defaultPreferences = useMemo<Preferences>(() => ({
    theme: 'system',
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    language: 'en',
    timezone: 'UTC',
  }), []);

  // Fetch preferences with improved error handling
  const fetchPreferences = useCallback(async () => {
    if (status !== 'authenticated' || !session) {
      setPreferences(defaultPreferences);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await api.get<Preferences>('/profile/preferences');
      setPreferences(data || defaultPreferences);
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
  }, [status, session, defaultPreferences]);

  // Update preferences with optimistic updates and error handling
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
        // Send update to server
        const response = await api.patch<{ preferences: Preferences }>(
          '/profile/preferences',
          newPrefs
        );

        // Update with server response to ensure accuracy
        setPreferences(response.preferences);

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

  // Reset preferences to defaults with feedback
  const resetPreferences = async () => {
    toast.info('Resetting preferences to defaults...');
    try {
      await updatePreferences(defaultPreferences);
      toast.success('Preferences reset to defaults');
    } catch {
      // Error is already handled in updatePreferences
    }
  };

  // Load preferences on mount and when session changes
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    isLoading,
    isSaving,
    error,
    updatePreferences,
    resetPreferences,
    refetch: fetchPreferences,
  };
}
