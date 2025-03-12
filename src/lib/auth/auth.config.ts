import type { NextAuthOptions, User } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { db } from '@/lib/db/prisma';
import { comparePasswords } from '@/lib/auth/password';

// Extend the User type to include MFA fields
interface ExtendedUser extends User {
  mfaEnabled?: boolean;
}

// Extend the session user type to include id and MFA fields
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      mfaEnabled?: boolean;
    };
  }

  interface JWT {
    id: string;
    mfaEnabled?: boolean;
  }
}

export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await db.user.findUnique({
          where: {
            email,
          },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
            mfaEnabled: true,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordsMatch = await comparePasswords(password, user.password);

        if (!passwordsMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          mfaEnabled: user.mfaEnabled,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Add MFA status if available
        if ('mfaEnabled' in user) {
          token.mfaEnabled = (user as ExtendedUser).mfaEnabled;
        }
      }

      // If user has MFA enabled, check if they've completed MFA verification
      if (token.mfaEnabled) {
        // You can add additional checks here if needed
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.mfaEnabled = token.mfaEnabled as boolean | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    newUser: '/auth/register',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
};
