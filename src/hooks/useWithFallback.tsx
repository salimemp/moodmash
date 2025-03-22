import { useEffect, useState } from 'react';

/**
 * Hook for progressive enhancement - allows components to have a fallback
 * when the feature or API is not supported
 * 
 * @param feature Function to detect if a feature is supported
 * @param defaultValue Default value to use if the feature detection doesn't complete
 * @returns [isSupported, isDetectionComplete]
 */
export function useFeatureDetection(
  feature: () => boolean | Promise<boolean>,
  defaultValue = false
): [boolean, boolean] {
  const [isSupported, setIsSupported] = useState<boolean>(defaultValue);
  const [isDetectionComplete, setIsDetectionComplete] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const detectFeature = async () => {
      try {
        const result = await Promise.resolve(feature());
        
        if (isMounted) {
          setIsSupported(result);
          setIsDetectionComplete(true);
        }
      } catch (error) {
        if (isMounted) {
          console.warn('Feature detection failed:', error);
          setIsSupported(defaultValue);
          setIsDetectionComplete(true);
        }
      }
    };

    detectFeature();

    return () => {
      isMounted = false;
    };
  }, [feature, defaultValue]);

  return [isSupported, isDetectionComplete];
}

/**
 * HOC that provides a fallback component when a feature is not supported
 * 
 * @param FeatureComponent Component to render when feature is supported
 * @param FallbackComponent Component to render when feature is not supported
 * @param LoadingComponent Component to render while detection is in progress
 * @param featureDetection Function to detect if the feature is supported
 */
export function withProgressiveEnhancement<P extends object>(
  FeatureComponent: React.ComponentType<P>,
  FallbackComponent: React.ComponentType<P>,
  LoadingComponent: React.ComponentType<P> | null = null,
  featureDetection: () => boolean | Promise<boolean>
) {
  return function ProgressiveComponent(props: P) {
    const [isSupported, isDetectionComplete] = useFeatureDetection(featureDetection);

    if (!isDetectionComplete && LoadingComponent) {
      return <LoadingComponent {...props} />;
    }

    return isSupported ? <FeatureComponent {...props} /> : <FallbackComponent {...props} />;
  };
}

/**
 * Common feature detection functions
 */
export const features = {
  /**
   * Check if service workers are supported
   */
  serviceWorker: () => 
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  
  /**
   * Check if IndexedDB is supported
   */
  indexedDB: () => 
    typeof window !== 'undefined' && 'indexedDB' in window,
  
  /**
   * Check if WebRTC is supported
   */
  webRTC: () => 
    typeof navigator !== 'undefined' && 
    navigator.mediaDevices && 
    !!navigator.mediaDevices.getUserMedia,
  
  /**
   * Check if WebGL is supported
   */
  webGL: () => {
    if (typeof document === 'undefined') return false;
    
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  },
  
  /**
   * Check if the Notification API is supported
   */
  notifications: async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    // Check if notification permission is already granted
    if (Notification.permission === 'granted') {
      return true;
    }

    // We don't want to automatically request permission
    // Just check if the API is available
    return Notification.permission !== 'denied';
  },
  
  /**
   * Check if the device has a camera
   */
  camera: async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      return false;
    }
    
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch (e) {
      return false;
    }
  },
  
  /**
   * Check if the device is touch-enabled
   */
  touchScreen: () => 
    typeof navigator !== 'undefined' && 
    ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0),
}; 