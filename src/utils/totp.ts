/**
 * TOTP (Time-based One-Time Password) Implementation
 * RFC 6238 compliant for 2FA authentication
 * Supports both software (Google Authenticator) and hardware tokens
 */

/**
 * Generate a cryptographically secure random secret
 * @param length - Length of the secret in bytes (default: 20 for 160-bit)
 * @returns Base32-encoded secret
 */
export function generateSecret(length: number = 20): string {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return base32Encode(buffer);
}

/**
 * Base32 encoding (RFC 4648)
 */
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(base32: string): Uint8Array {
  base32 = base32.toUpperCase().replace(/=+$/, '');
  const length = base32.length;
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(((length * 5) / 8) | 0);

  for (let i = 0; i < length; i++) {
    const idx = BASE32_CHARS.indexOf(base32[i]);
    if (idx === -1) throw new Error('Invalid base32 character');

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }

  return output;
}

/**
 * Generate HMAC-SHA1
 */
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    // @ts-ignore - Cloudflare Workers crypto API compatibility
    key,
    // @ts-ignore - Cloudflare Workers crypto API compatibility
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  // @ts-ignore - Cloudflare Workers crypto API compatibility
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

/**
 * Generate TOTP code
 * @param secret - Base32-encoded secret
 * @param timeStep - Time step in seconds (default: 30)
 * @param digits - Number of digits (default: 6)
 * @param timestamp - Unix timestamp (default: current time)
 * @returns TOTP code as string
 */
export async function generateTOTP(
  secret: string,
  timeStep: number = 30,
  digits: number = 6,
  timestamp?: number
): Promise<string> {
  let time = Math.floor((timestamp || Date.now()) / 1000 / timeStep);
  
  // Convert time to 8-byte buffer (big-endian)
  const timeBuffer = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    timeBuffer[i] = time & 0xff;
    time >>>= 8;
  }

  // Decode secret
  const keyBytes = base32Decode(secret);

  // Generate HMAC-SHA1
  const hmac = await hmacSha1(keyBytes, timeBuffer);

  // Dynamic truncation (RFC 6238)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  // Generate digits
  const otp = (code % Math.pow(10, digits)).toString();
  return otp.padStart(digits, '0');
}

/**
 * Verify TOTP code
 * @param token - User-provided TOTP code
 * @param secret - Base32-encoded secret
 * @param window - Time window to check (default: 1 = ±30 seconds)
 * @param timeStep - Time step in seconds (default: 30)
 * @param digits - Number of digits (default: 6)
 * @returns true if valid, false otherwise
 */
export async function verifyTOTP(
  token: string,
  secret: string,
  window: number = 1,
  timeStep: number = 30,
  digits: number = 6
): Promise<boolean> {
  const now = Date.now();

  // Check current time and ±window time steps
  for (let i = -window; i <= window; i++) {
    const timestamp = now + i * timeStep * 1000;
    const expectedToken = await generateTOTP(secret, timeStep, digits, timestamp);
    
    if (token === expectedToken) {
      return true;
    }
  }

  return false;
}

/**
 * Generate QR code data URL for TOTP enrollment
 * @param secret - Base32-encoded secret
 * @param issuer - Service name (e.g., "MoodMash")
 * @param accountName - User's email or username
 * @returns otpauth:// URI for QR code
 */
export function generateTOTPUri(
  secret: string,
  issuer: string,
  accountName: string
): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30'
  });

  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params}`;
}

/**
 * Generate QR code as SVG
 * Simple QR code generator for TOTP URIs
 */
export async function generateQRCode(text: string): Promise<string> {
  // For production, use a proper QR code library
  // This is a placeholder that generates a data URL
  // In reality, you'd use qrcode.js or similar
  
  // For now, return a placeholder that instructs to use the URI
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="white"/>
      <text x="100" y="100" text-anchor="middle" font-size="12" fill="black">
        Scan with authenticator app
      </text>
      <text x="100" y="120" text-anchor="middle" font-size="10" fill="gray">
        Or enter secret manually
      </text>
    </svg>
  `)}`;
}

/**
 * Generate backup codes
 * @param count - Number of codes to generate (default: 10)
 * @returns Array of backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const buffer = new Uint8Array(5); // 40 bits = ~8 characters in base32
    crypto.getRandomValues(buffer);
    const code = base32Encode(buffer).substring(0, 8);
    // Format as XXXX-XXXX for readability
    codes.push(`${code.substring(0, 4)}-${code.substring(4, 8)}`);
  }
  
  return codes;
}

/**
 * Hash backup code for storage
 */
export async function hashBackupCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.replace('-', ''));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<boolean> {
  const hash = await hashBackupCode(code);
  return hashedCodes.includes(hash);
}

/**
 * HOTP (HMAC-based One-Time Password) for hardware tokens
 * @param secret - Base32-encoded secret
 * @param counter - Counter value
 * @param digits - Number of digits (default: 6)
 * @returns HOTP code as string
 */
export async function generateHOTP(
  secret: string,
  counter: number,
  digits: number = 6
): Promise<string> {
  // Convert counter to 8-byte buffer (big-endian)
  const counterBuffer = new Uint8Array(8);
  let mutableCounter = counter;
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = mutableCounter & 0xff;
    mutableCounter >>>= 8;
  }

  // Decode secret
  const keyBytes = base32Decode(secret);

  // Generate HMAC-SHA1
  const hmac = await hmacSha1(keyBytes, counterBuffer);

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  // Generate digits
  const otp = (code % Math.pow(10, digits)).toString();
  return otp.padStart(digits, '0');
}

/**
 * Verify HOTP code
 * @param token - User-provided HOTP code
 * @param secret - Base32-encoded secret
 * @param counter - Current counter value
 * @param window - Look-ahead window (default: 10)
 * @param digits - Number of digits (default: 6)
 * @returns New counter if valid, -1 otherwise
 */
export async function verifyHOTP(
  token: string,
  secret: string,
  counter: number,
  window: number = 10,
  digits: number = 6
): Promise<number> {
  // Check current counter and look-ahead window
  for (let i = 0; i < window; i++) {
    const expectedToken = await generateHOTP(secret, counter + i, digits);
    
    if (token === expectedToken) {
      return counter + i + 1; // Return next counter
    }
  }

  return -1; // Invalid
}

/**
 * Format secret for display (groups of 4 characters)
 * @param secret - Base32-encoded secret
 * @returns Formatted secret (e.g., "ABCD EFGH IJKL MNOP")
 */
export function formatSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') || secret;
}
