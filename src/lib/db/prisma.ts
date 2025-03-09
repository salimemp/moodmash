import { PrismaClient } from '@prisma/client';

// Declare globalThis.prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const globalPrisma = global as unknown as { prisma: PrismaClient | undefined };
export const db = globalPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalPrisma.prisma = db;
}
