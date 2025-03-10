import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card/card';
import { Button } from '@/components/ui/button/button';
import { MailIcon } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (err: unknown) {
      console.error('Password reset request error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password - MoodMash</title>
        <meta name="description" content="Reset your MoodMash password" />
      </Head>
      <MainLayout>
        <div className="flex justify-center items-center py-10">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <MailIcon className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                {isSubmitted ? 'Check Your Email' : 'Forgot Password'}
              </CardTitle>
              <CardDescription className="text-center">
                {isSubmitted
                  ? `We've sent a password reset link to ${email}`
                  : "Enter your email address and we'll send you a password reset link"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isSubmitted ? (
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    {error && (
                      <div className="text-sm text-red-500">{error}</div>
                    )}
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Please check your email for the password reset link. The link will expire in 1 hour.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    If you don&apos;t see the email, check your spam folder.
                  </p>
                </div>
              )}
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
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Remember your password? <Link href="/auth/signin" className="text-blue-600 hover:text-blue-800">Sign in</Link>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Don&apos;t have an account yet? <Link href="/auth/signup" className="text-blue-600 hover:text-blue-800">Sign up</Link>
          </p>
        </div>
      </MainLayout>
    </>
  );
} 