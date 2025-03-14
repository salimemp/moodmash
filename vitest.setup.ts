import '@testing-library/jest-dom';
import { config } from 'dotenv';
import React from 'react';
import { beforeEach, vi } from 'vitest';
import './jest.mock';

// Load environment variables
config({ path: '.env.test' });

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '',
    query: {},
    asPath: '',
    push: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    isFallback: false,
  }),
}));

// Mock Next.js image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { src, alt, ...rest });
  },
}));

// Mock Next.js head
vi.mock('next/head', () => {
  return {
    __esModule: true,
    default: (props: { children: React.ReactNode }) => {
      return React.createElement(React.Fragment, null, props.children);
    },
  };
});

// Set up path mapping for imports with '@/'
vi.mock('@/pages/api/auth/webauthn/credentials/index');
vi.mock('@/pages/api/auth/webauthn/credentials/[id]');

// Set up global fetch mock
global.fetch = vi.fn();

// Clean up mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
