import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/components/layout/main-layout';
import Head from 'next/head';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card/card';
import { Button } from '@/components/ui/button/button';
import { CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) return;

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Your email has been verified successfully!');
        } else {
          setStatus('error');
          const errorMessage = data.message || 'Failed to verify your email. The link may have expired or is invalid.';
          setMessage(errorMessage);
          console.error('Email verification error:', errorMessage);
        }
      } catch (err) {
        setStatus('error');
        const errorMessage = 'An error occurred during verification. Please try again.';
        setMessage(errorMessage);
        console.error('Email verification error:', err);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <>
      <Head>
        <title>Verify Email - MoodMash</title>
        <meta name="description" content="Verify your email address" />
      </Head>
      <MainLayout>
        <div className="flex justify-center items-center py-10">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                {status === 'loading' && (
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                )}
                {status === 'success' && (
                  <CheckCircle className="w-16 h-16 text-green-500" />
                )}
                {status === 'error' && (
                  <XCircle className="w-16 h-16 text-red-500" />
                )}
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                {status === 'loading' && 'Verifying Email'}
                {status === 'success' && 'Email Verified'}
                {status === 'error' && 'Verification Failed'}
              </CardTitle>
              <CardDescription className="text-center">
                {message}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status === 'success' && (
                <p className="text-center text-sm text-muted-foreground">
                  You can now sign in to your account using your email and password.
                </p>
              )}
              {status === 'error' && (
                <p className="text-center text-sm text-muted-foreground">
                  You can request a new verification link from your profile or contact support if the issue persists.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button asChild>
                <Link href="/auth/signin">
                  {status === 'success' ? 'Sign In' : 'Back to Sign In'}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    </>
  );
} 