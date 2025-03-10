export async function register() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // Server instrumentation - only load and initialize in server environments
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      const Sentry = await import('@sentry/nextjs');
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        tracesSampleRate: 1.0,
        debug: process.env.NODE_ENV === 'development',
      });
    } 
    // Edge runtime instrumentation
    else if (process.env.NEXT_RUNTIME === 'edge') {
      const Sentry = await import('@sentry/nextjs');
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        tracesSampleRate: 1.0,
        debug: process.env.NODE_ENV === 'development',
      });
    }
  }
} 