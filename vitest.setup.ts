import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

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
  default: (props: any) => {
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

// Set up global fetch mock
global.fetch = vi.fn();

// Clean up mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
