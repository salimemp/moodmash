import { NextApiRequest, NextApiResponse } from 'next';
import * as Sentry from '@sentry/nextjs';

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void | NextApiResponse>;

/**
 * Wraps an API handler with error handling logic
 * @param handler The API route handler function
 * @returns A wrapped handler with error handling
 */
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      return await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);

      // Capture the error with Sentry
      Sentry.captureException(error);

      // Handle known API errors
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      // Handle unexpected errors
      const statusCode = 500;
      const message = 'Internal Server Error';

      res.status(statusCode).json({
        error: message,
      });
      return;
    }
  };
}

/**
 * Creates a standardized error response
 * @param res The NextApiResponse object
 * @param statusCode HTTP status code
 * @param message Error message
 */
export function errorResponse(res: NextApiResponse, statusCode: number, message: string): void {
  res.status(statusCode).json({
    error: message,
  });
}

/**
 * Utility to handle validation errors
 * @param res The NextApiResponse object
 * @param errors Validation error messages
 */
export function validationErrorResponse(
  res: NextApiResponse,
  errors: Record<string, string>
): void {
  res.status(400).json({
    error: 'Validation Error',
    errors,
  });
}
