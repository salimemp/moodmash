import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card/card';
import { Button } from '@/components/ui/button/button';

export default function AuthError() {
  const router = useRouter();
  const { error } = router.query;

  const errorMessages: Record<string, string> = {
    default: 'An error occurred during authentication.',
    configuration: 'There is a problem with the server configuration.',
    accessdenied: 'You do not have permission to sign in.',
    verification: 'The verification link has expired or has already been used.',
    'signin-required': 'You must be signed in to access this page.',
    'callback-url-mismatch': 'The callback URL is not configured correctly.',
    'oauth-callback-error': 'There was an error during the OAuth callback.',
    'oauth-sign-in-error': 'There was an error signing in with the OAuth provider.',
    'email-not-verified': 'Your email has not been verified.',
    'account-exists': 'An account already exists with a different provider.',
  };

  const errorMessage =
    error && typeof error === 'string'
      ? errorMessages[error] || errorMessages.default
      : errorMessages.default;

  return (
    <>
      <Head>
        <title>Authentication Error - MoodMash</title>
        <meta name="description" content="Authentication error" />
      </Head>
      <MainLayout>
        <div className="flex justify-center items-center py-10">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center text-red-500">
                Authentication Error
              </CardTitle>
              <CardDescription className="text-center">{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Please try again or contact support if the problem persists.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center space-x-4">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Button asChild>
                <Link href="/auth/signin">Try Again</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    </>
  );
}
