import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// For v4, NextAuth is directly the default export and doesn't have these sub-exports
// We'll provide equivalent exports
export const handlers = NextAuth(authConfig);
export default handlers;

// These are not directly available in v4, but we can provide placeholder functions
// that can be replaced with actual implementations from next-auth/react
export const auth = async () => ({
  user: null,
  status: 'unauthenticated',
});

export const signIn = () => {
  throw new Error('Use next-auth/react signIn instead');
};

export const signOut = () => {
  throw new Error('Use next-auth/react signOut instead');
};
