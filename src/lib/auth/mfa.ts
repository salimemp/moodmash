import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { db } from '@/lib/db/prisma';
import crypto from 'crypto';

// Generate a new MFA secret for a user
export async function generateMfaSecret(
  userId: string,
  email: string
): Promise<{
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}> {
  // Generate a secret
  const secret = authenticator.generateSecret();

  // Generate an otpauth URL
  const serviceName = 'MoodMash';
  const otpauthUrl = authenticator.keyuri(email, serviceName, secret);

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

  // Generate backup codes (10 one-time use codes)
  const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex'));

  // Save MFA information to the user
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

// Verify a TOTP code
export function verifyTOTP(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
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

  if (!user || !user.mfaBackupCodes.includes(code)) {
    return false;
  }

  // Remove the used backup code
  await db.user.update({
    where: { id: userId },
    data: {
      mfaBackupCodes: {
        set: user.mfaBackupCodes.filter((c: string) => c !== code),
      },
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
