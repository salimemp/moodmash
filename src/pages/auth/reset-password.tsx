import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card/card';
import { Button } from '@/components/ui/button/button';
import { CheckCircle, XCircle, KeyRound } from 'lucide-react';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Validate token when component mounts
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
        
        if (response.ok) {
          setIsValidToken(true);
        } else {
          const data = await response.json();
          const errorMessage = data.message || 'Invalid or expired token';
          setError(errorMessage);
          setIsValidToken(false);
          
          // Display the error message
          console.error('Token validation error:', errorMessage);
        }
      } catch (err: unknown) {
        console.error('Token validation error:', err);
        const errorMessage = 'An error occurred while validating the token';
        setIsValidToken(false);
        setError(errorMessage);
      }
      
      setTokenChecked(true);
    };

    if (token) {
      validateToken();
    } else {
      setIsValidToken(false);
      setTokenChecked(true);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });
      
      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const errorMessage = data.message || 'Failed to reset password';
        setError(errorMessage);
        
        // Display the error message
        console.error('Password reset error:', errorMessage);
      }
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      const errorMessage = 'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state when token is being validated
  if (!tokenChecked) {
    return (
      <>
        <Head>
          <title>Reset Password - MoodMash</title>
          <meta name="description" content="Reset your MoodMash password" />
        </Head>
        <MainLayout>
          <div className="flex justify-center items-center py-10">
            <Card className="w-full max-w-md">
              <CardHeader className="space-y-1">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
                <CardTitle className="text-2xl font-bold text-center">
                  Validating Link
                </CardTitle>
                <CardDescription className="text-center">
                  Please wait while we validate your password reset link...
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </MainLayout>
      </>
    );
  }

  // Invalid token
  if (isValidToken === false) {
    return (
      <>
        <Head>
          <title>Invalid Link - MoodMash</title>
          <meta name="description" content="Invalid password reset link" />
        </Head>
        <MainLayout>
          <div className="flex justify-center items-center py-10">
            <Card className="w-full max-w-md">
              <CardHeader className="space-y-1">
                <div className="flex justify-center mb-4">
                  <XCircle className="w-16 h-16 text-red-500" />
                </div>
                <CardTitle className="text-2xl font-bold text-center">
                  Invalid or Expired Link
                </CardTitle>
                <CardDescription className="text-center">
                  {error || 'The password reset link is invalid or has expired.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-sm text-muted-foreground">
                  Please request a new password reset link.
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button asChild>
                  <Link href="/auth/forgot-password">
                    Request New Link
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </MainLayout>
      </>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <>
        <Head>
          <title>Password Reset Success - MoodMash</title>
          <meta name="description" content="Password reset successful" />
        </Head>
        <MainLayout>
          <div className="flex justify-center items-center py-10">
            <Card className="w-full max-w-md">
              <CardHeader className="space-y-1">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <CardTitle className="text-2xl font-bold text-center">
                  Password Reset Successful
                </CardTitle>
                <CardDescription className="text-center">
                  Your password has been successfully reset.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-sm text-muted-foreground">
                  You can now sign in to your account with your new password.
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button asChild>
                  <Link href="/auth/signin">
                    Sign In
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </MainLayout>
      </>
    );
  }

  // Main reset password form
  return (
    <>
      <Head>
        <title>Reset Password - MoodMash</title>
        <meta name="description" content="Reset your MoodMash password" />
      </Head>
      <MainLayout>
        <div className="flex justify-center items-center py-10">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <KeyRound className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                Reset Password
              </CardTitle>
              <CardDescription className="text-center">
                Enter a new password for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      New Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  {error && (
                    <div className="text-sm text-red-500">{error}</div>
                  )}
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Resetting Password..." : "Reset Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <div className="text-sm text-center text-muted-foreground">
                <Link 
                  href="/auth/signin"
                  className="text-primary underline underline-offset-4 hover:text-primary/90"
                >
                  Back to sign in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    </>
  );
} 