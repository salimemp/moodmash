import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the database
vi.mock('@/lib/db/prisma', () => {
  const mockUpdate = vi.fn().mockResolvedValue({
    id: 'test-user-id',
    mfaSecret: 'test-secret',
    mfaBackupCodes: ['backup1', 'backup2'],
    mfaEnabled: false
  });

  const mockFindUnique = vi.fn().mockResolvedValue({
    id: 'test-user-id',
    mfaSecret: 'test-secret',
    mfaBackupCodes: ['backup1', 'backup2'],
    mfaEnabled: false
  });

  return {
    db: {
      user: {
        update: mockUpdate,
        findUnique: mockFindUnique
      }
    }
  };
});

// Mock nanoid
vi.mock('nanoid', () => {
  return {
    nanoid: vi.fn().mockImplementation((length) => `nanoid-mock-${length}`)
  };
});

// Mock authenticator
vi.mock('otplib', () => {
  return {
    authenticator: {
      generateSecret: vi.fn().mockReturnValue('test-secret'),
      keyuri: vi.fn().mockReturnValue('otpauth://totp/MoodMash:test@example.com?secret=test-secret&issuer=MoodMash'),
      verify: vi.fn().mockImplementation(({ token, secret }) => {
        return token === '123456' && secret === 'test-secret';
      })
    }
  };
});

// Mock QRCode
vi.mock('qrcode', () => {
  return {
    default: {
      toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock-qr-code')
    }
  };
});

// Import after mocking
import {
  generateMfaSecret,
  generateTOTPQRCode,
  verifyBackupCode,
  verifyTOTP
} from '@/lib/auth/mfa';
import { db } from '@/lib/db/prisma';


// Tests for Mfa functionality
// Validates authentication behaviors and security properties

// Tests for the authentication mfa module
// Validates security, functionality, and edge cases
// Tests for mfa module functionality
// Validates expected behavior in various scenarios
describe('MFA Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Tests for generatemfasecret functionality
// Ensures items are correctly generated with expected properties
describe('generateMfaSecret', () => {
    // Verifies generation functionality
// Ensures generated items meet expected criteria
it('should generate MFA secret, QR code URL, and backup codes', async () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';

      const result = await generateMfaSecret(userId, email);

      expect(result).toEqual({
        secret: 'test-secret',
        qrCodeUrl: 'otpauth://totp/MoodMash:test@example.com?secret=test-secret&issuer=MoodMash',
        backupCodes: expect.any(Array)
      });

      // Verify function calls
      expect(authenticator.generateSecret).toHaveBeenCalled();
      expect(authenticator.keyuri).toHaveBeenCalledWith(email, expect.any(String), 'test-secret');
      
      // Verify DB update
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          mfaSecret: 'test-secret',
          mfaBackupCodes: expect.any(Array)
        }
      });

      // Check backup codes
      expect(result.backupCodes.length).toBeGreaterThan(0);
      // Using private function, can't test directly
    });

    // Verifies should handle errors gracefully
// Ensures expected behavior in this scenario
it('should handle errors gracefully', async () => {
      // Mock the database to throw an error
      vi.mocked(db.user.update).mockRejectedValueOnce(new Error('Database error'));

      const userId = 'test-user-id';
      const email = 'test@example.com';

      await expect(generateMfaSecret(userId, email)).rejects.toThrow('Database error');
    });
  });

  // Tests for verifytotp functionality
// Validates expected behavior in various scenarios
describe('verifyTOTP', () => {
    // Verifies validation logic
// Ensures data meets expected format and requirements
it('should verify valid TOTP token', () => {
      const token = '123456';
      const secret = 'test-secret';

      const result = verifyTOTP(token, secret);

      expect(result).toBe(true);
      expect(authenticator.verify).toHaveBeenCalledWith({ token, secret });
    });

    // Verifies validation logic
// Ensures data meets expected format and requirements
it('should reject invalid TOTP token', () => {
      const token = 'invalid';
      const secret = 'test-secret';

      const result = verifyTOTP(token, secret);

      expect(result).toBe(false);
      expect(authenticator.verify).toHaveBeenCalledWith({ token, secret });
    });

    // Verifies should handle errors during verification
// Ensures expected behavior in this scenario
it('should handle errors during verification', () => {
      // Mock authenticator to throw an error
      vi.mocked(authenticator.verify).mockImplementationOnce(() => {
        throw new Error('Verification error');
      });

      const token = '123456';
      const secret = 'test-secret';

      const result = verifyTOTP(token, secret);

      expect(result).toBe(false);
    });
  });

  // Tests for verifybackupcode functionality
// Validates expected behavior in various scenarios
describe('verifyBackupCode', () => {
    // Verifies validation logic
// Ensures data meets expected format and requirements
it('should verify and consume a valid backup code', async () => {
      const userId = 'test-user-id';
      const code = 'backup1';

      const result = await verifyBackupCode(userId, code);

      expect(result).toBe(true);
      
      // Verify DB calls
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { mfaBackupCodes: true }
      });
      
      // Should update by removing used code
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          mfaBackupCodes: ['backup2'] // Only backup2 should remain
        }
      });
    });

    // Verifies validation logic
// Ensures data meets expected format and requirements
it('should reject invalid backup code', async () => {
      const userId = 'test-user-id';
      const code = 'invalid-code';

      const result = await verifyBackupCode(userId, code);

      expect(result).toBe(false);
      
      // Should not update the backup codes
      expect(db.user.update).not.toHaveBeenCalled();
    });

    // Verifies should handle user not found
// Ensures expected behavior in this scenario
it('should handle user not found', async () => {
      // Mock findUnique to return null (user not found)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);

      const userId = 'nonexistent-user';
      const code = 'backup1';

      const result = await verifyBackupCode(userId, code);

      expect(result).toBe(false);
      expect(db.user.update).not.toHaveBeenCalled();
    });

    // Verifies should handle user with no backup codes
// Ensures expected behavior in this scenario
it('should handle user with no backup codes', async () => {
      // Mock findUnique to return user without backup codes
      vi.mocked(db.user.findUnique).mockResolvedValueOnce({
        mfaBackupCodes: []
      } as any);

      const userId = 'test-user-id';
      const code = 'backup1';

      const result = await verifyBackupCode(userId, code);

      expect(result).toBe(false);
      expect(db.user.update).not.toHaveBeenCalled();
    });
  });

  // Tests for generatetotpqrcode functionality
// Ensures items are correctly generated with expected properties
describe('generateTOTPQRCode', () => {
    // Verifies generation functionality
// Ensures generated items meet expected criteria
it('should generate a QR code data URL', async () => {
      const secret = 'test-secret';
      const email = 'test@example.com';

      const result = await generateTOTPQRCode(secret, email);

      expect(result).toBe('data:image/png;base64,mock-qr-code');
      expect(authenticator.keyuri).toHaveBeenCalledWith(email, 'MoodMash', secret);
      expect(QRCode.toDataURL).toHaveBeenCalledWith('otpauth://totp/MoodMash:test@example.com?secret=test-secret&issuer=MoodMash');
    });

    // Verifies should handle qr code generation errors
// Ensures expected behavior in this scenario
it('should handle QR code generation errors', async () => {
      // Mock QRCode to throw an error
      vi.mocked(QRCode.toDataURL).mockRejectedValueOnce(new Error('QR code error'));

      const secret = 'test-secret';
      const email = 'test@example.com';

      await expect(generateTOTPQRCode(secret, email)).rejects.toThrow('Failed to generate QR code');
    });
  });
}); 