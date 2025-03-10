import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card/card';
import { Button } from '@/components/ui/button/button';
import { GithubIcon, GoogleIcon } from '@/components/ui/icons';
import { WebAuthnLogin } from '@/components/auth/WebAuthnLogin';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { callbackUrl } = router.query;
  const redirectUrl = typeof callbackUrl === 'string' ? callbackUrl : '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push(redirectUrl);
      } else {
        const errorMessage = result?.error || 'Authentication failed';
        setError(errorMessage);
        console.error('Sign in error:', errorMessage);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      console.error('Sign in error:', err);
      const errorMessage = 'An error occurred. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = (provider: string) => {
    setIsLoading(true);
    signIn(provider, { callbackUrl: redirectUrl });
  };

  return (
    <>
      <Head>
        <title>Sign In - MoodMash</title>
        <meta name="description" content="Sign in to your MoodMash account" />
      </Head>
      <MainLayout>
        <div className="flex justify-center items-center py-10">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Sign In
              </CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to sign in to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleOAuthSignIn('google')}
                  >
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleOAuthSignIn('github')}
                  >
                    <GithubIcon className="mr-2 h-4 w-4" />
                    GitHub
                  </Button>
                </div>
                
                {/* WebAuthn Login Button */}
                <WebAuthnLogin />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
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
                    <div className="grid gap-2">
                      <label htmlFor="password" className="text-sm font-medium">
                        Password
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
                    {error && (
                      <div className="text-sm text-red-500">{error}</div>
                    )}
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-center text-muted-foreground">
                <Link 
                  href="/auth/reset-password"
                  className="text-primary underline underline-offset-4 hover:text-primary/90"
                >
                  Forgot your password?
                </Link>
              </div>
              <div className="text-sm text-center text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link 
                  href="/auth/register"
                  className="text-primary underline underline-offset-4 hover:text-primary/90"
                >
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    </>
  );
} 