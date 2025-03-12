import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromReq } from '@/lib/auth/utils';
import { rateLimit } from '@/lib/auth/rate-limit';
import { Session } from 'next-auth';

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiHandlerOptions {
  requireAuth?: boolean;
  methods: ApiMethod[];
  rateLimitType?: Parameters<typeof rateLimit>[2];
}

interface ApiContext {
  session: Session | null;
  userId: string | null;
}

type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  context: ApiContext
) => Promise<void> | void;

/**
 * Creates an API route handler with standardized error handling, authentication, and rate limiting
 */
export function createApiHandler(options: ApiHandlerOptions, handler: ApiHandler) {
  const { methods, requireAuth = true, rateLimitType = 'general' } = options;

  return async function apiRouteHandler(req: NextApiRequest, res: NextApiResponse) {
    // Method validation
    if (!methods.includes(req.method as ApiMethod)) {
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }

    // Apply rate limiting
    const rateLimitPassed = await rateLimit(req, res, rateLimitType);
    if (!rateLimitPassed) return;

    // Set up context object
    const context: ApiContext = {
      session: null,
      userId: null,
    };

    try {
      // Authentication check if required
      if (requireAuth) {
        context.session = await getSessionFromReq(req, res);
        context.userId = context.session?.user?.id || null;

        if (!context.userId) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
      } else if (req.method !== 'GET') {
        // Optional auth - still get session if available
        context.session = await getSessionFromReq(req, res);
        context.userId = context.session?.user?.id || null;
      }

      // Execute the handler with context
      await handler(req, res, context);
    } catch (error) {
      console.error('API route error:', error);

      // Don't override if response has already been sent
      if (res.writableEnded) return;

      // Provide appropriate error response
      const statusCode = error instanceof ApiError ? error.statusCode : 500;
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';

      res.status(statusCode).json({ message });
    }
  };
}

/**
 * Custom API error class with status code
 */
export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }

  static badRequest(message = 'Bad request') {
    return new ApiError(message, 400);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(message, 403);
  }

  static notFound(message = 'Not found') {
    return new ApiError(message, 404);
  }

  static methodNotAllowed(message = 'Method not allowed') {
    return new ApiError(message, 405);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(message, 409);
  }

  static serverError(message = 'Internal server error') {
    return new ApiError(message, 500);
  }
}
