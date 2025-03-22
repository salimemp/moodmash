/**
 * Utility functions for offline data storage using IndexedDB
 */

// Constants
const DB_NAME = 'moodmash_offline_db';
const DB_VERSION = 1;
const STORE_NAMES = {
  PENDING_ACTIONS: 'pendingActions',
  CACHED_DATA: 'cachedData',
};

// Interface for pending actions
export interface PendingAction {
  id: string;
  type: string;
  endpoint: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

// Interface for cached data
export interface CachedData {
  id: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

// Initialize the database
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // Check for IndexedDB support
    if (!('indexedDB' in window)) {
      reject(new Error('Browser does not support IndexedDB'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (_event) => {
      reject(new Error('Error opening database'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(STORE_NAMES.PENDING_ACTIONS)) {
        const pendingActionsStore = db.createObjectStore(STORE_NAMES.PENDING_ACTIONS, { keyPath: 'id' });
        pendingActionsStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_NAMES.CACHED_DATA)) {
        const cachedDataStore = db.createObjectStore(STORE_NAMES.CACHED_DATA, { keyPath: 'id' });
        cachedDataStore.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
  });
};

// Queue an action for later processing when online
export const queueAction = async (action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> => {
  try {
    const db = await initDB();
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAMES.PENDING_ACTIONS], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.PENDING_ACTIONS);
      
      const pendingAction: PendingAction = {
        id,
        ...action,
        timestamp: Date.now(),
        retryCount: 0,
      };
      
      const request = store.add(pendingAction);
      
      request.onsuccess = () => {
        resolve(id);
      };
      
      request.onerror = () => {
        reject(new Error('Failed to queue action'));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error queuing action:', error);
    throw error;
  }
};

// Get all pending actions
export const getPendingActions = async (): Promise<PendingAction[]> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAMES.PENDING_ACTIONS], 'readonly');
      const store = transaction.objectStore(STORE_NAMES.PENDING_ACTIONS);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(new Error('Failed to get pending actions'));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error getting pending actions:', error);
    return [];
  }
};

// Remove a pending action
export const removePendingAction = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAMES.PENDING_ACTIONS], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.PENDING_ACTIONS);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error('Failed to remove pending action'));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error removing pending action:', error);
    throw error;
  }
};

// Store data in the cache
export const cacheData = async (
  id: string, 
  data: any, 
  expirationTime = 1000 * 60 * 60 // Default: 1 hour
): Promise<void> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAMES.CACHED_DATA], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.CACHED_DATA);
      
      const timestamp = Date.now();
      const cachedData: CachedData = {
        id,
        data,
        timestamp,
        expiresAt: timestamp + expirationTime,
      };
      
      const request = store.put(cachedData);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error('Failed to cache data'));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error caching data:', error);
    throw error;
  }
};

// Get cached data
export const getCachedData = async (id: string): Promise<any | null> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAMES.CACHED_DATA], 'readonly');
      const store = transaction.objectStore(STORE_NAMES.CACHED_DATA);
      const request = store.get(id);
      
      request.onsuccess = () => {
        const cachedData = request.result as CachedData | undefined;
        
        if (!cachedData) {
          resolve(null);
          return;
        }
        
        // Check if data is expired
        if (cachedData.expiresAt < Date.now()) {
          // Delete expired data
          const deleteTransaction = db.transaction([STORE_NAMES.CACHED_DATA], 'readwrite');
          const deleteStore = deleteTransaction.objectStore(STORE_NAMES.CACHED_DATA);
          deleteStore.delete(id);
          
          resolve(null);
        } else {
          resolve(cachedData.data);
        }
      };
      
      request.onerror = () => {
        reject(new Error('Failed to get cached data'));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
};

// Clean up expired cached data
export const cleanupExpiredCache = async (): Promise<void> => {
  try {
    const db = await initDB();
    const now = Date.now();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAMES.CACHED_DATA], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.CACHED_DATA);
      const index = store.index('expiresAt');
      const range = IDBKeyRange.upperBound(now);
      
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      
      transaction.onerror = () => {
        reject(new Error('Failed to cleanup expired cache'));
      };
    });
  } catch (error) {
    console.error('Error cleaning up expired cache:', error);
  }
}; 