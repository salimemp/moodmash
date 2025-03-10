import React from 'react';
import Head from 'next/head';
import ErrorTest from '@/components/ErrorTest';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorFallback from '@/components/ErrorFallback';
import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';

const ErrorTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Error Testing | MoodMash</title>
        <meta name="description" content="Test error handling and Sentry integration" />
      </Head>

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Error Handling Test Page</h1>
          <p className="mt-2 text-gray-600">
            This page demonstrates error handling capabilities with Sentry integration
          </p>
        </div>

        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
            ← Back to Home
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Component with its own error boundary */}
          <div>
            <h2 className="text-xl font-semibold mb-4">With Error Boundary</h2>
            <ErrorBoundary
              onError={(error, errorInfo) => {
                Sentry.captureException(error, {
                  contexts: {
                    react: {
                      componentStack: errorInfo.componentStack,
                    },
                  },
                });
              }}
              fallback={<ErrorFallback />}
            >
              <ErrorTest />
            </ErrorBoundary>
          </div>

          {/* Component without its own error boundary (will use the app-level one) */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Without Error Boundary</h2>
            <p className="text-sm text-gray-500 mb-4">
              This component relies on the app-level error boundary. If it crashes, the entire page will show the error UI.
            </p>
            <ErrorTest />
          </div>
        </div>

        <div className="mt-12 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">About Error Handling</h2>
          <div className="prose">
            <p>
              This page demonstrates several error handling mechanisms:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>React Error Boundaries:</strong> Catch errors during rendering, in lifecycle methods, and in constructors.
              </li>
              <li>
                <strong>Sentry Integration:</strong> Automatically captures unhandled exceptions and sends them to Sentry.
              </li>
              <li>
                <strong>Custom Error UI:</strong> Provides a user-friendly interface when errors occur.
              </li>
              <li>
                <strong>Global Error Handler:</strong> Catches errors at the application level.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorTestPage; 