import { UserKeys, deriveKeyFromPassword, encodeBase64 } from './crypto';

// Constants
const KEY_PREFIX = 'moodmash_keys_';
const PUBLIC_KEY_SUFFIX = '_public';
const ENC_KEY_STORAGE_KEY = 'moodmash_enc_key';
const KEY_META_STORAGE_KEY = 'moodmash_key_meta';

/**
 * Interface for key metadata
 */
export interface KeyMetadata {
  userId: string;
  keyId: string;
  createdAt: number;
  updatedAt: number;
  publicKeyShared: boolean;
  deviceId: string;
  keyType: 'primary' | 'recovery' | 'device';
}

/**
 * Client-side key manager for handling encryption keys
 */
export class KeyManager {
  private userId: string | null = null;
  private secretKey: string | null = null;
  private publicKey: string | null = null;
  private encryptionKey: string | null = null;
  private salt: string | null = null;
  private metadata: KeyMetadata | null = null;
  private storage: Storage | null = null;

  constructor(userId?: string) {
    if (typeof window !== 'undefined') {
      this.storage = window.localStorage;
      if (userId) {
        this.userId = userId;
        this.loadKeysFromStorage();
      }
    }
  }

  /**
   * Initialize the key manager with user ID
   * @param userId User's ID
   */
  public initialize(userId: string): void {
    this.userId = userId;
    this.loadKeysFromStorage();
  }

  /**
   * Check if keys exist for the current user
   */
  public hasKeys(): boolean {
    return !!(this.secretKey && this.publicKey);
  }

