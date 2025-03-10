import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { db } from '@/lib/db/prisma';
import crypto from 'crypto';
import { nanoid } from 'nanoid';

// Generate a new MFA secret for a user
export async function generateMfaSecret(
  userId: string,
  email: string
): Promise<{
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}> {
  // Generate a new secret
  const secret = authenticator.generateSecret();
  
  // Generate the QR code URL
  const serviceName = process.env.MFA_SERVICE_NAME || 'MoodMash';
  const qrCodeUrl = authenticator.keyuri(email, serviceName, secret);
  
  // Generate backup codes
  const backupCodes = generateBackupCodes();
  
  // Store backup codes in the database
  await db.user.update({
    where: { id: userId },
    data: {
      mfaSecret: secret,
      mfaBackupCodes: backupCodes,
      // Note: mfaEnabled remains false until verified
    },
  });
  
  return {
    secret,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * Generate backup codes for MFA
 */
function generateBackupCodes(count = 10, length = 8): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    codes.push(nanoid(length));
  }
  
  return codes;
}

// Verify a TOTP code
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

// Enable MFA for a user
export async function enableMfa(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: true,
    },
  });
}

// Disable MFA for a user
export async function disableMfa(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: [],
    },
  });
}

// Verify a backup code
export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { mfaBackupCodes: true },
  });
  
  if (!user || !user.mfaBackupCodes || user.mfaBackupCodes.length === 0) {
    return false;
  }
  
  const backupCodes = user.mfaBackupCodes;
  const codeIndex = backupCodes.indexOf(code);
  
  if (codeIndex === -1) {
    return false;
  }
  
  // Remove the used backup code
  const updatedBackupCodes = [...backupCodes];
  updatedBackupCodes.splice(codeIndex, 1);
  
  // Update the user's backup codes
  await db.user.update({
    where: { id: userId },
    data: {
      mfaBackupCodes: updatedBackupCodes,
    },
  });
  
  return true;
}

// Function to generate a QR code for TOTP setup
export async function generateTOTPQRCode(secret: string, email: string): Promise<string> {
  try {
    const otpauth = authenticator.keyuri(email, 'MoodMash', secret);
    return await QRCode.toDataURL(otpauth);
  } catch {
    throw new Error('Failed to generate QR code');
  }
}
