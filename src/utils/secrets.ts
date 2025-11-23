/**
 * Secrets Management Utilities for MoodMash
 * Cloudflare Secrets and environment variables management
 */

import { Context } from 'hono';

/**
 * Simple encryption/decryption using Web Crypto API
 * Note: For production, use Cloudflare's native secrets management
 */

/**
 * Encrypt a secret value
 */
export async function encryptSecret(value: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  
  // Generate key from passphrase
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const cryptoKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('moodmash-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a secret value
 */
export async function decryptSecret(encryptedValue: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  // Decode from base64
  const combined = Uint8Array.from(atob(encryptedValue), c => c.charCodeAt(0));
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  // Generate key from passphrase
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const cryptoKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('moodmash-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );

  return decoder.decode(decrypted);
}

/**
 * Store secret in database
 */
export async function storeSecret(
  db: D1Database,
  keyName: string,
  value: string,
  description: string,
  category: string,
  createdBy: number,
  encryptionKey: string
): Promise<void> {
  const encryptedValue = await encryptSecret(value, encryptionKey);

  await db.prepare(`
    INSERT INTO app_secrets (
      key_name, encrypted_value, encryption_method, description,
      category, created_by, created_at
    ) VALUES (?, ?, 'AES-256', ?, ?, ?, datetime('now'))
    ON CONFLICT(key_name) DO UPDATE SET
      encrypted_value = ?,
      description = ?,
      updated_at = datetime('now')
  `).bind(
    keyName,
    encryptedValue,
    description,
    category,
    createdBy,
    encryptedValue,
    description
  ).run();
}

/**
 * Retrieve secret from database
 */
export async function getSecret(
  db: D1Database,
  keyName: string,
  encryptionKey: string
): Promise<string | null> {
  const result = await db.prepare(`
    SELECT encrypted_value FROM app_secrets
    WHERE key_name = ?
  `).bind(keyName).first();

  if (!result) return null;

  // Update access tracking
  await db.prepare(`
    UPDATE app_secrets
    SET last_accessed_at = datetime('now'),
        access_count = access_count + 1
    WHERE key_name = ?
  `).bind(keyName).run();

  return await decryptSecret(result.encrypted_value as string, encryptionKey);
}

/**
 * Delete secret from database
 */
export async function deleteSecret(
  db: D1Database,
  keyName: string
): Promise<void> {
  await db.prepare(`
    DELETE FROM app_secrets WHERE key_name = ?
  `).bind(keyName).run();
}

/**
 * List all secrets (without values)
 */
export async function listSecrets(
  db: D1Database,
  category?: string
): Promise<Array<{
  keyName: string;
  description: string;
  category: string;
  lastAccessed?: string;
  accessCount: number;
}>> {
  let query = `
    SELECT key_name, description, category, last_accessed_at, access_count
    FROM app_secrets
  `;
  const bindings: any[] = [];

  if (category) {
    query += ` WHERE category = ?`;
    bindings.push(category);
  }

  query += ` ORDER BY created_at DESC`;

  const results = await db.prepare(query).bind(...bindings).all();

  return results.results.map((row: any) => ({
    keyName: row.key_name,
    description: row.description,
    category: row.category,
    lastAccessed: row.last_accessed_at,
    accessCount: row.access_count
  }));
}

/**
 * Get environment variable from database
 */
export async function getEnvVar(
  db: D1Database,
  keyName: string,
  environment: 'development' | 'staging' | 'production' = 'production'
): Promise<string | null> {
  const result = await db.prepare(`
    SELECT value, is_sensitive FROM environment_config
    WHERE key_name = ? AND environment = ?
  `).bind(keyName, environment).first();

  if (!result) return null;

  // If sensitive, it should be encrypted (but for demo, we'll return as-is)
  return result.value as string;
}

/**
 * Set environment variable in database
 */
export async function setEnvVar(
  db: D1Database,
  keyName: string,
  value: string,
  environment: 'development' | 'staging' | 'production',
  description?: string,
  isSensitive: boolean = false
): Promise<void> {
  await db.prepare(`
    INSERT INTO environment_config (
      key_name, value, environment, description, is_sensitive, created_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(key_name) DO UPDATE SET
      value = ?,
      description = ?,
      is_sensitive = ?,
      updated_at = datetime('now')
  `).bind(
    keyName,
    value,
    environment,
    description || '',
    isSensitive ? 1 : 0,
    value,
    description || '',
    isSensitive ? 1 : 0
  ).run();
}

/**
 * Get Cloudflare secret from environment
 * This accesses secrets set via `wrangler secret put`
 */
export function getCloudflareSecret(c: Context, secretName: string): string | undefined {
  return (c.env as any)[secretName];
}

/**
 * Check if secret needs rotation
 */
export async function checkSecretRotation(db: D1Database): Promise<Array<{
  keyName: string;
  lastRotated?: string;
  nextRotation?: string;
}>> {
  const results = await db.prepare(`
    SELECT key_name, last_rotated_at, next_rotation_at
    FROM app_secrets
    WHERE rotation_required = 1
      AND (next_rotation_at IS NULL OR next_rotation_at <= datetime('now'))
    ORDER BY next_rotation_at ASC
  `).all();

  return results.results.map((row: any) => ({
    keyName: row.key_name,
    lastRotated: row.last_rotated_at,
    nextRotation: row.next_rotation_at
  }));
}

/**
 * Mark secret as rotated
 */
export async function markSecretRotated(
  db: D1Database,
  keyName: string,
  rotationScheduleDays: number
): Promise<void> {
  const nextRotation = new Date();
  nextRotation.setDate(nextRotation.getDate() + rotationScheduleDays);

  await db.prepare(`
    UPDATE app_secrets
    SET last_rotated_at = datetime('now'),
        next_rotation_at = ?,
        updated_at = datetime('now')
    WHERE key_name = ?
  `).bind(nextRotation.toISOString(), keyName).run();
}

/**
 * Generate secure random key (for encryption keys, tokens, etc.)
 */
export function generateSecureKey(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash sensitive data (one-way hash for storing passwords, API keys, etc.)
 */
export async function hashSensitiveData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
