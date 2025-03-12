import { useState } from 'react';
import { Button } from '@/components/ui/button/button';
import { toast } from 'sonner';
import { startRegistration } from '@simplewebauthn/browser';
import { Loader2, KeyRound } from 'lucide-react';

export function WebAuthnRegister() {
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async () => {
    try {
      setIsRegistering(true);

      // 1. Get registration options from the server
      const optionsResponse = await fetch('/api/auth/webauthn/register-options');

      if (!optionsResponse.ok) {
        const error = await optionsResponse.json();
        throw new Error(error.message || 'Failed to get registration options');
      }

      const { options, challengeId } = await optionsResponse.json();

      // 2. Start the registration process in the browser
      const credential = await startRegistration(options);

      // 3. Send the credential to the server for verification
      const verificationResponse = await fetch('/api/auth/webauthn/register-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential, challengeId }),
      });

      if (!verificationResponse.ok) {
        const error = await verificationResponse.json();
        toast.error(error.message || 'Failed to verify registration');
        throw new Error(error.message || 'Failed to verify registration');
      }

      // Registration was successful, proceed
      await verificationResponse.json();

      // 4. Show success message
      toast.success('Passkey registered successfully!', {
        description: 'You can now use this device to sign in.',
      });
    } catch (error) {
      console.error('WebAuthn registration error:', error);
      toast.error('Failed to register passkey', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Button onClick={handleRegister} disabled={isRegistering} variant="outline" className="w-full">
      {isRegistering ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Registering...
        </>
      ) : (
        <>
          <KeyRound className="mr-2 h-4 w-4" />
          Register passkey
        </>
      )}
    </Button>
  );
}
