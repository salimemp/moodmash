import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db/prisma';

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Check API health status
 *     description: Returns the health status of the API and database
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                   description: Health status of the API
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: '2023-01-01T12:00:00.000Z'
 *                   description: Current server timestamp
 *                 environment:
 *                   type: string
 *                   example: development
 *                   description: Current environment
 *                 version:
 *                   type: string
 *                   example: '0.1.0'
 *                   description: API version
 *       503:
 *         description: API is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: unhealthy
 *                   description: Current health status
 *                 message:
 *                   type: string
 *                   example: Database connection failed
 *                   description: Reason for unhealthy status
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: '2023-01-01T12:00:00.000Z'
 *                   description: Current server timestamp
 */

/**
 * Health check endpoint
 * Returns 200 OK if the API is working correctly
 * Also tests database connectivity
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;

    // Return health information
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',
    });
  } catch (error) {
    console.error('Health check failed:', error);

    // Return error status
    return res.status(503).json({
      status: 'unhealthy',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
}
