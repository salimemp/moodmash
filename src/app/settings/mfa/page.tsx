'use client';

import { AlertCircle, CheckCircle, Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Define the session user type with MFA properties
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  mfaEnabled?: boolean;
}

interface ExtendedSession {
  user?: ExtendedUser;
  expires: string;
}

// At the top of the file, add a type for errors
interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;
  
  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError));
  }
}

export default function MFAPage() {
  // Use optional chaining to handle the case when useSession is not available
  const sessionData = useSession();
  const session = sessionData?.data as ExtendedSession | null;
  const status = sessionData?.status || 'unauthenticated';

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  } | null>(null);

  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if MFA is already enabled
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Check if user has MFA enabled
    setMfaEnabled(session.user?.mfaEnabled || false);
    setLoading(false);
  }, [session, status, router]);

  // Start MFA setup
  const handleSetupMFA = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to set up MFA');
      }

      const data = await response.json();
      setSetupData(data);
    } catch (err: unknown) {
      const error = toErrorWithMessage(err);
      setError(error.message || 'An error occurred while setting up MFA');
    } finally {
      setLoading(false);
    }
  };

  // Verify MFA code and enable MFA
  const handleVerifyMFA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!setupData) {
      setError('MFA setup data is missing. Please restart the setup process.');
      return;
    }

    if (!verificationCode) {
      setError('Please enter a verification code');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: verificationCode,
          secret: setupData.secret,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to verify MFA code');
      }

      setSuccess('MFA has been successfully enabled for your account');
      setMfaEnabled(true);

      // Refresh session to update MFA status
      router.refresh();
    } catch (err: unknown) {
      const error = toErrorWithMessage(err);
      setError(error.message || 'An error occurred while verifying the MFA code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Disable MFA
  const handleDisableMFA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!disableCode) {
      setError('Please enter a verification code');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: disableCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to disable MFA');
      }

      setSuccess('MFA has been successfully disabled for your account');
      setMfaEnabled(false);
      setSetupData(null);

      // Refresh session to update MFA status
      router.refresh();
    } catch (err: unknown) {
      const error = toErrorWithMessage(err);
      setError(error.message || 'An error occurred while disabling MFA');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-3xl font-bold mb-6">Two-Factor Authentication</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <h3 className="font-semibold">Error</h3>
          </div>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <h3 className="font-semibold">Success</h3>
          </div>
          <p className="mt-1">{success}</p>
        </div>
      )}

      {mfaEnabled ? (
        <div className="bg-white border rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Two-Factor Authentication is Enabled
            </h2>
            <p className="text-gray-500 mt-1">
              Your account is protected with an additional layer of security.
            </p>
          </div>
          <div className="p-6">
            <p className="mb-4">
              To disable two-factor authentication, enter a verification code from your
              authenticator app.
            </p>
            <form onSubmit={handleDisableMFA}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="disableCode" className="block text-sm font-medium">
                    Verification Code
                  </label>
                  <input
                    id="disableCode"
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter 6-digit code"
                    value={disableCode}
                    onChange={e => setDisableCode(e.target.value)}
                    maxLength={6}
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Disabling...
                    </>
                  ) : (
                    <>
                      <ShieldOff className="mr-2 h-4 w-4" />
                      Disable Two-Factor Authentication
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Set Up Two-Factor Authentication</h2>
            <p className="text-gray-500 mt-1">
              Protect your account with an additional layer of security by requiring a verification
              code when you sign in.
            </p>
          </div>
          <div className="p-6">
            {!setupData ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-center mb-4">
                  Two-factor authentication adds an extra layer of security to your account. Once
                  enabled, you&apos;ll need to provide a verification code from your authenticator app
                  when signing in.
                </p>
                <button
                  onClick={handleSetupMFA}
                  disabled={loading}
                  className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Set Up Two-Factor Authentication'
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">1. Scan QR Code</h3>
                  <p className="text-sm text-gray-500">
                    Scan this QR code with your authenticator app (like Google Authenticator, Authy,
                    or Microsoft Authenticator).
                  </p>
                  <div className="flex justify-center p-4 bg-white border rounded-lg">
                    <Image
                      src={setupData.qrCodeUrl}
                      alt="QR Code for MFA setup"
                      width={200}
                      height={200}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">2. Manual Setup</h3>
                  <p className="text-sm text-gray-500">
                    If you can&apos;t scan the QR code, enter this code manually in your authenticator
                    app:
                  </p>
                  <div className="p-3 bg-gray-100 rounded-md font-mono text-center break-all">
                    {setupData.secret}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">3. Verify Setup</h3>
                  <p className="text-sm text-gray-500">
                    Enter the verification code from your authenticator app to complete the setup.
                  </p>
                  <form onSubmit={handleVerifyMFA}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="verificationCode" className="block text-sm font-medium">
                          Verification Code
                        </label>
                        <input
                          id="verificationCode"
                          type="text"
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="Enter 6-digit code"
                          value={verificationCode}
                          onChange={e => setVerificationCode(e.target.value)}
                          maxLength={6}
                        />
                      </div>
                      <button
                        type="submit"
                        className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify and Enable'
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">4. Save Backup Codes</h3>
                  <p className="text-sm text-gray-500">
                    Save these backup codes in a secure place. You can use them to sign in if you
                    lose access to your authenticator app.
                  </p>
                  <div className="p-3 bg-gray-100 rounded-md font-mono text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      {setupData.backupCodes.map((code, index) => (
                        <div key={index} className="p-1">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
