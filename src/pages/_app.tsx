import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorFallback from '@/components/ErrorFallback';
import { DirectionProvider } from '@/context/DirectionContext';
import { RootProvider } from '@/lib/providers/root-provider';
import '@/styles/globals.css';
import * as Sentry from '@sentry/nextjs';
import { SessionProvider } from 'next-auth/react';
import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import nextI18nConfig from '../../next-i18next.config';

function App({ Component, pageProps }: AppProps) {
  // Error handling for the app
  const onError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Send to error reporting service
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  };

  // Initialize app
  useEffect(() => {
    // App initialization code here if needed
  }, []);

  return (
    <ErrorBoundary onError={onError} fallback={<ErrorFallback />}>
      <SessionProvider session={pageProps.session}>
        <DirectionProvider>
          <RootProvider>
            <Component {...pageProps} />
          </RootProvider>
        </DirectionProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}

export default appWithTranslation(App, nextI18nConfig);