  /**
   * Set user keys
   * @param keys UserKeys object
   * @param metadata Optional key metadata
   */
  public setKeys(keys: UserKeys, metadata?: Partial<KeyMetadata>): void {
    if (!this.userId) {
      throw new Error('User ID not set. Call initialize() first.');
    }

    this.secretKey = keys.secretKey;
    this.publicKey = keys.publicKey;
    this.salt = keys.salt;

    const now = Date.now();
    const deviceId = this.getOrCreateDeviceId();

    this.metadata = {
      userId: this.userId,
      keyId: `key_${now}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      publicKeyShared: false,
      deviceId,
      keyType: 'primary',
      ...metadata,
    };

    this.saveKeysToStorage();
  }

  /**
   * Get user's public key
   */
  public getPublicKey(): string | null {
    return this.publicKey;
  }

  /**
   * Get user's secret key (private)
   * Should be used carefully and never exposed
   */
  public getSecretKey(): string | null {
    return this.secretKey;
  }

  /**
   * Get user keys
   */
  public getKeys(): { publicKey: string; secretKey: string } | null {
    if (!this.publicKey || !this.secretKey) {
      return null;
    }

    return {
      publicKey: this.publicKey,
      secretKey: this.secretKey,
    };
  }

  /**
   * Get key metadata
   */
  public getMetadata(): KeyMetadata | null {
    return this.metadata;
  }

  /**
   * Derive and set encryption key from password
   * @param password User's password
   */
  public async setEncryptionKeyFromPassword(password: string): Promise<string> {
    if (!this.salt) {
      throw new Error('Salt not available. Set keys first.');
    }

    const derivedKey = await deriveKeyFromPassword(password, this.salt);
    this.encryptionKey = encodeBase64(derivedKey);

    if (this.storage) {
      // Store temporarily in sessionStorage for the session duration
      sessionStorage.setItem(ENC_KEY_STORAGE_KEY, this.encryptionKey);
    }

    return this.encryptionKey;
  }

  /**
   * Get the encryption key
   */
  public getEncryptionKey(): string | null {
    // Try to get from memory first, then from session storage
    if (!this.encryptionKey && typeof sessionStorage !== 'undefined') {
      this.encryptionKey = sessionStorage.getItem(ENC_KEY_STORAGE_KEY);
    }

    return this.encryptionKey;
  }

  /**
   * Clear encryption key from memory and session storage
   */
  public clearEncryptionKey(): void {
    this.encryptionKey = null;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(ENC_KEY_STORAGE_KEY);
    }
  }

  /**
   * Mark public key as shared with server
   */
  public markPublicKeyAsShared(): void {
    if (this.metadata) {
      this.metadata.publicKeyShared = true;
      this.metadata.updatedAt = Date.now();
      this.saveMetadataToStorage();
    }
  }

  /**
   * Clear all keys from memory and storage
   */
  public clearKeys(): void {
    this.secretKey = null;
    this.publicKey = null;
    this.encryptionKey = null;
    this.salt = null;
    this.metadata = null;

    if (this.storage && this.userId) {
      this.storage.removeItem(`${KEY_PREFIX}${this.userId}`);
      this.storage.removeItem(`${KEY_PREFIX}${this.userId}${PUBLIC_KEY_SUFFIX}`);
      this.storage.removeItem(`${KEY_META_STORAGE_KEY}_${this.userId}`);
    }

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(ENC_KEY_STORAGE_KEY);
    }
  }

  /**
   * Load keys from storage
   */
  private loadKeysFromStorage(): void {
    if (!this.storage || !this.userId) return;

    try {
      // Load secret key (encrypted)
      const encryptedSecretKey = this.storage.getItem(`${KEY_PREFIX}${this.userId}`);
      if (encryptedSecretKey) {
        this.secretKey = encryptedSecretKey;
      }

      // Load public key (can be stored in clear)
      const publicKey = this.storage.getItem(`${KEY_PREFIX}${this.userId}${PUBLIC_KEY_SUFFIX}`);
      if (publicKey) {
        this.publicKey = publicKey;
      }

      // Load salt
      const salt = this.storage.getItem(`${KEY_PREFIX}${this.userId}_salt`);
      if (salt) {
        this.salt = salt;
      }

      // Load metadata
      const metadataJson = this.storage.getItem(`${KEY_META_STORAGE_KEY}_${this.userId}`);
      if (metadataJson) {
        this.metadata = JSON.parse(metadataJson);
      }

      // Try to load encryption key from session storage
      if (typeof sessionStorage !== 'undefined') {
        this.encryptionKey = sessionStorage.getItem(ENC_KEY_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to load keys from storage:', error);
    }
  }

  /**
   * Save keys to storage
   */
  private saveKeysToStorage(): void {
    if (!this.storage || !this.userId) return;

    try {
      // Save secret key (should ideally be encrypted in a real app)
      if (this.secretKey) {
        this.storage.setItem(`${KEY_PREFIX}${this.userId}`, this.secretKey);
      }

      // Save public key (can be stored in clear)
      if (this.publicKey) {
        this.storage.setItem(`${KEY_PREFIX}${this.userId}${PUBLIC_KEY_SUFFIX}`, this.publicKey);
      }

      // Save salt
      if (this.salt) {
        this.storage.setItem(`${KEY_PREFIX}${this.userId}_salt`, this.salt);
      }

      // Save metadata
      this.saveMetadataToStorage();
    } catch (error) {
      console.error('Failed to save keys to storage:', error);
    }
  }

  /**
   * Save metadata to storage
   */
  private saveMetadataToStorage(): void {
    if (!this.storage || !this.userId || !this.metadata) return;

    try {
      this.storage.setItem(`${KEY_META_STORAGE_KEY}_${this.userId}`, JSON.stringify(this.metadata));
    } catch (error) {
      console.error('Failed to save key metadata to storage:', error);
    }
  }

  /**
   * Get or create a unique device ID
   */
  private getOrCreateDeviceId(): string {
    if (!this.storage) return `device_${Date.now()}`;

    const storedDeviceId = this.storage.getItem('moodmash_device_id');
    if (storedDeviceId) {
      return storedDeviceId;
    }

    const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.storage.setItem('moodmash_device_id', newDeviceId);
    return newDeviceId;
  }

  /**
   * Get public key for a user from local storage
   * @param userId User ID to get public key for
   */
  public getPublicKeyForUser(userId: string): string | null {
    if (!this.storage) return null;

    return this.storage.getItem(`${KEY_PREFIX}${userId}${PUBLIC_KEY_SUFFIX}`);
  }

  /**
   * Store a public key for another user
   * @param userId User ID to store public key for
   * @param publicKey Public key to store
   */
  public storePublicKeyForUser(userId: string, publicKey: string): void {
    if (!this.storage) return;

    this.storage.setItem(`${KEY_PREFIX}${userId}${PUBLIC_KEY_SUFFIX}`, publicKey);
  }
}

// Create and export a singleton instance
export const keyManager = typeof window !== 'undefined' ? new KeyManager() : null;
