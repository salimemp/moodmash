import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isInstalled: boolean;
  isWaiting: boolean;
  registration: ServiceWorkerRegistration | null;
  error: Error | null;
}

export function useServiceWorker(): ServiceWorkerState & {
  updateServiceWorker: () => void;
} {
  const [state, setState] = useState<ServiceWorkerState>({
    isInstalled: false,
    isWaiting: false,
    registration: null,
    error: null,
  });

  // Function to update the service worker
  const updateServiceWorker = () => {
    if (state.registration?.waiting) {
      // Inform service worker to skip waiting and activate new version
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to ensure clean state with the new service worker
      window.location.reload();
    }
  };

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Once the window has loaded, register the service worker
    const handleLoad = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        setState((prev) => ({
          ...prev,
          isInstalled: true,
          registration,
        }));

        // Handle waiting service worker (update available)
        if (registration.waiting) {
          setState((prev) => ({ ...prev, isWaiting: true }));
        }

        // Check if a new service worker is installing
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState((prev) => ({ ...prev, isWaiting: true }));
            }
          });
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      }
    };

    // Listen for controller change (happens when a new service worker takes over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // This ensures the page reloads when the new service worker takes control
      if (state.isWaiting) {
        window.location.reload();
      }
    });

    window.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, [state.isWaiting]);

  return {
    ...state,
    updateServiceWorker,
  };
} 