import { NextPage } from 'next';
import { ErrorProps } from 'next/error';
import Head from 'next/head';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { NextPageContext } from 'next';

interface CustomErrorProps extends ErrorProps {
  title?: string;
}

const CustomErrorPage: NextPage<CustomErrorProps> = ({ statusCode, title }) => {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureMessage(`Error ${statusCode}: ${title || 'Unknown error'}`, {
      level: 'error',
      tags: {
        page: '_error',
      },
    });
  }, [statusCode, title]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>Error {statusCode || 'Unknown'} | MoodMash</title>
      </Head>
      <div className="text-center p-8 max-w-md">
        <div className="flex justify-center mb-6">
          <AlertTriangle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {statusCode ? `Error ${statusCode}` : 'An error occurred'}
        </h1>
        <p className="text-gray-600 mb-6">
          {statusCode === 404
            ? 'We couldn&apos;t find the page you were looking for.'
            : 'We&apos;re sorry, but something went wrong on our end.'}
        </p>
        <div className="space-y-4">
          <Link href="/">
            <span className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Go back home
            </span>
          </Link>
          {statusCode !== 404 && (
            <p className="text-sm text-gray-500 mt-4">
              Our team has been notified of this issue and we&apos;re working to fix it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

interface ErrorWithStatusCode extends Error {
  statusCode?: number;
}

CustomErrorPage.getInitialProps = ({ res, err }: NextPageContext): CustomErrorProps => {
  const statusCode = res ? res.statusCode : err ? (err as ErrorWithStatusCode).statusCode : 404;
  return {
    statusCode: statusCode || 500, // Ensure statusCode is always a number
    title: err?.message || 'Unknown error',
  };
};

export default CustomErrorPage;
