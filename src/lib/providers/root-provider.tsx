'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import QueryProvider from './query-provider';

interface RootProviderProps {
  children: ReactNode;
}

export function RootProvider({ children }: RootProviderProps) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="mood-mash-theme">
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}
