import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Inter } from 'next/font/google';
import React, { Suspense } from 'react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Lazy load non-critical components
const ThemeSwitcher = React.lazy(() => import('@/components/ThemeSwitcher'));
const LanguageSwitcher = React.lazy(() => import('@/components/LanguageSwitcher'));
const NotificationsPanel = React.lazy(() => import('@/components/NotificationsPanel'));

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="sticky top-0 z-10 bg-background border-b">
          <div className="container flex justify-between items-center py-3">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">MoodMash</h1>
              {/* Navigation components here */}
            </div>
            <div className="flex items-center gap-3">
              <Suspense fallback={<LoadingSpinner size="sm" />}>
                <ThemeSwitcher />
              </Suspense>
              <Suspense fallback={<LoadingSpinner size="sm" />}>
                <LanguageSwitcher />
              </Suspense>
              <Suspense fallback={<LoadingSpinner size="sm" />}>
                <NotificationsPanel />
              </Suspense>
            </div>
          </div>
        </header>
        <main className="container py-4">
          <Suspense fallback={<LoadingSpinner size="lg" />}>
            {children}
          </Suspense>
        </main>
        <footer className="container py-4 border-t mt-8">
          <div className="text-center text-muted-foreground">
            © {new Date().getFullYear()} MoodMash
          </div>
        </footer>
      </body>
    </html>
  );
} 