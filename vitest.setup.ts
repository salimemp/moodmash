import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import React from 'react';

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    basePath: '',
    locale: 'en',
    locales: ['en'],
    defaultLocale: 'en',
    isReady: true,
    isLocaleDomain: false,
    isPreview: false,
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  // eslint-disable-next-line react/display-name
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { ...props });
  },
}));

// Mock next-auth
vi.mock('next-auth/react', () => {
  const originalModule = vi.importActual('next-auth/react');
  return {
    __esModule: true,
    ...originalModule,
    useSession: vi.fn(() => {
      return { data: null, status: 'unauthenticated' };
    }),
    signIn: vi.fn(),
    signOut: vi.fn(),
  };
});

// Clean up after each test
afterEach(() => {
  cleanup();
}); 