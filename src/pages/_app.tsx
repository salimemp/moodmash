import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { RootProvider } from "@/lib/providers/root-provider";
import { SessionProvider } from 'next-auth/react';
import ErrorBoundary from "@/components/ErrorBoundary";
import ErrorFallback from "@/components/ErrorFallback";
import * as Sentry from '@sentry/nextjs';
import { useEffect } from "react";
import { appWithTranslation } from 'next-i18next';
import { DirectionProvider } from "@/context/DirectionContext";
import nextI18nConfig from '../../next-i18next.config';

function App({ Component, pageProps }: AppProps) {
  // Report errors to Sentry
  const onError = (error: Error, errorInfo: React.ErrorInfo) => {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  };

  // Log when app mounts (useful for debugging)
  useEffect(() => {
    console.log('App mounted');
  }, []);

  return (
    <ErrorBoundary 
      onError={onError}
      fallback={<ErrorFallback />}
    >
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
