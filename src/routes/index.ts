/**
 * Routes Index
 * Central export for all route modules
 */

// API routes
export * from './api';

// Page routes
export { default as pageRoutes } from './pages';

// Auth routes (OAuth flows)
export { default as oauthFlowRoutes } from './auth/oauth';

// Advanced features
export { default as advancedFeaturesRoutes } from './advanced-features';
export { default as totpRoutes } from './totp';
export { default as biometricsAuthRoutes } from './biometrics';
