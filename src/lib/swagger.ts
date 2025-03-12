// import { createSwaggerSpec } from 'next-swagger-doc';

const apiVersion = process.env.npm_package_version || '0.1.0';

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MoodMash API Documentation',
      version: apiVersion,
      description: 'API documentation for the MoodMash application',
      contact: {
        name: 'MoodMash Support',
        url: 'https://moodmash.com/support',
        email: 'support@moodmash.com',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        description: 'MoodMash API Server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token',
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
    tags: [
      {
        name: 'User',
        description: 'User-related operations',
      },
      {
        name: 'Preferences',
        description: 'User preferences operations',
      },
      {
        name: 'Dashboard',
        description: 'Dashboard data operations',
      },
      {
        name: 'Notifications',
        description: 'Notification operations',
      },
      {
        name: 'Health',
        description: 'System health operations',
      },
    ],
  },
  apis: ['./src/pages/api/**/*.ts', './src/pages/api/**/*.js'],
};

/**
 * Generate Swagger specification
 */
export function getSwaggerSpec() {
  // Return the options directly instead of using createSwaggerSpec
  return swaggerOptions.definition;
}
