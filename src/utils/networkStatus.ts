/**
 * Utility for monitoring network status with TypeScript 
 */

import { useEffect, useState } from 'react';

type NetworkStatusListener = (online: boolean) => void;

class NetworkStatusMonitor {
  private listeners: NetworkStatusListener[] = [];
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      // Set up event listeners
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      // Additional check for slow connections
      if ('connection' in navigator) {
        // @ts-ignore - Connection API is not fully typed in standard lib
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
          connection.addEventListener('change', this.handleConnectionChange);
        }
      }
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notifyListeners();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notifyListeners();
  };

  private handleConnectionChange = () => {
    // Additional handling for connection quality changes
    this.notifyListeners();
  };

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  /**
   * Get current online status
   */
  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Get connection information if available
   */
  public getConnectionInfo(): {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  } {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return {};
    }

    // @ts-ignore - Connection API is not fully typed in standard lib
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) {
      return {};
    }

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }

  /**
   * Subscribe to network status changes
   */
  public subscribe(listener: NetworkStatusListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Clean up event listeners
   */
  public cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);

      if ('connection' in navigator) {
        // @ts-ignore - Connection API is not fully typed in standard lib
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
          connection.removeEventListener('change', this.handleConnectionChange);
        }
      }
    }

    this.listeners = [];
  }
}

// Create singleton instance
export const networkStatus = new NetworkStatusMonitor();

// Hook for React components
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    networkStatus.getOnlineStatus()
  );
  const [connectionInfo, setConnectionInfo] = useState(
    networkStatus.getConnectionInfo()
  );

  useEffect(() => {
    const updateStatus = (online: boolean) => {
      setIsOnline(online);
      setConnectionInfo(networkStatus.getConnectionInfo());
    };

    // Subscribe to changes
    const unsubscribe = networkStatus.subscribe(updateStatus);
    
    // Set initial state
    updateStatus(networkStatus.getOnlineStatus());
    
    return unsubscribe;
  }, []);

  return { isOnline, connectionInfo };
};

// Export default for non-React environments
export default networkStatus; 