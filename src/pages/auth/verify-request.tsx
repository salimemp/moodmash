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
import { MailIcon } from 'lucide-react';

export default function VerifyRequest() {
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
                <div className="bg-primary/10 p-3 rounded-full">
                  <MailIcon className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center">Check your email</CardTitle>
              <CardDescription className="text-center">
                A sign in link has been sent to your email address.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the link in the email to sign in to your account.
              </p>
              <p className="text-sm text-muted-foreground">
                If you don&apos;t see the email, check your spam folder.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button asChild variant="outline">
                <Link href="/auth/signin">Back to sign in</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    </>
  );
}
