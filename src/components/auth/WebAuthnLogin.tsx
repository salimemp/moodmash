import { useState } from 'react';
import { Button } from '@/components/ui/button/button';
import { toast } from 'sonner';
import { startAuthentication } from '@simplewebauthn/browser';
import { Loader2, Fingerprint } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function WebAuthnLogin() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    try {
      setIsAuthenticating(true);

      // 1. Get authentication options from the server
      const optionsResponse = await fetch('/api/auth/webauthn/login-options');
      
      if (!optionsResponse.ok) {
        const error = await optionsResponse.json();
        throw new Error(error.message || 'Failed to get authentication options');
      }
      
      const { options, requestId } = await optionsResponse.json();

      // 2. Start the authentication process in the browser
      const credential = await startAuthentication(options);

      // 3. Send the credential to the server for verification
      const verificationResponse = await fetch('/api/auth/webauthn/login-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential, requestId }),
      });

      if (!verificationResponse.ok) {
        const error = await verificationResponse.json();
        toast.error(error.message || 'Failed to verify authentication');
        throw new Error(error.message || 'Failed to verify authentication');
      }

      // Authentication was successful, now handle the response
      await verificationResponse.json();
      
      // 4. Show success message and redirect
      toast.success('Signed in successfully!');
      
      // Redirect to dashboard or home page
      router.push('/dashboard');
      router.refresh();
      
    } catch (error) {
      console.error('WebAuthn authentication error:', error);
      toast.error('Failed to sign in with passkey', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Button
      onClick={handleLogin}
      disabled={isAuthenticating}
      variant="outline"
      className="w-full"
    >
      {isAuthenticating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <Fingerprint className="mr-2 h-4 w-4" />
          Sign in with passkey
        </>
      )}
    </Button>
  );
} 