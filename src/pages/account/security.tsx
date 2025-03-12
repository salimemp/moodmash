import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card/card';
import { Button } from '@/components/ui/button/button';
import { WebAuthnRegister } from '@/components/auth/WebAuthnRegister';
import { toast } from 'sonner';
import { KeyRound, Trash2 } from 'lucide-react';

type Credential = {
  id: string;
  deviceType: string | null;
  friendlyName: string | null;
  createdAt: string;
  lastUsed: string;
};

export default function SecuritySettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account/security');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchCredentials();
    }
  }, [session]);

  const fetchCredentials = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/webauthn/credentials');

      if (!response.ok) {
        throw new Error('Failed to fetch credentials');
      }

      const data = await response.json();
      setCredentials(data.credentials);
    } catch (error) {
      console.error('Error fetching credentials:', error);
      toast.error('Failed to load passkeys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (!confirm('Are you sure you want to delete this passkey?')) {
      return;
    }

    try {
      const response = await fetch(`/api/auth/webauthn/credentials/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete credential');
      }

      toast.success('Passkey deleted successfully');
      fetchCredentials();
    } catch (error) {
      console.error('Error deleting credential:', error);
      toast.error('Failed to delete passkey');
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-10">
          <p>Loading...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Security Settings - MoodMash</title>
        <meta name="description" content="Manage your security settings" />
      </Head>
      <MainLayout>
        <div className="container py-10">
          <h1 className="text-3xl font-bold mb-6">Security Settings</h1>

          <div className="grid gap-6">
            {/* Two-Factor Authentication Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account by requiring a verification code
                  when you sign in.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {session?.user?.mfaEnabled ? 'Enabled' : 'Not enabled'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {session?.user?.mfaEnabled
                        ? 'Your account is protected with two-factor authentication.'
                        : 'Protect your account with two-factor authentication.'}
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/settings/mfa')}
                    variant={session?.user?.mfaEnabled ? 'outline' : 'default'}
                  >
                    {session?.user?.mfaEnabled ? 'Manage' : 'Enable'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Passkeys Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Passkeys</CardTitle>
                <CardDescription>
                  Passkeys let you sign in without a password using biometrics or security keys.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <WebAuthnRegister />

                {isLoading ? (
                  <p>Loading your passkeys...</p>
                ) : credentials.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Your passkeys</h3>
                    <div className="border rounded-md divide-y">
                      {credentials.map(credential => (
                        <div key={credential.id} className="p-4 flex justify-between items-center">
                          <div>
                            <div className="flex items-center">
                              <KeyRound className="h-4 w-4 mr-2" />
                              <span className="font-medium">
                                {credential.friendlyName || 'Unnamed passkey'}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Added on {new Date(credential.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCredential(credential.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p>You haven&apos;t added any passkeys yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </>
  );
}
