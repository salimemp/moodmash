import { vi } from 'vitest'

// Mock modules
vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/auth/utils', () => ({
  getSessionFromReq: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  db: {
    credential: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
})) 